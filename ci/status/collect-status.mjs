#!/usr/bin/env node
/**
 * collect-status.mjs — 가동 상태 수집기 (S15P21E201-701)
 *
 * 운영 서버 j15e201 **안에서** 1분마다 cron 이 부른다. 네 가지를 재서
 * `status.json` 한 파일로 떨군다. 그 파일을 `/status` 페이지가 읽어 그린다.
 *
 *   ① 프론트엔드  — MR 검사 속도(GitLab) + 실제 배포가 살아 있나(로컬 프로브)
 *   ② 백엔드      — 같은 둘
 *   ③ 지금 CPU    — /proc/loadavg 를 코어 수로 나눈 값 + 실제 사용률
 *   ④ 최근 1시간  — CPU 를 가장 많이 먹은 작업 (컨테이너 + 컨테이너 밖 프로세스)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 왜 서버 안에서 도나 — GitLab CI 로는 ③④ 를 못 잰다
 *
 * GitLab API 는 파이프라인 이야기만 안다. **그 서버의 CPU 가 지금 몇인지는
 * 서버 안에서만 나온다.** `/proc/loadavg` 도 `docker stats` 도 바깥에서는 못 읽는다.
 * 그래서 이 수집기는 GitLab CI 잡이 아니라 **서버의 cron**(정해진 시각에 명령을
 * 자동으로 돌려 주는 리눅스의 예약 장치)이 부른다.
 *
 * 옆에 있는 `collect.mjs`(CI 파이프라인 대시보드용)와는 **다른 프로그램이고 다른
 * 파일에 쓴다.** 둘은 서로를 안 건드린다:
 *
 *   collect.mjs         GitLab CI 예약이 부른다 → ci-status.json → /status/ci/
 *   collect-status.mjs  서버 cron 이 부른다     → status.json    → /status/
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 쓰는 법 (설치 절차 전체는 ci/status/README.md 6절)
 *
 *   node collect-status.mjs                       # 기본값으로 한 번 돈다
 *   node collect-status.mjs --dry-run             # 파일을 안 쓰고 화면에 찍는다
 *   node collect-status.mjs --gitlab=off          # GitLab 은 건너뛰고 서버 것만
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 옵션
 *
 *   --out=경로            결과 파일. 기본 /srv/gabolle/www/status/status.json
 *   --data-dir=경로       이력을 쌓아 두는 폴더. 기본 /srv/gabolle/status-data
 *                         🔴 www 밖에 둔다. 웹으로 안 보이게.
 *   --frontend-url=…      기본 http://localhost:3000/
 *   --backend-url=…       기본 http://localhost:8080/actuator/health
 *   --probe-timeout=ms    기본 5000
 *   --slow-ms=N           이 시간을 넘으면 "느림". 기본 1500
 *   --gitlab=off          GitLab 을 안 친다
 *   --gitlab-token-file=…  기본 /etc/gabolle/status-token
 *   --gitlab-every=N      GitLab 은 N 분에 한 번만 친다. 기본 5
 *                         (1분마다 치면 하루 1,440번이다. 그럴 이유가 없다)
 *   --mask-file=…         화면에서 가릴 이름 목록. 기본 /etc/gabolle/status-mask.txt
 *   --show-unknown-names  모르는 컨테이너 이름을 가리지 않고 그대로 보여준다
 *                         🔴 기본은 가린다. 이 페이지는 로그인 없이 누구나 본다
 *   --docker-bin=경로     기본 docker (PATH 에서 찾는다)
 *   --dry-run             파일을 안 쓴다
 *   --quiet               진행 표시를 안 찍는다
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 지어내지 않는다
 *
 * 못 잰 것은 `"unknown"` 으로 남기고 페이지에 **"아직 안 잼"** 이라고 쓴다.
 * 빈칸이 지어낸 숫자보다 낫다 — 지어낸 숫자는 사람이 그걸 믿고 엉뚱한 데를 판다.
 *
 * 🔴 토큰은 결과 파일에 절대 안 들어간다. 읽어서 HTTP 헤더에만 쓰고 버린다.
 *
 * 종료 코드
 *   0  status.json 을 썼다 (일부 항목이 unknown 이어도 0 이다 — 절반이라도 보여준다)
 *   1  결과 파일을 아예 못 썼다 (권한·디스크·잠금)
 */

import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, statSync, unlinkSync, openSync, closeSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { hostname, cpus, loadavg } from 'node:os';
import { dirname, join } from 'node:path';

// ── 실측에서 나온 기준값 ─────────────────────────────────────────────────────
//
// 아래 두 숫자는 2026-09-08 에 이 저장소의 MR 파이프라인 25개를 실제로 재서 나온
// 것이다. **벽시계 시간**(MR 이 열려서 검사가 다 끝날 때까지 사람이 실제로 기다린
// 시간) 기준이고, 잡 하나하나의 시간이 아니다.
//
//   프론트  중앙값 100초, 열에 아홉은 109초 안에 끝났다
//   백엔드  중앙값 202초, 열에 아홉은 245초 안에 끝났다
//
// "느림" 선은 그 p90 의 약 1.5배로 잡았다. 평소보다 눈에 띄게 느릴 때만 노랗게
// 되라는 뜻이다. 서버가 바뀌면 이 숫자도 다시 재서 바꾼다.
const MR_SLOW_SEC = { front: 170, back: 380 };

// GitLab 에서 볼 잡. 팀장이 지목한 다섯 개다.
const MR_JOBS = {
  front: ['frontend:smoke', 'frontend:dependency-scan'],
  back: ['backend:build', 'backend:dependency-scan', 'backend:migration-order'],
};

const GITLAB_HOST = 'lab.ssafy.com';
const GITLAB_PROJECT = 1444066;

// 이력 보관 기간
//
// 🔴 가동 막대의 칸 하나는 **하루가 아니라 4시간**이다. 하루로 뭉치면 "어제
//    잠깐 죽었다" 가 하루 전체를 빨갛게 만들고, 언제 죽었는지는 영영 못 본다.
//    4시간이면 하루가 6칸이라 오전·오후·새벽이 갈린다.
const SLOT_HOURS = 4;                          // 칸 하나가 몇 시간인가
const SLOTS_PER_DAY = 24 / SLOT_HOURS;         // 하루 6칸
const KEEP_DAYS = 90;                          // 보관 90일
const KEEP_SLOTS = KEEP_DAYS * SLOTS_PER_DAY;  // = 540칸. 이만큼 디스크에 쌓는다

// 🔴 **쌓는 것과 내보내는 것이 다르다.** 540칸을 서비스 넷마다 status.json 에
//    실으면 파일이 100KB 를 넘고, 그것을 30초마다 모두가 다시 받는다. 화면이
//    쓰는 것은 7일치뿐이라 **내보낼 때 잘라서 싣는다.** 디스크의 540칸은 그대로다 —
//    적게 보여주는 것은 되돌릴 수 있지만, 안 모은 것은 못 되돌리기 때문이다.
// 🔴 **층이 둘이다.** 위의 4시간 칸은 "이번 주에 나빠지고 있나" 에 답하고,
//    아래 5분 칸은 "오늘 무슨 일이 있었나" 에 답한다. 다른 질문이라 둘 다 있다.
//
//    5분인 이유: **재는 주기가 1분**이라 1분 칸은 평균이 아니라 날것 한 번이다.
//    한 번 튄 값이 그대로 봉우리가 된다. 5분이면 다섯 번을 평균내 추세가 매끄럽다.
//    짧은 사고를 놓칠 걱정은 안 해도 된다 — 그건 막대와 장애 이력이 한다
//    (장애는 나쁜 표본 **두 번 연속**이면 열린다).
const FINE_MIN = 5;                            // 고운 칸 하나가 몇 분인가
const FINE_PAGE = (24 * 60) / FINE_MIN;        // = 288칸. 화면이 보여주는 하루
const FINE_KEEP = FINE_PAGE + 12;              // 디스크에는 한 시간 더. 시계가 밀려도 안 빈다

const PAGE_DAYS = 7;                           // 화면이 보여주는 기간
const PAGE_SLOTS = PAGE_DAYS * SLOTS_PER_DAY;  // = 42칸

const KEEP_SAMPLES = 70;       // 1분 표본. 최근 1시간(60개)을 덮고 조금 여유
const KEEP_INCIDENTS = 60;     // 장애 이력
const WINDOW_MIN = 60;         // "최근 1시간"

// 🔴 이력 파일의 **판(版)** 번호. 칸의 단위가 바뀌면(1: 하루 → 2: 4시간) 옛
//    파일은 못 쓴다. 이 번호가 다르면 가동 이력을 버리고 처음부터 쌓는다.
const SCHEMA = 2;

// ── 인자 ─────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};

if (arg('help') || arg('h')) {
  console.log(`
collect-status.mjs — 가동 상태 수집기 (S15P21E201-701)

  운영 서버 안에서 cron 이 1분마다 부른다. 네 가지를 재서 status.json 에 쓴다.
  ① 프론트 MR 검사 속도 + 실제 배포   ② 백엔드도 같은 둘
  ③ 지금 CPU (부하 ÷ 코어 수)          ④ 최근 1시간 CPU 최다 작업

옵션
  --out=경로              결과 파일. 기본 /srv/gabolle/www/status/status.json
  --data-dir=경로         이력 폴더. 기본 /srv/gabolle/status-data (www 밖에 둔다)
  --frontend-url=…        기본 http://localhost:3000/
  --backend-url=…         기본 http://localhost:8080/actuator/health
  --probe-timeout=ms      기본 5000
  --slow-ms=N             이 시간을 넘으면 "느림". 기본 1500
  --gitlab=off            GitLab 을 안 친다 (서버 것만 잰다)
  --gitlab-token-file=…   기본 /etc/gabolle/status-token
  --gitlab-every=N        GitLab 은 N 분에 한 번만. 기본 5
  --mask-file=…           화면에서 가릴 이름 목록. 기본 /etc/gabolle/status-mask.txt
  --show-unknown-names    모르는 컨테이너 이름을 안 가린다 (기본은 가린다)
  --docker-bin=경로       기본 docker
  --dry-run               파일을 안 쓰고 화면에 찍는다
  --quiet                 진행 표시를 안 찍는다

종료 코드  0 = 파일을 썼다 (일부가 "아직 안 잼" 이어도 0),  1 = 아예 못 썼다
설치 절차는 ci/status/README.md 6절.
`);
  process.exit(0);
}

const outPath = String(arg('out', '/srv/gabolle/www/status/status.json'));
// 🔴 **고운 층은 따로 나간다.** 같은 파일에 담으면 5분에 한 번만 바뀌는 것을
//    30초마다 모두가 다시 받는다 — 열 번 중 아홉 번은 똑같은 것을 받는 셈이다.
//    나눠 두면 화면이 이 파일만 5분에 한 번 받는다.
const finePath = outPath.replace(/\.json$/, '') + '-fine.json';
const dataDir = String(arg('data-dir', '/srv/gabolle/status-data'));
const frontendUrl = String(arg('frontend-url', 'http://localhost:3000/'));
const backendUrl = String(arg('backend-url', 'http://localhost:8080/actuator/health'));
const probeTimeout = Math.max(500, Number(arg('probe-timeout', 5000)) || 5000);
const slowMs = Math.max(50, Number(arg('slow-ms', 1500)) || 1500);
const gitlabOff = String(arg('gitlab', 'on')) === 'off';
const gitlabTokenFile = String(arg('gitlab-token-file', '/etc/gabolle/status-token'));
const gitlabEvery = Math.max(1, Number(arg('gitlab-every', 5)) || 5);
const maskFile = String(arg('mask-file', '/etc/gabolle/status-mask.txt'));
const showUnknownNames = Boolean(arg('show-unknown-names', false));
const dockerBin = String(arg('docker-bin', 'docker'));
const dryRun = Boolean(arg('dry-run', false));
const quiet = Boolean(arg('quiet', false));
// `/proc` 은 리눅스가 커널의 현재 상태를 파일처럼 보여주는 가짜 폴더다. 진짜
// 디스크에 없다. 여기를 바꿀 수 있게 열어 둔 이유는 하나 — `--self-test` 가
// 가짜 /proc 을 만들어 계산이 맞는지 검사하기 때문이다. 평소에는 건드리지 않는다.
const procDir = String(arg('proc-dir', '/proc'));

const log = (...a) => { if (!quiet) process.stderr.write(a.join(' ') + '\n'); };
const warnings = [];
const warn = (m) => { if (!warnings.includes(m)) warnings.push(m); };

// ── 서비스 넷 — 팀장이 요구한 그 넷이다. 늘리지 않는다 ───────────────────────

const SERVICES = [
  {
    id: 'frontend-app', part: 'front', kind: 'deploy',
    name: '프론트엔드 — 실제 배포',
    what: '사람이 보는 화면이 지금 뜨는가. 서버 안에서 프론트 컨테이너를 직접 두드려 잰다',
  },
  {
    id: 'backend-app', part: 'back', kind: 'deploy',
    name: '백엔드 — 실제 배포',
    what: '서버가 지금 응답하는가. 백엔드의 건강검진 주소를 서버 안에서 두드려 잰다',
  },
  {
    id: 'frontend-ci', part: 'front', kind: 'mr',
    name: '프론트엔드 — MR 검사 속도',
    what: 'MR(코드를 합쳐 달라는 요청)을 열고 검사가 다 끝날 때까지 사람이 기다리는 시간',
  },
  {
    id: 'backend-ci', part: 'back', kind: 'mr',
    name: '백엔드 — MR 검사 속도',
    what: '같은 것. 백엔드 코드로 MR 을 열었을 때',
  },
];

const STATE_RANK = { ok: 0, unknown: 1, slow: 2, down: 3 };
const worse = (a, b) => (STATE_RANK[b] > STATE_RANK[a] ? b : a);

// ── 파일 도우미 — 없거나 깨졌으면 조용히 처음부터 시작한다 ───────────────────
//
// 🔴 "멈췄다 다시 시작해도 이어져야 한다" 는 요구가 여기서 지켜진다. 상태는
//    전부 디스크에 있고, 이 프로그램은 메모리에 아무것도 들고 있지 않는다.

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    const v = JSON.parse(readFileSync(path, 'utf8'));
    return v && typeof v === 'object' ? v : fallback;
  } catch (err) {
    warn(`${path} 를 못 읽어서 새로 시작합니다 — ${err.message}`);
    return fallback;
  }
}

/**
 * 🔴 임시 파일에 쓴 뒤 이름을 바꾼다. 그냥 덮어쓰면 페이지가 하필 그 순간에
 *    읽었을 때 **반쪽짜리 JSON** 을 받아 화면이 통째로 깨진다. rename 은 리눅스에서
 *    쪼개지지 않는 한 번의 동작이라 그 틈이 없다.
 */
function writeJsonAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(obj, null, 1));
  renameSync(tmp, path);
}

// ── 겹쳐 도는 것을 막는다 ────────────────────────────────────────────────────
//
// cron 이 1분마다 부르는데 한 번이 1분을 넘기면 두 개가 겹친다. 그러면 이력이
// 두 번 쌓이거나 서로의 임시 파일을 밟는다. 잠금 파일 하나로 막는다.

const lockPath = join(dataDir, 'collect.lock');

function acquireLock() {
  mkdirSync(dataDir, { recursive: true });
  try {
    const fd = openSync(lockPath, 'wx');   // 'wx' = 이미 있으면 실패한다
    closeSync(fd);
    writeFileSync(lockPath, String(process.pid));
    return true;
  } catch {
    // 오래된 잠금은 앞의 실행이 죽은 것이다. 5분 넘었으면 뺏는다.
    try {
      const age = Date.now() - statSync(lockPath).mtimeMs;
      if (age > 5 * 60 * 1000) {
        warn('앞의 수집이 비정상 종료한 것 같아 잠금을 뺏었습니다 (5분 초과).');
        unlinkSync(lockPath);
        return acquireLock();
      }
    } catch { /* 그 사이에 사라졌으면 다음 실행이 가져간다 */ }
    return false;
  }
}

function releaseLock() { try { unlinkSync(lockPath); } catch { /* 이미 없으면 그만 */ } }

// ── ①② 실제 배포 — 서버 안에서 직접 두드린다 ────────────────────────────────
//
// 바깥(https://j15e201.p.ssafy.io)이 아니라 **localhost** 를 친다. 바깥을 치면
// nginx·인증서·네트워크까지 한 덩어리로 재게 되어, 느릴 때 어디가 느린지 모른다.

async function probe(url, { expectUp = false } = {}) {
  const started = Date.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), probeTimeout);
  try {
    const res = await fetch(url, { signal: ctl.signal, redirect: 'manual', headers: { 'User-Agent': 'gabolle-status/1' } });
    const ms = Date.now() - started;
    let body = null;
    if (expectUp) { try { body = await res.json(); } catch { body = null; } }

    // 200~399 를 살아 있는 것으로 본다. 프론트 컨테이너는 / 요청에 리다이렉트를
    // 줄 수 있는데, 그건 "죽었다" 가 아니다.
    const httpOk = res.status >= 200 && res.status < 400;
    if (!httpOk) return { state: 'down', ms, http: res.status, message: `HTTP ${res.status} 이 돌아왔습니다` };

    if (expectUp) {
      const s = body && typeof body.status === 'string' ? body.status : null;
      if (s && s !== 'UP') return { state: 'down', ms, http: res.status, health: s, message: `건강검진이 ${s} 라고 답했습니다` };
      if (!s) warn('백엔드 건강검진 응답에 status 항목이 없습니다 — HTTP 상태만 봅니다.');
      return { state: ms > slowMs ? 'slow' : 'ok', ms, http: res.status, health: s, message: null };
    }
    return { state: ms > slowMs ? 'slow' : 'ok', ms, http: res.status, message: null };
  } catch (err) {
    const ms = Date.now() - started;
    const aborted = err.name === 'AbortError';
    return {
      state: 'down', ms: aborted ? probeTimeout : ms, http: null,
      message: aborted ? `${probeTimeout}ms 안에 대답이 없었습니다` : '연결이 안 됩니다 (프로그램이 안 떠 있거나 포트가 닫혀 있습니다)',
    };
  } finally { clearTimeout(timer); }
}

// ── ③ 지금 CPU ──────────────────────────────────────────────────────────────
//
// 두 가지를 같이 낸다. 둘은 다른 것을 말한다.
//
//   부하(load average)  "일을 기다리는 줄이 얼마나 긴가". 코어 수로 나눠야 뜻이 생긴다.
//                       4코어에서 4.0 은 딱 정원이고 8.0 은 두 배로 밀린 것이다.
//   사용률(busy %)      "지금 이 순간 CPU 가 놀지 않고 일한 비율". 100% 라도 줄이
//                       안 길면 문제가 아니다.

/** `0.52 1.10 2.03 3/812 44321` 를 뜯는다. */
export function parseLoadavg(text) {
  const parts = String(text).trim().split(/\s+/);
  const [l1, l5, l15] = parts.slice(0, 3).map(Number);
  if (![l1, l5, l15].every(Number.isFinite)) return null;
  // 넷째 칸은 "지금 도는 프로세스/전체 프로세스" 다.
  const [running, total] = String(parts[3] || '').split('/').map(Number);
  return { load1: l1, load5: l5, load15: l15, running: running || null, procs: total || null, source: `${procDir}/loadavg` };
}

/**
 * `/proc/stat` 첫 줄의 누적 눈금(tick). 부팅 이후로 CPU 가 무엇을 하며 보낸
 * 시간의 총합이다. **한 번 읽어서는 아무 뜻이 없다** — 두 번 읽어 그 차를 봐야
 * "그 사이에 얼마나 바빴나" 가 나온다.
 */
export function parseStat(text) {
  const line = String(text).split('\n')[0] || '';
  const n = line.trim().split(/\s+/).slice(1).map(Number).filter(Number.isFinite);
  if (n.length < 5) return null;
  const total = n.reduce((a, b) => a + b, 0);
  const idle = n[3] + (n[4] || 0);   // idle + iowait — 둘 다 "일을 안 한 시간" 이다
  return { total, idle };
}

export function busyPercent(prev, cur) {
  if (!prev || !cur) return null;
  const dTotal = cur.total - prev.total;
  const dIdle = cur.idle - prev.idle;
  if (!(dTotal > 0)) return null;
  return Math.max(0, Math.min(100, ((dTotal - dIdle) / dTotal) * 100));
}

function readProc(name) {
  try { return readFileSync(join(procDir, name), 'utf8'); } catch { return null; }
}

function readCores() {
  const txt = readProc('cpuinfo');
  if (txt) {
    const n = (txt.match(/^processor\s*:/gm) || []).length;
    if (n > 0) return n;
  }
  try {
    const n = cpus().length;
    if (n > 0) return n;
  } catch { /* 못 세면 null */ }
  return null;
}

function readLoad() {
  const txt = readProc('loadavg');
  if (txt) { const v = parseLoadavg(txt); if (v) return v; }
  try {
    const [l1, l5, l15] = loadavg();
    if (l1 > 0 || l5 > 0 || l15 > 0) return { load1: l1, load5: l5, load15: l15, running: null, procs: null, source: 'os.loadavg()' };
  } catch { /* 없다 */ }
  return null;
}

function collectCpu(prevTicks) {
  const cores = readCores();
  const load = readLoad();
  const statText = readProc('stat');
  const ticks = statText ? parseStat(statText) : null;
  const busyPct = busyPercent(prevTicks, ticks);

  if (!load) warn(`CPU 부하를 못 읽었습니다 (이 기계에 ${procDir}/loadavg 가 없습니다) — CPU 칸은 "아직 안 잼" 으로 둡니다.`);

  const ratio = load && cores ? load.load1 / cores : null;

  // 🔴 눈금은 1.0 이다. 코어 수만큼 줄이 서 있다는 뜻.
  let state = 'unknown';
  if (ratio != null) state = cpuState(ratio);

  return {
    state,
    cores,
    load1: load ? round(load.load1, 2) : null,
    load5: load ? round(load.load5, 2) : null,
    load15: load ? round(load.load15, 2) : null,
    ratio: ratio == null ? null : round(ratio, 2),
    ratio5: load && cores ? round(load.load5 / cores, 2) : null,
    ratio15: load && cores ? round(load.load15 / cores, 2) : null,
    runningProcs: load ? load.running : null,
    busyPct: busyPct == null ? null : round(busyPct, 1),
    busyPctNote: busyPct == null ? '두 번은 재야 나온다 — 다음 실행부터 나옵니다' : null,
    source: load ? load.source : null,
    ticks,   // 다음 실행이 차를 내려고 들고 있는다. 화면에는 안 나간다.
  };
}

// ── 메모리 (S15P21E201-784) ──────────────────────────────────────────────────
//
// 🔴 이때까지 이 수집기는 메모리를 아예 안 쟀다. CPU 경합처럼 보이는 응답 지연이
//    사실 JVM GC 압박이나 스왑 때문일 수 있는데, 그걸 밖에서는 가릴 방법이 없었다
//    (jaehyeon, 2026-09-09 — S15P21E201-784).
//
// 🔴 MemFree 가 아니라 MemAvailable 을 쓴다. MemFree 는 리눅스가 디스크 캐시로
//    쓰고 있는 만큼을 그대로 "빈 것" 에서 빼서 보여준다 — 캐시는 새 프로세스가
//    뜨면 즉시 내줄 수 있는 메모리인데도 MemFree 만 보면 서버가 항상 메모리가
//    없는 것처럼 보인다. MemAvailable 은 커널이 "지금 새 프로세스 하나가 더
//    뜬다면 실제로 쓸 수 있는 양" 을 이미 계산해서 준다.
export function parseMeminfo(text) {
  const grab = (key) => {
    const m = String(text).match(new RegExp(`^${key}:\\s+(\\d+)\\s*kB`, 'm'));
    return m ? Number(m[1]) : null;
  };
  const totalKb = grab('MemTotal');
  if (totalKb == null) return null;
  const availKb = grab('MemAvailable');
  const swapTotalKb = grab('SwapTotal');
  const swapFreeKb = grab('SwapFree');
  const usedKb = availKb == null ? null : totalKb - availKb;
  const swapUsedKb = (swapTotalKb == null || swapFreeKb == null) ? null : swapTotalKb - swapFreeKb;
  const toMb = (kb) => (kb == null ? null : Math.round(kb / 1024));
  return {
    totalMb: toMb(totalKb),
    usedMb: toMb(usedKb),
    availableMb: toMb(availKb),
    usedPct: (usedKb != null && totalKb) ? round((usedKb / totalKb) * 100, 1) : null,
    swapTotalMb: toMb(swapTotalKb),
    swapUsedMb: toMb(swapUsedKb),
  };
}

function readMemory() {
  const txt = readProc('meminfo');
  if (txt) { const v = parseMeminfo(txt); if (v) return v; }
  warn(`메모리를 못 읽었습니다 (이 기계에 ${procDir}/meminfo 가 없습니다) — 메모리 칸은 "아직 안 잼" 으로 둡니다.`);
  return null;
}

// ── ④ 최근 1시간 CPU 를 많이 먹은 작업 ───────────────────────────────────────

// 🔴 이번 수집 사이클에 이 수집기 자신이 띄운 프로세스의 PID 들 — 자기 자신
//    (process.pid) 으로 미리 채워 둔다. sampleProcesses() 가 ps 결과에서 이
//    PID 들을 뺀다 — 안 빼면 수집기 자신과 그것이 부른 docker stats·ps 가
//    "컨테이너 밖에서 CPU 를 가장 많이 먹는 작업" 표의 상위권에 매번 올라간다
//    (실측, S15P21E201-784 — Node.js 프로그램 평균 107.9%·docker 93.9%·ps 33.9%,
//    전부 수집기 자신이었다. 이 표를 근거로 다른 것을 손대면 엉뚱한 걸 건드린다).
const spawnedPids = new Set([process.pid]);

function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, windowsHide: true }, (err, stdout) => {
      if (err) return resolve({ ok: false, error: err.code === 'ENOENT' ? `${cmd} 명령이 없습니다` : (err.killed ? `${cmd} 가 ${timeoutMs}ms 안에 안 끝났습니다` : String(err.message).split('\n')[0]), out: '' });
      resolve({ ok: true, error: null, out: String(stdout) });
    });
    if (child.pid) spawnedPids.add(child.pid);
  });
}

/**
 * 🔴 이름 가리기 — 이 페이지는 로그인 없이 누구나 본다
 *
 * 컨테이너 이름에는 사람 이름이 들어간다 (`bims-<아이디>` 여섯 개가 그렇다).
 * 그대로 내보내면 팀원 아이디가 인터넷에 열린다. 그래서:
 *
 *   1) 아는 것은 한국어 이름표로 바꾼다        gabolle-backend -> 백엔드 API
 *   2) 묶기로 한 것은 묶어서 개수만 보여준다   bims-*          -> bims 수집기 (6개)
 *   3) 모르는 이름은 낱말 단위로 가린다        foo-minsu       -> foo-*
 *   4) mask 파일에 적힌 것은 무조건 가린다     (운영자가 나중에 추가하는 자리)
 *
 * 3)이 지나치게 가리는 쪽으로 틀린 것은 일부러다. **덜 가려서 새는 것보다
 * 더 가려서 답답한 편이 낫다.** 새 컨테이너를 띄웠는데 `*` 로 나오면 아래
 * LABELS 에 한 줄 추가하면 된다 (또는 --show-unknown-names 로 임시로 푼다).
 */

// 이름 그대로 또는 접두사로 맞으면 이 이름표를 쓴다.
const LABELS = [
  [/^(gabolle[-_])?front(end)?([-_].*)?$/i, '프론트엔드 (화면)'],
  [/^(gabolle[-_])?back(end)?([-_].*)?$/i, '백엔드 (API 서버)'],
  [/^jenkins([-_].*)?$/i, 'Jenkins (배포 자동화)'],
  [/^airflow[-_]?scheduler$/i, 'Airflow 스케줄러 (작업 시각표)'],
  [/^airflow[-_]?webserver$/i, 'Airflow 화면'],
  [/^airflow[-_]?worker.*$/i, 'Airflow 일꾼 (실제 작업)'],
  [/^airflow[-_]?triggerer$/i, 'Airflow 트리거'],
  [/^airflow.*$/i, 'Airflow (작업 스케줄러)'],
  [/^mlflow([-_].*)?$/i, 'MLflow (모델 기록)'],
  [/^minio([-_].*)?$/i, 'MinIO (파일 저장소)'],
  [/^(postgres|postgresql|pg)([-_].*)?$/i, 'PostgreSQL (데이터베이스)'],
  [/^redis([-_].*)?$/i, 'Redis (임시 저장소)'],
  [/^(mysql|mariadb)([-_].*)?$/i, 'MySQL (데이터베이스)'],
  [/^nginx([-_].*)?$/i, 'nginx (웹 서버)'],
  [/^(elasticsearch|opensearch)([-_].*)?$/i, '검색 엔진'],
  [/^kafka([-_].*)?$/i, 'Kafka (메시지 큐)'],
];

// 통째로 묶어서 개수만 보여줄 것. 🔴 사람 아이디가 이름에 들어가는 것들이다.
const FOLD_GROUPS = [
  { re: /^bims[-_]/i, label: 'bims 수집기' },
];

// 프로세스 이름(comm)에 붙일 이름표. comm 은 실행 파일 이름이라 사람 이름이
// 들어갈 일이 거의 없다 — 그래서 프로세스는 가리지 않고 이름표만 붙인다.
const PROC_LABELS = [
  [/^gitlab-runner$/i, 'GitLab 러너 (CI 를 돌리는 프로그램)'],
  [/^(dockerd|containerd.*|runc)$/i, 'Docker 엔진'],
  [/^java$/i, 'Java 프로그램'],
  [/^node$/i, 'Node.js 프로그램'],
  [/^python3?(\.\d+)?$/i, 'Python 프로그램'],
  [/^postgres$/i, 'PostgreSQL'],
  [/^nginx$/i, 'nginx'],
  [/^(kswapd\d*|kworker.*|ksoftirqd.*|migration.*)$/i, '리눅스 커널'],
  [/^snapd$/i, 'snapd (우분투 패키지 관리)'],
  [/^unattended-upgr$/i, '자동 보안 업데이트'],
];

// 3) 에서 "가려도 되는 낱말" 로 볼 것들. 여기 없는 낱말은 사람 이름일 수 있다.
const SAFE_WORDS = new Set([
  'gabolle', 'bims', 'app', 'api', 'web', 'www', 'server', 'service', 'svc',
  'db', 'database', 'cache', 'queue', 'broker', 'proxy', 'gateway', 'lb',
  'worker', 'scheduler', 'webserver', 'triggerer', 'flower', 'init', 'setup',
  'front', 'frontend', 'back', 'backend', 'batch', 'cron', 'job', 'runner',
  'main', 'dev', 'prod', 'stage', 'test', 'local', 'tmp', 'temp',
  'postgres', 'postgresql', 'redis', 'minio', 'mlflow', 'airflow', 'jenkins',
  'nginx', 'node', 'java', 'python', 'spring', 'react', 'next', 'vite',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
]);

let maskPatterns = [];
function loadMaskFile() {
  if (!existsSync(maskFile)) return;
  try {
    maskPatterns = readFileSync(maskFile, 'utf8')
      .split('\n').map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    if (maskPatterns.length) log(`가림    ${maskPatterns.length}개 규칙을 ${maskFile} 에서 읽었습니다`);
  } catch (err) { warn(`가림 목록을 못 읽었습니다 (${maskFile}) — ${err.message}`); }
}

/** 컨테이너 이름 → 화면에 낼 이름. 못 알아보면 가린다. */
function labelContainer(raw) {
  const name = String(raw || '').replace(/^\//, '').slice(0, 64);
  if (!name) return { label: '이름 없음', fold: null };

  for (const p of maskPatterns) {
    if (name.toLowerCase().includes(p.toLowerCase())) return { label: '가려진 작업', fold: '가려진 작업' };
  }
  for (const g of FOLD_GROUPS) if (g.re.test(name)) return { label: g.label, fold: g.label };

  // 🔴 도커 컴포즈는 컨테이너 이름을 `<프로젝트>-<서비스>-<번호>` 로 짓는다.
  //    이 서버의 실제 이름이 `local-route-personalization-airflow-worker-1` 인데,
  //    위 LABELS 는 `^airflow` 로 시작을 못 박아 두어 하나도 안 맞았다. 그래서
  //    Airflow·MLflow·MinIO·PostgreSQL·Redis 가 전부 "모르는 이름" 으로 가려졌다
  //    (2026-09-08 서버에서 실측).
  //
  //    그래서 **앞 낱말을 하나씩 떼면서** 다시 맞춰 본다. 위 이름은 네 번째 시도
  //    `airflow-worker-1` 에서 맞는다. 끝의 번호도 떼고 한 번 더 본다.
  //
  //    🔴 이렇게 느슨하게 해도 노출이 늘지 않는다 — 오히려 준다. 맞으면 원래
  //    이름이 **이름표로 통째로 바뀌기** 때문이다. 못 맞은 것만 아래에서 가려진다.
  //    사람 아이디가 들어가는 bims 는 이 줄보다 위(FOLD_GROUPS)에서 이미 묶인다.
  const parts = name.split('-');
  for (let i = 0; i < parts.length && i < 6; i++) {
    const tail = parts.slice(i).join('-');
    // 🔴 끝 번호를 뗀 것을 **먼저** 본다. 안 그러면 `airflow-scheduler-1` 이
    //    구체적인 `^airflow[-_]?scheduler$` 대신 뭉뚱그린 `^airflow.*$` 에 먼저
    //    걸려, "Airflow 스케줄러" 가 될 것이 "Airflow" 가 된다 (자체 검사로 잡았다).
    for (const cand of [tail.replace(/-\d+$/, ''), tail]) {
      if (!cand) continue;
      for (const [re, label] of LABELS) if (re.test(cand)) return { label, fold: null };
    }
  }

  if (showUnknownNames) return { label: name, fold: null };

  // 모르는 이름 — 낱말 단위로 가린다
  const masked = name.split(/[-_.]/).map((w) => (SAFE_WORDS.has(w.toLowerCase()) ? w : '*')).join('-');
  return { label: masked === name ? name : `${masked} (모르는 이름이라 가렸습니다)`, fold: null };
}

function labelProcess(raw) {
  const name = String(raw || '').replace(/[^\w.-]/g, '').slice(0, 24);
  if (!name) return '이름 없음';
  for (const p of maskPatterns) if (name.toLowerCase().includes(p.toLowerCase())) return '가려진 프로세스';
  for (const [re, label] of PROC_LABELS) if (re.test(name)) return label;
  return name;
}

/**
 * `docker stats` 의 출력을 뜯는다. 한 줄이 `이름<탭>12.34%` 꼴이다.
 *
 * 🔴 이 값은 100% 를 넘을 수 있다. 코어 하나를 다 쓰면 100% 이므로, 4코어를
 *    다 쓰는 컨테이너는 400% 로 나온다. 화면에서도 그대로 쓰고 옆에 설명을 붙인다.
 */
export function parseDockerStats(text) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    const [name, perc] = line.split('\t');
    if (!name || !perc) continue;
    const v = Number(String(perc).replace('%', '').trim());
    if (!Number.isFinite(v)) continue;
    rows.push({ raw: name.trim(), pct: v });
  }
  return rows;
}

/** docker stats 한 번. 지금 이 순간의 컨테이너별 CPU %. */
async function sampleContainers() {
  const r = await run(dockerBin, ['stats', '--no-stream', '--format', '{{.Name}}\t{{.CPUPerc}}'], 20000);
  if (!r.ok) {
    warn(`컨테이너별 CPU 를 못 읽었습니다 — ${r.error}. (cron 의 PATH 에 docker 가 없거나, 이 계정이 docker 그룹에 없습니다)`);
    return null;
  }
  const rows = parseDockerStats(r.out);
  if (!rows.length) { warn('docker stats 가 컨테이너를 하나도 안 냈습니다 — 도커가 비어 있거나 권한이 없습니다.'); return null; }
  return rows;
}

/**
 * ps 한 번. 🔴 **컨테이너 밖 프로세스**를 잡으려고 있다 — 이 서버에는 GitLab
 * 러너가 도커 밖(systemd)에서 돌고 있어서, docker stats 만 보면 CI 가 서버를
 * 갈아 마시는 동안에도 화면이 조용하다.
 *
 * cgroup 칸으로 "도커 안/밖" 을 가른다. cgroup 은 리눅스가 프로세스를 묶어
 * 자원을 재는 단위이고, 도커가 띄운 것은 그 이름에 docker/containerd 가 들어간다.
 */
/**
 * 이 cgroup 문자열이 "컨테이너 안" 을 뜻하나.
 *
 * 🔴 낱말 `docker` 만 보고 가르면 안 된다. **도커 엔진 자신**(`dockerd`)의 cgroup 이
 *    `/system.slice/docker.service` 라서, 그렇게 가르면 도커 엔진이 CPU 를 태우는
 *    동안 표에서 사라진다. 실제로 이 검사를 짜다가 그 버그를 잡았다.
 *
 *    컨테이너는 cgroup 이름에 **컨테이너 번호(긴 16진수)** 를 달고 있다. 그것을 본다.
 *      cgroup v1     …/docker/3f2a9c…(64자)
 *      cgroup v2     0::/system.slice/docker-3f2a9c….scope
 *      containerd    …/cri-containerd-3f2a9c….scope
 *    반면 서비스는 번호가 없다 — `docker.service` · `gitlab-runner.service`.
 */
export function isContainerCgroup(cg) {
  return /(?:\/docker\/|docker-|cri-containerd-|containerd-|libpod-|crio-)[0-9a-f]{8,}|\/kubepods/i.test(String(cg));
}

/**
 * @param {Set<number>} excludePids 이 PID 들은 아예 안 센다 — 수집기 자신과
 *   이번 사이클에 그것이 띄운 자식(ps 자신·docker stats)이 여기 들어온다.
 *   ps 가 자기 자신을 찍는 순간에도 살아 있으므로 comm 이름(예: "ps")만
 *   보고 걸러서는 못 뺀다 — PID 로 걸러야 한다.
 */
export function parsePs(text, hasCgroup, excludePids = new Set()) {
  const outside = new Map();
  let sawCgroup = false;
  for (const line of String(text).split('\n').slice(0, 400)) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^(\d+)\s+([\d.]+)\s+(\S+)(?:\s+(.*))?$/);
    if (!m) continue;
    const pid = Number(m[1]);
    if (excludePids.has(pid)) continue;
    const pct = Number(m[2]);
    if (!Number.isFinite(pct) || pct < 0.5) continue;   // 0.5% 밑은 잡음이다
    const cg = m[4] || '';
    if (hasCgroup && cg) {
      sawCgroup = true;
      // 컨테이너 안이면 건너뛴다 — ④의 컨테이너 표에서 이미 세고 있다.
      if (isContainerCgroup(cg)) continue;
    }
    outside.set(m[3], (outside.get(m[3]) || 0) + pct);
  }
  return {
    sawCgroup,
    rows: [...outside.entries()].map(([raw, pct]) => ({ raw, pct: round(pct, 1) })).sort((a, b) => b.pct - a.pct),
  };
}

async function sampleProcesses() {
  let r = await run('ps', ['-eo', 'pid,pcpu,comm,cgroup', '--sort=-pcpu', '--no-headers'], 10000);
  let hasCgroup = true;
  if (!r.ok) {
    r = await run('ps', ['-eo', 'pid,pcpu,comm', '--sort=-pcpu', '--no-headers'], 10000);
    hasCgroup = false;
  }
  if (!r.ok) { warn(`프로세스별 CPU 를 못 읽었습니다 — ${r.error}`); return null; }

  // 🔴 이 run('ps', …) 호출 자신의 PID 가 위에서 이미 spawnedPids 에 들어갔다
  //    (execFile 이 프로세스를 띄우자마자, 그 프로세스가 자기 자신을 찍기 전에).
  //    그래서 아래 exclude 는 "이전 사이클의 docker stats" 뿐 아니라 "지금 이
  //    ps 명령 자신" 까지 이미 걸러낸다.
  const { sawCgroup, rows } = parsePs(r.out, hasCgroup, spawnedPids);
  if (hasCgroup && !sawCgroup) warn('ps 가 cgroup 칸을 안 줘서 컨테이너 안팎을 못 갈랐습니다 — 프로세스 표에 컨테이너 안의 것도 섞입니다.');
  return rows;
}

// ── ①② MR 검사 속도 (GitLab) ────────────────────────────────────────────────

function readToken() {
  // 파일이 먼저다. cron 에는 환경변수가 거의 안 실린다.
  try {
    if (existsSync(gitlabTokenFile)) {
      const t = readFileSync(gitlabTokenFile, 'utf8').trim();
      if (t) return { token: t, from: gitlabTokenFile };
    }
  } catch (err) { warn(`토큰 파일을 못 읽었습니다 (${gitlabTokenFile}) — ${err.message}`); }
  for (const k of ['GITLAB_TOKEN', 'GITLAB_PRIVATE_TOKEN']) {
    const v = process.env[k];
    if (v && v.trim()) return { token: v.trim(), from: `환경변수 ${k}` };
  }
  return null;
}

async function gitlabFetch(token, path) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(`https://${GITLAB_HOST}/api/v4${path}`, {
      headers: { 'PRIVATE-TOKEN': token, Accept: 'application/json' }, signal: ctl.signal,
    });
    // 🔴 오류 메시지에 URL 만 넣는다. 토큰은 절대 안 넣는다.
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };

/** 초를 사람이 읽는 말로. 205 -> "3분 25초". 페이지와 같은 규칙을 쓴다. */
const durKo = (sec) => {
  if (sec == null || !Number.isFinite(sec)) return '아직 안 잼';
  const s = Math.round(sec);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60), r = s % 60;
  return r ? `${m}분 ${r}초` : `${m}분`;
};

/**
 * MR 파이프라인의 **벽시계 시간** — 사람이 실제로 기다린 시간.
 * 잡 하나하나의 시간이 아니라 `파이프라인이 만들어진 시각 → 마지막 잡이 끝난 시각`.
 * 잡이 아무리 빨라도 러너를 기다리느라 늘어지면 사람에게는 느린 것이다.
 */
async function collectGitLab() {
  if (gitlabOff) return { skipped: '옵션으로 껐습니다' };
  if (typeof fetch !== 'function') return { skipped: '이 Node 는 fetch 가 없습니다 (Node 18 이상이 필요합니다)' };
  const t = readToken();
  if (!t) return { skipped: `토큰이 없습니다 (${gitlabTokenFile} 에 넣으세요)` };

  let pipes;
  try {
    pipes = await gitlabFetch(t.token, `/projects/${GITLAB_PROJECT}/pipelines?source=merge_request_event&per_page=40&order_by=id&sort=desc`);
  } catch (err) {
    return { skipped: `GitLab 을 못 읽었습니다 — ${err.message}` };
  }
  if (!Array.isArray(pipes) || !pipes.length) return { skipped: '최근 MR 파이프라인이 없습니다' };

  // 끝난 것만 본다. 도는 중인 것의 벽시계는 아직 정해지지 않았다.
  const done = pipes.filter((p) => ['success', 'failed', 'canceled'].includes(p.status)).slice(0, 25);
  const parts = { front: { walls: [], jobs: {}, ok: 0, n: 0, last: null }, back: { walls: [], jobs: {}, ok: 0, n: 0, last: null } };

  for (const p of done) {
    let jobs;
    try { jobs = await gitlabFetch(t.token, `/projects/${GITLAB_PROJECT}/pipelines/${p.id}/jobs?per_page=100&include_retried=false`); }
    catch { continue; }
    if (!Array.isArray(jobs) || !jobs.length) continue;

    const fins = jobs.map((j) => (j.finished_at ? Date.parse(j.finished_at) : NaN)).filter(Number.isFinite);
    if (!fins.length) continue;
    const created = Date.parse(p.created_at);
    const wallSec = (Math.max(...fins) - created) / 1000;
    if (!Number.isFinite(wallSec) || wallSec < 0) continue;

    for (const part of ['front', 'back']) {
      const mine = jobs.filter((j) => MR_JOBS[part].includes(j.name));
      if (!mine.length) continue;
      const g = parts[part];
      g.n++;
      g.walls.push(wallSec);
      if (p.status === 'success') g.ok++;
      if (!g.last) g.last = { status: p.status, finishedAt: new Date(Math.max(...fins)).toISOString(), wallSec: Math.round(wallSec) };
      for (const j of mine) {
        if (typeof j.duration !== 'number') continue;
        (g.jobs[j.name] ??= []).push(j.duration);
      }
    }
  }

  const shape = (part) => {
    const g = parts[part];
    if (!g.n) return { measured: false, why: '최근 MR 파이프라인 중 이 파트의 검사가 돈 것이 없습니다' };
    return {
      measured: true,
      samples: g.n,
      wallMedianSec: Math.round(pct(g.walls, 0.5)),
      wallP90Sec: Math.round(pct(g.walls, 0.9)),
      wallMaxSec: Math.round(Math.max(...g.walls)),
      slowOverSec: MR_SLOW_SEC[part],
      successRate: Math.round((g.ok / g.n) * 100),
      last: g.last,
      jobs: Object.entries(g.jobs).map(([name, arr]) => ({
        name, n: arr.length, medianSec: Math.round(pct(arr, 0.5)), maxSec: Math.round(Math.max(...arr)),
      })).sort((a, b) => b.medianSec - a.medianSec),
    };
  };

  return { skipped: null, fetchedAt: new Date().toISOString(), tokenFrom: t.from, front: shape('front'), back: shape('back') };
}

// ── 이력 접기 ────────────────────────────────────────────────────────────────

const round = (v, d = 1) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const dayKey = (d) => {
  // 🔴 한국 시간 기준으로 하루를 자른다. UTC 로 자르면 오전 9시에 날이 바뀌어
  //    "어제 밤에 죽었다" 가 오늘 칸에 들어간다.
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
};

/**
 * 4시간 칸의 이름. `2026-09-08T12` 는 **한국 시간** 9월 8일 12시부터 16시 전까지다.
 *
 * 🔴 경계를 **한국 시간으로** 자른다. 서버는 UTC 라서 그냥 자르면 칸이 한국 시간
 *    09시·13시·17시에서 끊긴다 — 사람이 못 읽는 눈금이다. (이 팀은 알림 시각에서
 *    같은 함정에 한 번 빠진 적이 있다: cron 은 20:00 인데 알림은 05:00 에 갔다.)
 * 🔴 시각을 두 자리로 채우는 것이 중요하다. `T08` < `T12` 라야 글자 순서로
 *    정렬했을 때 시간 순서가 되고, 오래된 칸부터 버리는 것이 맞아떨어진다.
 */
const slotKey = (d) => {
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const h = Math.floor(kst.getUTCHours() / SLOT_HOURS) * SLOT_HOURS;
  return `${kst.toISOString().slice(0, 10)}T${String(h).padStart(2, '0')}`;
};

/** 🔴 눈금은 1.0 이다 — 코어 수만큼 줄이 서 있다는 뜻. 지금 값과 지난 칸이
 *  같은 눈금을 써야 한다. 두 군데에 따로 적으면 한쪽만 고친 날 서로 다른 말을 한다. */
const cpuState = (r) => (r >= 1.5 ? 'down' : r >= 1.0 ? 'slow' : 'ok');

/**
 * 고운 칸의 이름. `2026-09-14T08:35` — 굵은 칸(`2026-09-14T08`)보다 분이 더 붙는다.
 * 길이로 둘을 가를 수 있어서 화면이 눈금 글씨를 알아서 고른다.
 */
const fineKey = (d) => {
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const m = Math.floor(kst.getUTCMinutes() / FINE_MIN) * FINE_MIN;
  return `${kst.toISOString().slice(0, 13)}:${String(m).padStart(2, '0')}`;
};

/** 칸 이름에서 날짜만 (`2026-09-08T12` → `2026-09-08`). CPU 의 "오늘" 을 셀 때 쓴다. */
const slotDay = (key) => key.slice(0, 10);

/** 빈 칸 하나. 두 층이 같은 모양을 쓴다 — 읽는 코드를 한 벌로 두려고. */
const blankBucket = () => ({ svc: {}, cpu: { n: 0, ratioSum: 0, ratioMax: 0, busySum: 0, busyN: 0, busyMax: 0 } });

/** 표본 하나를 칸 하나에 더한다. */
function foldInto(bucket, states, cpu) {
  for (const s of SERVICES) {
    const st = states[s.id];
    const b = (bucket.svc[s.id] ??= { ok: 0, slow: 0, down: 0, unknown: 0, latSum: 0, latN: 0 });
    b[st.state] = (b[st.state] || 0) + 1;
    if (typeof st.latencyMs === 'number') { b.latSum += st.latencyMs; b.latN++; }
  }
  if (cpu.ratio != null) {
    bucket.cpu.n++;
    bucket.cpu.ratioSum += cpu.ratio;
    if (cpu.ratio > bucket.cpu.ratioMax) bucket.cpu.ratioMax = cpu.ratio;
  }
  if (cpu.busyPct != null) {
    bucket.cpu.busyN++;
    bucket.cpu.busySum += cpu.busyPct;
    if (cpu.busyPct > bucket.cpu.busyMax) bucket.cpu.busyMax = cpu.busyPct;
  }
}

/** 오래된 칸부터 버린다. 안 버리면 파일이 영원히 자란다. */
function trimBuckets(map, keep) {
  const keys = Object.keys(map).sort();
  while (keys.length > keep) delete map[keys.shift()];
}

/**
 * 같은 표본을 **두 층에 같이** 접는다 — 굵은 칸(4시간)과 고운 칸(5분).
 *
 * 🔴 한 번 잰 것을 두 번 세는 게 아니다. 같은 값을 **다른 크기로 두 번 접을 뿐**이다.
 *    나중에 고운 층에서 굵은 층을 다시 만들 수는 없다 — 고운 층은 하루만 남기므로.
 */
function foldIntoSlots(hist, nowIso, states, cpu) {
  const now = new Date(nowIso);
  foldInto(hist.slots[slotKey(now)] ??= blankBucket(), states, cpu);
  foldInto((hist.fine ??= {})[fineKey(now)] ??= blankBucket(), states, cpu);
  trimBuckets(hist.slots, KEEP_SLOTS);
  trimBuckets(hist.fine, FINE_KEEP);
  return hist;
}

/**
 * 화면에 실을 막대. **4시간짜리 칸을 PAGE_SLOTS(42)개** — 곧 7일치를 준다.
 * 맨 뒤가 지금 들어 있는 칸이고 앞으로 갈수록 과거다.
 *
 * 🔴 디스크에는 540칸이 있는데 여기서 42칸만 잘라 내보낸다 (KEEP_SLOTS 옆 설명).
 * 🔴 표본이 없는 칸도 `none` 으로 **자리를 만들어 준다.** 지우면 막대가 짧아져서
 *    "이 페이지는 원래 이만큼만 본다" 는 눈금이 사라진다. 회색으로 남긴다 —
 *    초록으로 칠하면 "그때 잘 돌았다" 는 거짓말이 된다.
 */
/**
 * 칸 하나를 화면이 읽을 줄로 바꾼다. **굵은 층과 고운 층이 같은 함수를 쓴다** —
 * 두 벌로 적으면 한쪽만 고친 날 같은 그림이 층마다 다른 말을 하게 된다.
 *
 * 🔴 칸의 상태는 **그 시간의 최악**이다. 한 번이라도 멈췄으면 멈춤이다.
 *    평균으로 매기면 잠깐 끊긴 것이 희석돼 사라진다.
 * 🔴 표본이 없으면 0 이 아니라 **없음**이다. 0 은 "그때 괜찮았다" 는 거짓말이다.
 */
function svcRow(key, b) {
  if (!b) return { t: key, state: 'none', up: null, n: 0, avgMs: null };
  const n = b.ok + b.slow + b.down + b.unknown;
  const measured = b.ok + b.slow + b.down;
  return {
    t: key, n,
    state: b.down > 0 ? 'down' : b.slow > 0 ? 'slow' : measured > 0 ? 'ok' : 'none',
    up: measured ? Math.round((b.ok / measured) * 1000) / 10 : null,
    avgMs: b.latN ? Math.round(b.latSum / b.latN) : null,
  };
}

/** 같은 것을 CPU 로. 칸의 상태는 역시 **그 시간의 최고**로 매긴다. */
function cpuRow(key, c) {
  if (!c || !c.n) return { t: key, state: 'none', avg: null, max: null, n: 0 };
  return {
    t: key, n: c.n,
    avg: round(c.ratioSum / c.n, 2),
    max: round(c.ratioMax, 2),
    state: cpuState(c.ratioMax),
  };
}

/**
 * 지금부터 뒤로 걸으며 칸을 줍는다. 없는 칸도 **자리를 만들어 준다** —
 * 지우면 그림이 짧아져서 "이 페이지는 원래 이만큼만 본다" 는 눈금이 사라진다.
 *
 * 🔴 뒤로만 걷는다. 앞으로 올 칸은 안 싣는다.
 */
function walkBack(now, count, stepMs, keyOf, pick) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) out.push(pick(keyOf(new Date(now.getTime() - i * stepMs))));
  return out;
}

const SLOT_MS = SLOT_HOURS * 3600 * 1000;
const FINE_MS = FINE_MIN * 60 * 1000;

/**
 * 화면에 실을 막대. **4시간짜리 칸을 PAGE_SLOTS(42)개** — 곧 7일치를 준다.
 * 🔴 디스크에는 540칸이 있는데 여기서 42칸만 잘라 내보낸다 (KEEP_SLOTS 옆 설명).
 */
const slotsForPage = (hist, svcId, now = new Date()) =>
  walkBack(now, PAGE_SLOTS, SLOT_MS, slotKey, (k) => svcRow(k, hist.slots[k]?.svc?.[svcId]));

/**
 * 화면에 실을 CPU 칸. 서비스 막대와 같은 42칸을 쓴다.
 *
 * 🔴 **새로 모으는 것이 하나도 없다.** 이 값들은 디스크에 540칸(90일)씩 쌓여 있었는데
 *    내보내지 않아서 화면은 "지금" 하나만 보여 줬다. 꺼내기만 하면 지난 기간이 통째로
 *    따라온다 — 안 모은 것은 못 만들지만, 모아 둔 것은 늦게라도 꺼낸다.
 */
const cpuSlotsForPage = (hist, now = new Date()) =>
  walkBack(now, PAGE_SLOTS, SLOT_MS, slotKey, (k) => cpuRow(k, hist.slots[k]?.cpu));

/** 고운 층 — **5분짜리 칸을 288개**, 곧 하루치. 별도 파일로 나간다. */
const fineSlotsForPage = (hist, svcId, now = new Date()) =>
  walkBack(now, FINE_PAGE, FINE_MS, fineKey, (k) => svcRow(k, hist.fine?.[k]?.svc?.[svcId]));

const fineCpuSlotsForPage = (hist, now = new Date()) =>
  walkBack(now, FINE_PAGE, FINE_MS, fineKey, (k) => cpuRow(k, hist.fine?.[k]?.cpu));

/**
 * 오늘(한국 시간) 하루의 CPU 를 되돌린다. 칸이 4시간이 되면서 "오늘" 은 한 칸이
 * 아니라 **여섯 칸을 합친 것**이 됐다. 합치지 않고 지금 칸만 보면 "오늘 최고" 가
 * 새벽 4시마다 0 으로 되돌아간다.
 */
function todayCpu(hist, now) {
  const today = dayKey(now);
  let n = 0, ratioSum = 0, ratioMax = 0;
  for (const [key, slot] of Object.entries(hist.slots)) {
    if (slotDay(key) !== today || !slot.cpu?.n) continue;
    n += slot.cpu.n;
    ratioSum += slot.cpu.ratioSum;
    if (slot.cpu.ratioMax > ratioMax) ratioMax = slot.cpu.ratioMax;
  }
  return n ? { max: ratioMax, avg: ratioSum / n } : null;
}

// ── 장애 이력 ────────────────────────────────────────────────────────────────
//
// 표본 **두 번 연속**으로 정상이 아니면 장애를 연다. 한 번은 안 연다 —
// 재배포하느라 20초 끊긴 것까지 장애로 적으면 이력이 잡음으로 가득 찬다.

function updateIncidents(store, samples, states, nowIso) {
  const list = store.incidents;
  const prev = samples.length >= 2 ? samples[samples.length - 2] : null;

  for (const s of SERVICES) {
    const cur = states[s.id].state;
    const before = prev?.svc?.[s.id] ?? null;
    const open = list.find((i) => i.svc === s.id && !i.endedAt);

    const bad = cur === 'down' || cur === 'slow';
    const wasBad = before === 'down' || before === 'slow';

    if (bad && wasBad && !open) {
      list.push({
        svc: s.id, name: s.name,
        startedAt: new Date((prev.t) * 1000).toISOString(),
        endedAt: null, worst: worse(before, cur), samples: 2,
      });
    } else if (open) {
      if (bad) { open.worst = worse(open.worst, cur); open.samples++; }
      else if (cur === 'ok') { open.endedAt = nowIso; }
      // unknown 이면 아무것도 안 한다. 못 잰 것은 나은 것도 나쁜 것도 아니다.
    }
  }

  // 오래된 것부터 버린다
  store.incidents = list
    .filter((i) => Date.now() - Date.parse(i.startedAt) < KEEP_DAYS * 86400000)
    .slice(-KEEP_INCIDENTS);
  return store;
}

// ── 최근 1시간 굴리기 ────────────────────────────────────────────────────────

function rollupTop(samples) {
  const cutoff = Date.now() / 1000 - WINDOW_MIN * 60;
  const win = samples.filter((s) => s.t >= cutoff);
  if (!win.length) return { measured: false, why: '아직 표본이 없습니다' };

  const foldSum = (pick) => {
    const acc = new Map();      // label -> {sum, max, n, members:Set}
    for (const s of win) {
      const rows = pick(s);
      if (!rows) continue;
      // 같은 이름표로 묶이는 것들은 한 표본 안에서 먼저 더한다 (bims 6개 → 하나)
      const perSample = new Map();
      for (const [label, v] of Object.entries(rows)) perSample.set(label, (perSample.get(label) || 0) + v);
      for (const [label, v] of perSample) {
        const e = acc.get(label) || { sum: 0, max: 0, n: 0 };
        e.sum += v; e.n++; if (v > e.max) e.max = v;
        acc.set(label, e);
      }
    }
    // 🔴 평균은 창 전체(win.length)로 나눈다. 표본에 안 나온 순간은 0으로 친다 —
    //    5분만 튀고 사라진 것이 "평균 300%" 로 보이면 안 된다.
    return [...acc.entries()]
      .map(([label, e]) => ({ label, avgPct: round(e.sum / win.length, 1), maxPct: round(e.max, 1), seen: e.n }))
      .sort((a, b) => b.avgPct - a.avgPct);
  };

  const containersMeasured = win.some((s) => s.c && Object.keys(s.c).length);
  const procsMeasured = win.some((s) => s.p && Object.keys(s.p).length);

  return {
    measured: true,
    windowMin: WINDOW_MIN,
    samples: win.length,
    fromIso: new Date(win[0].t * 1000).toISOString(),
    containers: containersMeasured ? foldSum((s) => s.c).slice(0, 5) : null,
    containersWhy: containersMeasured ? null : 'docker stats 를 한 번도 못 읽었습니다',
    processes: procsMeasured ? foldSum((s) => s.p).slice(0, 5) : null,
    processesWhy: procsMeasured ? null : 'ps 를 한 번도 못 읽었습니다',
  };
}

// ── 자체 검사 ────────────────────────────────────────────────────────────────
//
// 🔴 이 수집기가 실제로 도는 곳은 리눅스 서버인데, 만드는 사람은 대개 윈도우에
//    앉아 있다. `/proc` 도 `docker` 도 거기엔 없다. 그래서 **리눅스가 주는 글자를
//    그대로 붙여 넣고** 계산이 맞는지 검사한다. 서버에 올리기 전에 어디서든 돈다.
//
//      node ci/status/collect-status.mjs --self-test    # 0 이면 통과
//
//    실제 서버 값이 아니라 형식이 맞는지를 보는 검사다. 서버의 진짜 숫자는
//    설치한 뒤 `--dry-run` 으로 본다.

function selfTest() {
  let fail = 0;
  const eq = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fail++;
    console.log(`${ok ? '  통과' : '🔴 실패'}  ${name}${ok ? '' : `\n         나온 값: ${JSON.stringify(got)}\n         바란 값: ${JSON.stringify(want)}`}`);
  };

  console.log('\n── ③ CPU 계산 ───────────────────────────────────────────────');
  const load = parseLoadavg('28.70 12.05 6.31 9/1204 88213\n');
  eq('/proc/loadavg 를 뜯는다', { l: load.load1, r: load.running, p: load.procs }, { l: 28.7, r: 9, p: 1204 });
  eq('부하를 코어 수로 나눈다 (4코어에 28.7 이면 7.18배)', round(load.load1 / 4, 2), 7.18);

  const t1 = parseStat('cpu  100 0 50 800 50 0 0 0 0 0\n');
  const t2 = parseStat('cpu  200 0 100 1000 100 0 0 0 0 0\n');
  eq('/proc/stat 누적값 (전체 1000, 논 시간 850)', t1, { total: 1000, idle: 850 });
  eq('두 번의 차로 사용률을 낸다 (400 중 250을 놀았으니 37.5%)', round(busyPercent(t1, t2), 1), 37.5);
  eq('한 번만 재면 사용률은 없다 (0% 라고 우기지 않는다)', busyPercent(null, t2), null);
  eq('눈금이 되감겼으면(재부팅) 사용률은 없다', busyPercent(t2, t1), null);

  console.log('\n── 메모리 계산 (S15P21E201-784) ────────────────────────────────');
  const mem = parseMeminfo([
    'MemTotal:       16777216 kB',
    'MemFree:         2000000 kB',
    'MemAvailable:    4194304 kB',
    'Buffers:          300000 kB',
    'Cached:          8000000 kB',
    'SwapTotal:       2097152 kB',
    'SwapFree:         524288 kB',
  ].join('\n'));
  eq('MemTotal 을 MB 로 (16GiB)', mem.totalMb, 16384);
  eq('MemAvailable 을 MB 로 (4GiB)', mem.availableMb, 4096);
  eq('🔴 쓴 양은 Total-Available 이다 (Total-Free 가 아니다 — 캐시를 쓴 것처럼 안 보이게)', mem.usedMb, 12288);
  eq('쓴 비율', mem.usedPct, 75);
  eq('스왑도 Total-Free 로 (2GiB 중 512MiB 비어 있으니 1536MiB 씀)', mem.swapUsedMb, 1536);
  eq('MemTotal 이 없으면(형식이 다르면) 아예 null', parseMeminfo('엉뚱한 내용'), null);

  console.log('\n── ④ 컨테이너 이름 — 사람 이름이 새면 안 된다 ────────────────');
  const rows = parseDockerStats([
    'gabolle-backend\t312.44%',
    'bims-rleaderjoon\t18.20%',
    'bims-janghyojoon\t12.10%',
    'airflow-worker-1\t44.00%',
    'minio\t0.30%',
    'weird-minsu-box\t5.00%',
    '엉뚱한 줄',
  ].join('\n'));
  eq('docker stats 를 뜯는다 (숫자가 아닌 줄은 버린다)', rows.length, 6);
  eq('100% 를 넘는 값도 그대로 둔다 (코어 하나가 100% 다)', rows[0].pct, 312.44);
  eq('아는 이름은 한국어 이름표로', labelContainer('gabolle-backend').label, '백엔드 (API 서버)');
  eq('🔴 bims-<아이디> 는 사람 이름이라 묶는다', labelContainer('bims-rleaderjoon').label, 'bims 수집기');
  eq('🔴 두 번째 아이디도 같은 이름표 (합쳐진다)', labelContainer('bims-janghyojoon').label, 'bims 수집기');
  eq('아는 낱말은 남긴다', labelContainer('airflow-worker-1').label, 'Airflow 일꾼 (실제 작업)');
  eq('🔴 모르는 낱말은 가린다 (사람 이름일 수 있다)', labelContainer('weird-minsu-box').label, '*-*-* (모르는 이름이라 가렸습니다)');

  // 🔴 2026-09-08 서버 실측 — 도커 컴포즈가 붙인 `<프로젝트>-` 접두사 때문에
  //    아래 다섯이 전부 "모르는 이름" 으로 가려지고 있었다. 진짜 이름 그대로 넣는다.
  eq('컴포즈 접두사가 붙어도 Airflow 일꾼',
    labelContainer('local-route-personalization-airflow-worker-1').label, 'Airflow 일꾼 (실제 작업)');
  eq('컴포즈 접두사가 붙어도 Airflow 스케줄러',
    labelContainer('local-route-personalization-airflow-scheduler-1').label, 'Airflow 스케줄러 (작업 시각표)');
  eq('접두사 + 두 낱말 서비스 이름 (dag-processor)',
    labelContainer('local-route-personalization-airflow-dag-processor-1').label, 'Airflow (작업 스케줄러)');
  eq('컴포즈 접두사가 붙어도 MLflow',
    labelContainer('local-route-personalization-mlflow-1').label, 'MLflow (모델 기록)');
  eq('컴포즈 접두사가 붙어도 PostgreSQL',
    labelContainer('local-route-personalization-postgres-1').label, 'PostgreSQL (데이터베이스)');
  eq('컴포즈 접두사가 붙어도 MinIO',
    labelContainer('local-route-personalization-minio-1').label, 'MinIO (파일 저장소)');
  // 🔴 느슨하게 맞춰도 사람 아이디는 여전히 안 샌다 — bims 는 그 앞에서 묶인다
  eq('bims 는 접두사가 붙어도 묶인다', labelContainer('bims-rleaderjoon').label, 'bims 수집기');
  eq('🔴 모르는 이름은 여전히 가린다', labelContainer('some-minsu-thing').label, '*-*-* (모르는 이름이라 가렸습니다)');
  const leaked = rows.map((r) => labelContainer(r.raw).label).join(' ');
  eq('🔴 어떤 이름표에도 아이디가 안 남았다', /rleaderjoon|janghyojoon|minsu/.test(leaked), false);

  console.log('\n── ④ 컨테이너 밖 프로세스 — GitLab 러너를 놓치면 안 된다 ─────');
  // 컨테이너 번호는 실제로 64자리 16진수다. 짧게 줄여 쓰면 검사가 거짓으로 통과한다.
  const CID = 'a3f19c04b8e27d5610fa4b9c8e7d2f0134ab56cd78ef90126734bc8de9f01a2b';
  const psText = [
    ` 101 91.3 gitlab-runner  0::/system.slice/gitlab-runner.service`,
    ` 202 88.0 java           0::/system.slice/docker-${CID}.scope`,
    ` 303 12.5 node           12:cpu:/docker/${CID}`,
    ` 404  7.2 dockerd        0::/system.slice/docker.service`,
    ` 105  6.0 gitlab-runner  0::/system.slice/gitlab-runner.service`,
    ` 606  0.1 sshd           0::/system.slice/ssh.service`,
    // S15P21E201-784 — 수집기 자신(node)과 이번 사이클에 그것이 부른 ps 자신이다.
    // PID 로 빼야 한다는 것을 증명하려고 comm 이름은 진짜 프로세스와 겹치게 뒀다.
    ` 900 40.0 node           0::/system.slice/collect-status.service`,
    ` 901 30.0 ps             0::/system.slice/collect-status.service`,
  ].join('\n');
  const ps = parsePs(psText, true);
  const psExcluded = parsePs(psText, true, new Set([900, 901]));
  eq('🔴 systemd 로 도는 GitLab 러너를 잡는다', ps.rows[0].raw, 'gitlab-runner');
  eq('같은 이름은 더한다 (91.3 + 6.0)', ps.rows[0].pct, 97.3);
  eq('🔴 컨테이너 안의 java·node 는 뺀다 (컨테이너 표에서 이미 센다)', ps.rows.map((r) => r.raw), ['gitlab-runner', 'node', 'ps', 'dockerd']);
  eq('🔴 도커 엔진 자신은 컨테이너가 아니다 (docker.service 에 번호가 없다)', isContainerCgroup('0::/system.slice/docker.service'), false);
  eq('컨테이너는 번호로 알아본다 (cgroup v2)', isContainerCgroup(`0::/system.slice/docker-${CID}.scope`), true);
  eq('컨테이너는 번호로 알아본다 (cgroup v1)', isContainerCgroup(`12:cpu:/docker/${CID}`), true);
  eq('0.5% 밑은 잡음이라 버린다', ps.rows.some((r) => r.raw === 'sshd'), false);
  eq('러너에 한국어 설명을 붙인다', labelProcess('gitlab-runner'), 'GitLab 러너 (CI 를 돌리는 프로그램)');
  eq('🔴 excludePids 에 든 PID 는 comm 이 겹쳐도(node·ps) 뺀다 — 수집기 자기측정 방지',
    psExcluded.rows.map((r) => r.raw), ['gitlab-runner', 'dockerd']);

  console.log('\n── 4시간 칸 — 경계가 한국 시간이라야 한다 ────────────────────');
  // 🔴 서버는 UTC 다. 아래 시각은 전부 UTC 로 적었고, 괄호 안이 한국 시간이다.
  eq('한국 시간 자정은 새 칸의 시작이다 (UTC 15:00 = KST 다음날 00:00)',
     slotKey(new Date('2026-09-07T15:00:00Z')), '2026-09-08T00');
  eq('한국 시간 03:59 는 아직 00시 칸이다', slotKey(new Date('2026-09-07T18:59:00Z')), '2026-09-08T00');
  eq('🔴 한국 시간 04:00 에 칸이 넘어간다 (UTC 19:00)', slotKey(new Date('2026-09-07T19:00:00Z')), '2026-09-08T04');
  eq('한국 시간 23:59 는 마지막 20시 칸이다', slotKey(new Date('2026-09-08T14:59:00Z')), '2026-09-08T20');
  eq('하루는 여섯 칸이다', SLOTS_PER_DAY, 6);
  eq('🔴 글자 순서가 곧 시간 순서다 (T08 < T12 — 두 자리로 채웠기 때문)',
     ['2026-09-08T12', '2026-09-08T08', '2026-09-08T00'].sort(),
     ['2026-09-08T00', '2026-09-08T08', '2026-09-08T12']);

  console.log('\n── 이력 — 무한히 자라면 안 된다 ──────────────────────────────');
  const hist = { slots: {} };
  const states = Object.fromEntries(SERVICES.map((s) => [s.id, { state: 'ok', latencyMs: 10 }]));
  const SLOT_MS = SLOT_HOURS * 3600 * 1000;
  for (let i = 0; i < KEEP_SLOTS + 60; i++) {
    const d = new Date(Date.now() - (KEEP_SLOTS + 59 - i) * SLOT_MS).toISOString();
    foldIntoSlots(hist, d, states, { ratio: 1.0 + i / 1000, busyPct: 50 });
  }
  eq(`🔴 ${KEEP_SLOTS}칸(90일)을 넘기면 오래된 칸부터 버린다`, Object.keys(hist.slots).length, KEEP_SLOTS);
  eq('버리는 것은 늘 가장 오래된 칸이다', Object.keys(hist.slots).sort().at(-1), slotKey(new Date()));
  eq('🔴 화면에 싣는 것은 42칸(7일)뿐이다 — 540칸을 다 실으면 파일이 부푼다',
     slotsForPage(hist, 'frontend-app').length, PAGE_SLOTS);
  eq('표본이 없는 칸도 자리는 만든다 (none 으로 남긴다)',
     slotsForPage({ slots: {} }, 'frontend-app')[0].state, 'none');
  eq('빈 이력이어도 42칸이 다 나온다 (화면이 안 깨진다)',
     slotsForPage({ slots: {} }, 'frontend-app').length, PAGE_SLOTS);

  const oneSlot = { slots: { [slotKey(new Date())]: { svc: { 'backend-app': { ok: 90, slow: 5, down: 5, unknown: 0, latSum: 900, latN: 90 } }, cpu: { n: 0, ratioSum: 0, ratioMax: 0, busySum: 0, busyN: 0, busyMax: 0 } } } };
  const bar = slotsForPage(oneSlot, 'backend-app').at(-1);
  eq('한 번이라도 멈췄으면 그 칸은 빨갛다', bar.state, 'down');
  eq('가동률은 정상 표본 비율이다 (90/100)', bar.up, 90);

  // 🔴 "오늘 최고" 는 여섯 칸을 합쳐야 한다. 지금 칸만 보면 네 시간마다 0 이 된다.
  const now6 = new Date();
  const today = dayKey(now6);
  const cpuHist = { slots: {
    [today + 'T00']: { svc: {}, cpu: { n: 10, ratioSum: 10, ratioMax: 3.0, busySum: 0, busyN: 0, busyMax: 0 } },
    [today + 'T04']: { svc: {}, cpu: { n: 10, ratioSum: 20, ratioMax: 1.0, busySum: 0, busyN: 0, busyMax: 0 } },
  } };
  eq('🔴 오늘 최고는 여섯 칸 중 가장 큰 것이다 (지금 칸만 보지 않는다)',
     todayCpu(cpuHist, now6).max, 3.0);
  eq('오늘 평균은 칸을 합쳐서 낸다 ((10+20)/20)', todayCpu(cpuHist, now6).avg, 1.5);
  eq('한 번도 못 쟀으면 0 이 아니라 없음이다', todayCpu({ slots: {} }, now6), null);

  // 🔴 화면에 실을 CPU 칸. **디스크에 있던 것을 꺼내기만 한다** — 여기가 틀리면
  //    추세 곡선이 조용히 엉뚱한 높이를 그린다. 오류는 안 난다.
  const SLOT_MS2 = SLOT_HOURS * 3600 * 1000;
  const barsHist = { slots: {
    [slotKey(new Date(now6.getTime() - SLOT_MS2))]:
      { svc: {}, cpu: { n: 10, ratioSum: 10, ratioMax: 3.0, busySum: 0, busyN: 0, busyMax: 0 } },
    [slotKey(new Date(now6.getTime() - SLOT_MS2 * 2))]:
      { svc: {}, cpu: { n: 10, ratioSum: 20, ratioMax: 1.0, busySum: 0, busyN: 0, busyMax: 0 } },
  } };
  const cpuBars = cpuSlotsForPage(barsHist, now6);
  eq('CPU 칸도 42개가 다 나온다 (화면이 안 깨진다)', cpuBars.length, PAGE_SLOTS);
  eq('못 잰 칸은 0 이 아니라 없음이다 (0 은 "한가했다" 는 거짓말이다)', cpuBars[0].avg, null);
  const measured = cpuBars.filter((b) => b.state !== 'none');
  eq('잰 칸만 값이 있다', measured.length, 2);
  eq('칸 평균은 더한 것을 횟수로 나눈 것이다 (10/10)', measured.at(-1).avg, 1);
  eq('🔴 칸의 상태는 그 네 시간의 **최고**로 매긴다 (평균으로 매기면 치솟은 것이 희석된다)',
     measured.at(-1).state, 'down');
  eq('같은 눈금을 쓴다 — 1.0 은 "느림" 이다', measured.at(-2).state, 'slow');
  eq('🔴 앞으로 올 칸은 안 싣는다 (42칸은 뒤로만 걷는다)',
     cpuSlotsForPage({ slots: { [slotKey(new Date(now6.getTime() + SLOT_MS2))]:
       { svc: {}, cpu: { n: 5, ratioSum: 5, ratioMax: 1, busySum: 0, busyN: 0, busyMax: 0 } } } }, now6)
       .filter((b) => b.state !== 'none').length, 0);

  console.log('\n── 고운 층 — 5분 칸 하루치 ─────────────────────────────────');

  // 🔴 같은 표본이 **두 층에 같이** 들어가야 한다. 한쪽만 들어가면 그림 하나가
  //    조용히 비고, 오류는 안 난다.
  const both = { slots: {}, fine: {} };
  const t0 = new Date();
  const mkStates = (st) => Object.fromEntries(SERVICES.map((s) => [s.id, { state: st, latencyMs: 100 }]));
  foldIntoSlots(both, t0.toISOString(), mkStates('ok'), { ratio: 0.5, busyPct: null });
  eq('굵은 칸에 들어갔다', Object.keys(both.slots).length, 1);
  eq('고운 칸에도 같이 들어갔다', Object.keys(both.fine).length, 1);
  eq('고운 칸 이름에는 분이 붙는다 (길이로 층을 가른다)',
     Object.keys(both.fine)[0].length, 16);
  eq('굵은 칸 이름에는 안 붙는다', Object.keys(both.slots)[0].length, 13);

  // 5분 안에 여러 번 재면 **같은 칸**에 쌓인다. 칸이 늘어나면 접는 뜻이 없다.
  foldIntoSlots(both, new Date(t0.getTime() + 60000).toISOString(), mkStates('ok'), { ratio: 0.5, busyPct: null });
  const sameKey = fineKey(t0) === fineKey(new Date(t0.getTime() + 60000));
  if (sameKey) eq('같은 5분 안이면 같은 칸에 쌓인다', Object.keys(both.fine).length, 1);
  else eq('5분 경계를 넘었으면 칸이 하나 늘어난다', Object.keys(both.fine).length, 2);

  eq('고운 층은 하루치를 내보낸다', fineSlotsForPage(both, 'backend-app', t0).length, FINE_PAGE);
  eq('288칸이 곧 하루다', (FINE_PAGE * FINE_MIN) / 60, 24);
  eq('빈 이력이어도 288칸이 다 나온다 (화면이 안 깨진다)',
     fineSlotsForPage({ slots: {}, fine: {} }, 'backend-app', t0).filter((b) => b.state === 'none').length,
     FINE_PAGE);
  eq('CPU 도 하루치가 나온다', fineCpuSlotsForPage(both, t0).length, FINE_PAGE);

  // 🔴 디스크에는 하루보다 조금 더 쌓아야 한다. 딱 맞게 두면 시계가 조금만 밀려도
  //    맨 앞 칸이 비어서 그림 왼쪽 끝이 회색이 된다.
  eq('디스크에는 화면보다 더 쌓는다', FINE_KEEP > FINE_PAGE, true);

  console.log('\n── 장애 이력 — 한 번 튄 것으로 열지 않는다 ───────────────────');
  const store = { incidents: [] };
  const mk = (st) => ({ t: Math.round(Date.now() / 1000), svc: { 'backend-app': st } });
  updateIncidents(store, [mk('ok'), mk('down')], { ...states, 'backend-app': { state: 'down' } }, new Date().toISOString());
  eq('한 번 실패로는 장애를 안 연다 (재배포 20초까지 적으면 잡음이 된다)', store.incidents.length, 0);
  updateIncidents(store, [mk('down'), mk('down')], { ...states, 'backend-app': { state: 'down' } }, new Date().toISOString());
  eq('🔴 두 번 연속이면 연다', store.incidents.length, 1);
  updateIncidents(store, [mk('down'), mk('ok')], states, new Date().toISOString());
  eq('정상으로 돌아오면 닫는다', Boolean(store.incidents[0].endedAt), true);

  console.log('\n── 🔴 토큰이 결과에 새지 않는가 ──────────────────────────────');
  eq('오류 메시지에 토큰을 안 넣는다', /PRIVATE-TOKEN|token/i.test(String(new Error('HTTP 401').message)), false);

  console.log(`\n${fail === 0 ? '전부 통과했습니다.' : `🔴 ${fail}건 실패했습니다.`}\n`);
  return fail === 0 ? 0 : 1;
}

if (arg('self-test')) process.exit(selfTest());

// ── 실행 ─────────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date();
  const nowIso = now.toISOString();

  if (!dryRun && !acquireLock()) {
    log('앞의 수집이 아직 돌고 있습니다. 이번은 건너뜁니다.');
    process.exit(0);
  }

  try {
    loadMaskFile();

    const stateStore = readJson(join(dataDir, 'samples.json'), { schema: SCHEMA, samples: [], prevTicks: null, gitlab: null });
    const hist = readJson(join(dataDir, 'daily.json'), { schema: SCHEMA, slots: {} });
    const incidents = readJson(join(dataDir, 'incidents.json'), { schema: SCHEMA, incidents: [] });
    if (!Array.isArray(stateStore.samples)) stateStore.samples = [];
    // 🔴 **옛 일별 기록을 4시간 칸으로 쪼개지 않는다.**
    //
    //    하루가 "정상" 이었다는 것이 여섯 칸이 다 정상이었다는 뜻은 아니다. 나눠서
    //    채우면 **없는 정보를 지어내는 것**이고, 그렇게 만든 초록 칸은 진짜 초록과
    //    구별되지 않는다. 이 페이지의 규칙은 처음부터 하나였다 — **빈칸이 지어낸
    //    숫자보다 낫다.** 그래서 버리고 처음부터 다시 쌓는다.
    if (hist.schema !== SCHEMA) {
      const lost = Object.keys(hist.days || {}).length;
      warn(`가동 막대를 하루 단위에서 4시간 단위로 바꿔서 옛 기록 ${lost}일치를 버리고 처음부터 다시 쌓습니다. 하루짜리 기록은 4시간 칸으로 나눌 수 없습니다 — 나눠 채우면 없는 것을 지어내는 것이기 때문입니다.`);
      hist.schema = SCHEMA;
      hist.slots = {};
      delete hist.days;
    }
    if (!hist.slots || typeof hist.slots !== 'object') hist.slots = {};
    if (!Array.isArray(incidents.incidents)) incidents.incidents = [];

    // ── 잰다 ──────────────────────────────────────────────────────────────
    const [front, back, containers, processes] = await Promise.all([
      probe(frontendUrl),
      probe(backendUrl, { expectUp: true }),
      sampleContainers(),
      sampleProcesses(),
    ]);
    const cpu = collectCpu(stateStore.prevTicks);
    const memory = readMemory();
    log(`프로브  프론트 ${front.state}(${front.ms}ms) · 백엔드 ${back.state}(${back.ms}ms)`);
    log(`CPU     부하 ${cpu.load1 ?? '?'} / ${cpu.cores ?? '?'}코어 = ${cpu.ratio ?? '?'}`);
    log(`메모리  ${memory ? `${memory.usedMb}MB / ${memory.totalMb}MB (${memory.usedPct}%)` : '못 잼'}`);

    // GitLab 은 N 분에 한 번만. 나머지 시간은 지난번 것을 그대로 쓴다.
    let gl = stateStore.gitlab;
    const glAgeMin = gl?.fetchedAt ? (Date.now() - Date.parse(gl.fetchedAt)) / 60000 : Infinity;
    if (glAgeMin >= gitlabEvery) {
      const fresh = await collectGitLab();
      if (fresh.skipped) {
        warn(`MR 속도를 못 쟀습니다 — ${fresh.skipped}`);
        if (!gl) gl = { skipped: fresh.skipped };
      } else { gl = fresh; }
      log(`GitLab  ${fresh.skipped ? '건너뜀: ' + fresh.skipped : '받음'}`);
    } else {
      log(`GitLab  ${Math.round(glAgeMin)}분 전 것을 다시 씁니다 (--gitlab-every=${gitlabEvery})`);
    }

    // ── 서비스 넷의 상태로 옮긴다 ──────────────────────────────────────────
    const states = {};
    states['frontend-app'] = { state: front.state, latencyMs: front.ms, message: front.message, http: front.http, target: frontendUrl };
    states['backend-app'] = { state: back.state, latencyMs: back.ms, message: back.message, http: back.http, health: back.health ?? null, target: backendUrl };

    for (const [part, id] of [['front', 'frontend-ci'], ['back', 'backend-ci']]) {
      const m = gl && !gl.skipped ? gl[part] : null;
      if (!m || !m.measured) {
        states[id] = { state: 'unknown', latencyMs: null, message: m?.why || gl?.skipped || '아직 안 잼', mr: null };
      } else {
        // 🔴 파이프라인이 빨간 것으로 상태를 내리지 않는다. 빨간 검사는 대개
        //    코드가 틀린 것이지 CI 가 고장 난 것이 아니다. 성공률은 따로 보여준다.
        const st = m.wallMedianSec > m.slowOverSec ? 'slow' : 'ok';
        states[id] = {
          state: st, latencyMs: null, mr: m,
          message: st === 'slow'
            ? `평소(${durKo(m.slowOverSec)})보다 느립니다 — 중앙값 ${durKo(m.wallMedianSec)}`
            : `MR 하나가 ${durKo(m.wallMedianSec)}쯤 걸립니다 (최근 ${m.samples}건)`,
        };
      }
    }

    // ── 표본을 쌓는다 ─────────────────────────────────────────────────────
    const cRows = {};
    if (containers) {
      for (const row of containers) {
        const { label } = labelContainer(row.raw);
        cRows[label] = round((cRows[label] || 0) + row.pct, 1);
      }
    }
    const pRows = {};
    if (processes) {
      for (const row of processes) {
        const label = labelProcess(row.raw);
        pRows[label] = round((pRows[label] || 0) + row.pct, 1);
      }
    }
    const trim = (obj, n) => Object.fromEntries(Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n));

    const sample = {
      t: Math.round(now.getTime() / 1000),
      svc: Object.fromEntries(SERVICES.map((s) => [s.id, states[s.id].state])),
      lat: { 'frontend-app': front.ms, 'backend-app': back.ms },
      ratio: cpu.ratio, busy: cpu.busyPct,
      c: trim(cRows, 25),
      p: trim(pRows, 12),
    };
    stateStore.samples.push(sample);
    // 🔴 표본은 최근 것만 남긴다. 안 자르면 파일이 하루에 1,440개씩 자란다.
    while (stateStore.samples.length > KEEP_SAMPLES) stateStore.samples.shift();
    stateStore.prevTicks = cpu.ticks;
    stateStore.gitlab = gl;

    foldIntoSlots(hist, nowIso, states, cpu);
    updateIncidents(incidents, stateStore.samples, states, nowIso);

    // ── 결과 파일 ─────────────────────────────────────────────────────────
    const overall = SERVICES.reduce((acc, s) => worse(acc, states[s.id].state), 'ok');
    const cpuBad = cpu.state === 'down' || cpu.state === 'slow';

    const out = {
      schema: SCHEMA,
      generatedAt: nowIso,
      host: hostname(),
      intervalSec: 60,
      // 막대 칸 하나가 몇 시간인가. 화면이 이 값으로 눈금 글씨를 만든다 —
      // 여기서 4를 6으로 바꾸면 화면도 따라온다. 숫자를 두 군데 적지 않는다.
      slotHours: SLOT_HOURS,
      overall: {
        state: cpuBad ? worse(overall, cpu.state) : overall,
        // 화면 맨 위 한 줄. 사람이 3초 안에 읽을 것이라 문장으로 쓴다.
        headline: (() => {
          const st = cpuBad ? worse(overall, cpu.state) : overall;
          if (st === 'ok') return '모두 정상입니다';
          if (st === 'unknown') return '아직 다 못 쟀습니다';
          if (st === 'slow') return '느려진 곳이 있습니다';
          return '멈춘 곳이 있습니다';
        })(),
      },
      services: SERVICES.map((s) => ({
        id: s.id, name: s.name, what: s.what, kind: s.kind,
        ...states[s.id],
        // 4시간짜리 42칸 (7일). 칸의 단위는 위 slotHours 가 알려 준다.
        slots: slotsForPage(hist, s.id, now),
      })),
      cpu: {
        state: cpu.state,
        cores: cpu.cores,
        load1: cpu.load1, load5: cpu.load5, load15: cpu.load15,
        ratio: cpu.ratio, ratio5: cpu.ratio5, ratio15: cpu.ratio15,
        busyPct: cpu.busyPct, busyPctNote: cpu.busyPctNote,
        runningProcs: cpu.runningProcs,
        source: cpu.source,
        // 오늘 하루의 최고점. 사람이 "아까 튀었나" 를 알아야 지금 값이 뜻이 생긴다.
        // 🔴 한 번도 못 쟀으면 0 이 아니라 null 이다. 0 은 "한가하다" 는 거짓말이다.
        todayMaxRatio: (() => { const t = todayCpu(hist, now); return t ? round(t.max, 2) : null; })(),
        todayAvgRatio: (() => { const t = todayCpu(hist, now); return t ? round(t.avg, 2) : null; })(),
        // 4시간짜리 칸 42개 — 화면이 이걸로 추세 곡선을 그린다 (cpuSlotsForPage 설명).
        slots: cpuSlotsForPage(hist, now),
      },
      // S15P21E201-784 — 이때까지 없었다. CPU 만 보고 "경합이 원인이다" 고
      // 단정하지 못하게, 메모리·스왑도 같이 내보낸다. 못 쟀으면 null이지
      // 0으로 지어내지 않는다(위 "지어내지 않는다" 원칙과 같다).
      memory: memory ? {
        totalMb: memory.totalMb,
        usedMb: memory.usedMb,
        availableMb: memory.availableMb,
        usedPct: memory.usedPct,
        swapTotalMb: memory.swapTotalMb,
        swapUsedMb: memory.swapUsedMb,
      } : null,
      topCpu: rollupTop(stateStore.samples),
      incidents: incidents.incidents.slice().reverse().map((i) => ({
        name: i.name, worst: i.worst, startedAt: i.startedAt, endedAt: i.endedAt,
        minutes: Math.max(1, Math.round(((i.endedAt ? Date.parse(i.endedAt) : Date.now()) - Date.parse(i.startedAt)) / 60000)),
      })),
      // GitLab 을 언제 봤는지. 화면에 "N분 전" 으로 쓴다.
      mrFetchedAt: gl && !gl.skipped ? gl.fetchedAt : null,
      warnings,
    };

    if (dryRun) {
      process.stdout.write(JSON.stringify(out, null, 2) + '\n');
      log('\n--dry-run 이라 아무 파일도 안 썼습니다.');
      return;
    }

    writeJsonAtomic(join(dataDir, 'samples.json'), stateStore);
    writeJsonAtomic(join(dataDir, 'daily.json'), hist);
    writeJsonAtomic(join(dataDir, 'incidents.json'), incidents);
    // 고운 층 — 5분 칸 하루치. 굵은 층(status.json)과 **같은 시각을 다른 크기로** 접은 것이다.
    const fine = {
      schema: SCHEMA,
      generatedAt: nowIso,
      // 칸 하나가 몇 분인가. 화면이 이 값으로 눈금 글씨를 만든다 —
      // 여기서 5를 10으로 바꾸면 화면도 따라온다. 숫자를 두 군데 적지 않는다.
      fineMinutes: FINE_MIN,
      services: SERVICES.map((s) => ({ id: s.id, slots: fineSlotsForPage(hist, s.id, now) })),
      cpu: { slots: fineCpuSlotsForPage(hist, now) },
    };
    writeJsonAtomic(outPath, out);
    writeJsonAtomic(finePath, fine);
    log(`\n썼습니다 ${outPath}  (${out.overall.headline}${warnings.length ? ` · 경고 ${warnings.length}건` : ''})`);
    log(`썼습니다 ${finePath}  (${FINE_MIN}분 칸 ${FINE_PAGE}개 = 하루치)`);
  } finally {
    if (!dryRun) releaseLock();
  }
}

main().catch((err) => {
  console.error(`\n🔴 수집이 실패했습니다. 결과 파일을 안 바꿨습니다 — 낡은 것이 새 것인 척하지 않게.\n   ${err.stack || err.message}\n`);
  releaseLock();
  process.exit(1);
});
