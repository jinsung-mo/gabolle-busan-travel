#!/usr/bin/env node
/**
 * collect.mjs — 팀 CI 상태 수집기
 *
 * GitLab 에서 브랜치별 파이프라인(= 코드를 올릴 때마다 자동으로 도는 검사 묶음)의
 * 상태·소요시간과, 그 안의 잡(job — 파이프라인이 돌리는 작업 하나) 하나하나의
 * 소요시간을 받아 `ci-status.json` 한 파일로 떨군다. 그 파일을 상태 페이지가 읽는다.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 쓰는 법
 *
 *   1) 토큰을 만든다
 *      GitLab → 오른쪽 위 아바타 → Preferences → Access Tokens → Add new token
 *      scope 는 `read_api` 하나면 충분하다 (읽기만 한다. 아무것도 안 고친다).
 *      프로젝트 Access Token(Settings → Access Tokens)도 된다 — Role 은 Reporter 이상.
 *
 *   2) 토큰을 환경변수에 넣고 돌린다
 *
 *      # PowerShell (윈도우)
 *      $env:GITLAB_TOKEN = "glpat-여기에붙여넣기"
 *      node collect.mjs
 *
 *      # bash / zsh (맥·리눅스·Git Bash)
 *      GITLAB_TOKEN=glpat-여기에붙여넣기 node collect.mjs
 *
 *   3) 같은 폴더에 `ci-status.json` 이 생긴다. 옆의 `index.html` 을 브라우저로 열면
 *      **같은 폴더의 그 파일을 스스로 읽어** 그린다. 파일을 다른 데 두었거나 브라우저가
 *      로컬 파일 읽기를 막으면, 페이지에 그 파일을 끌어다 놓아도 된다.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 이 파일이 저장소 어디에 있고 누가 부르나
 *
 *   자리   `ci/status/collect.mjs`
 *   부르는 것
 *     · `.gitlab-ci.yml` 의 `status:publish` 잡 — 예약 파이프라인(**GitLab 이 정해진
 *       시각에 스스로 돌리는 파이프라인**)이 `SCHEDULE_KIND=status` 로 깨울 때만 돈다.
 *       거기서는 토큰을 CI/CD 변수에서 읽는다 (아래 토큰 찾는 순서 참고).
 *     · 사람이 손으로 — 위 "쓰는 법" 그대로.
 *
 *   페이지를 실제로 어떻게 배포하는지는 `ci/status/README.md` 에 있다.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 옵션
 *
 *   --token=…        토큰을 직접 준다 (환경변수보다 우선)
 *   --host=…         기본 lab.ssafy.com
 *   --project=…      기본 s15-bigdata-dist-sub1/S15P21E201
 *   --branches=a,b   기본은 아래 DEFAULT_BRANCHES
 *   --discover       브랜치 목록을 저장소에서 직접 읽는다 (…/dev · …/main · main 만)
 *   --per-branch=N   브랜치마다 최근 몇 개의 파이프라인을 볼지. 기본 12
 *   --jobs=latest    잡 목록을 최신(과 최근 실패) 파이프라인만 받는다 — 기본. 빠르다
 *   --jobs=all       모든 파이프라인의 잡을 받는다. 잡 단위 추세가 생기지만 느리다
 *   --out=경로       기본 ./ci-status.json
 *   --quiet          진행 표시를 안 찍는다
 *
 *   --job-window=N   러너 분석용으로 최근 잡 N개를 훑는다. 기본 250. 0 이면 안 한다
 *   --runner-facts=경로
 *                    러너 서버에서 직접 잰 값을 담은 JSON. 아래 참고
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 러너(CI 를 실제로 돌리는 기계)에 대해 API 가 주는 것과 안 주는 것
 *
 *   API 가 준다      러너 이름·온라인 여부·태그 · 어느 잡이 어느 러너에서 돌았나
 *                    · 지금 도는 잡 수 · (계산) 그 잡이 도는 동안 같은 러너에서
 *                      몇 개가 함께 돌았나
 *
 *   API 가 안 준다   코어 수 · 동시 실행 슬롯 수(config.toml 의 concurrent)
 *                    · load average
 *
 *   뒤의 셋은 **러너 서버에 직접 들어가야 나온다.** 지어내지 않는다. 서버에서
 *   이렇게 재서 파일로 넣으면 이 스크립트가 그대로 실어 준다:
 *
 *     nproc; cat /proc/loadavg; grep -i '^concurrent' /etc/gitlab-runner/config.toml
 *
 *   runner-facts.json 모양 (러너 이름 또는 id 를 열쇠로):
 *     {
 *       "j15e201-base": { "cores": 4, "slots": 4, "load1": 28.7,
 *                         "measuredAt": "2026-09-08T10:00:00Z" },
 *       "ec2-runner":   { "cores": 4, "slots": 1, "load1": 2.2 }
 *     }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 종료 코드 — 0 이면 파일이 만들어진 것이고, 그 외는 전부 실패다.
 *   0  ci-status.json 을 썼다
 *   1  토큰이 없거나, 인증·권한·네트워크에서 막혀 아무것도 못 받았다
 *
 * 🔴 이 스크립트는 숫자를 만들어내지 않는다. 못 받은 브랜치는 `found: false` 로
 *    남기고 경고에 적는다 — 빈칸이 지어낸 숫자보다 낫다.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const DEFAULT_HOST = 'lab.ssafy.com';
const DEFAULT_PROJECT = 's15-bigdata-dist-sub1/S15P21E201';
const DEFAULT_BRANCHES = [
  'main',
  'front/main', 'front/dev',
  'back/main', 'back/dev',
  'bigData/main', 'bigData/dev',
  'map/dev',
  'common/dev',
];
const SCHEMA = 3;

// ── 인자 읽기 ────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};

if (arg('help') || arg('h')) {
  console.log(readHelp());
  process.exit(0);
}

const host = String(arg('host', DEFAULT_HOST));
const projectPath = String(arg('project', DEFAULT_PROJECT));
const perBranch = Math.max(1, Math.min(50, Number(arg('per-branch', 12)) || 12));
const jobsMode = String(arg('jobs', 'latest'));
const outPath = String(arg('out', 'ci-status.json'));
const quiet = Boolean(arg('quiet', false));
const jobWindow = Math.max(0, Math.min(2000, Number(arg('job-window', 250)) || 0));
const runnerFactsPath = typeof arg('runner-facts', null) === 'string' ? arg('runner-facts') : null;
const discover = Boolean(arg('discover', false));
const branchArg = arg('branches', null);

// ── 토큰 ─────────────────────────────────────────────────────────────────────

const tokenSources = [
  ['--token', typeof arg('token', null) === 'string' ? arg('token') : null],
  ['GITLAB_TOKEN', process.env.GITLAB_TOKEN],
  ['GITLAB_PRIVATE_TOKEN', process.env.GITLAB_PRIVATE_TOKEN],
  ['AXMAP_BOT_TOKEN', process.env.AXMAP_BOT_TOKEN],
  ['CI_JOB_TOKEN', process.env.CI_JOB_TOKEN],
];
const found = tokenSources.find(([, v]) => typeof v === 'string' && v.trim().length > 0);

if (!found) {
  console.error(`
🔴 토큰이 없습니다. 아무것도 받지 못했고, 파일도 만들지 않았습니다.

   이 저장소는 비공개라 인증 없이 API 를 치면 404 가 옵니다
   (없는 게 아니라 "너에게는 없다" 는 뜻입니다 — GitLab 은 비공개 자원을
    숨기려고 403 대신 404 를 냅니다).

   토큰 만드는 법
     ${'https://' + host}  →  아바타  →  Preferences  →  Access Tokens
     → Add new token, scope 는 read_api 하나만 켭니다 (읽기 전용).

   넣고 다시 돌리는 법
     PowerShell :  $env:GITLAB_TOKEN = "glpat-…"; node collect.mjs
     bash       :  GITLAB_TOKEN=glpat-… node collect.mjs

   찾아본 자리: ${tokenSources.map(([k]) => k).join(' · ')}
`);
  process.exit(1);
}

const [tokenSource, token] = found;
// CI_JOB_TOKEN 은 헤더 이름이 다르다. 그리고 파이프라인 조회 권한이 없을 때가 많다.
const authHeader = tokenSource === 'CI_JOB_TOKEN'
  ? { 'JOB-TOKEN': token.trim() }
  : { 'PRIVATE-TOKEN': token.trim() };

const API = `https://${host}/api/v4`;
const PROJECT = encodeURIComponent(projectPath);
const warnings = [];
const log = (...a) => { if (!quiet) process.stderr.write(a.join(' ') + '\n'); };

if (tokenSource === 'CI_JOB_TOKEN') {
  warnings.push('CI_JOB_TOKEN 으로 붙었습니다. 이 토큰은 파이프라인 목록 조회 권한이 없는 경우가 많습니다 — 404 가 나오면 개인 Access Token(read_api)으로 바꾸세요.');
}

// ── HTTP ─────────────────────────────────────────────────────────────────────

async function api(path, { retries = 3 } = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { ...authHeader, Accept: 'application/json' } });
    } catch (err) {
      if (attempt >= retries) throw new Error(`네트워크 실패: ${url} — ${err.message}`);
      await sleep(600 * (attempt + 1));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= retries) throw new Error(`HTTP ${res.status}: ${url}`);
      const wait = Number(res.headers.get('retry-after')) * 1000 || 900 * (attempt + 1);
      await sleep(wait);
      continue;
    }
    if (res.status === 401) throw new Error('HTTP 401 — 토큰이 거부됐습니다. 만료됐거나 오타입니다.');
    if (res.status === 403) throw new Error('HTTP 403 — 토큰은 살아 있지만 이 자원을 볼 권한이 없습니다. scope 에 read_api 가 켜져 있는지 보세요.');
    if (res.status === 404) throw new Error(`HTTP 404 — ${url}\n  비공개 저장소에서 404 는 보통 "권한이 없다" 는 뜻입니다. 프로젝트 경로와 토큰 권한을 보세요.`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 동시 요청을 4개로 묶는다. 서버를 때리지 않으면서 충분히 빠르다. */
async function pool(items, worker, size = 4) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx], idx);
    }
  }));
  return out;
}

// ── 받아오기 ─────────────────────────────────────────────────────────────────

function shapePipeline(p, detail) {
  return {
    id: p.id,
    iid: p.iid ?? null,
    ref: p.ref,
    sha: p.sha,
    shortSha: String(p.sha || '').slice(0, 8),
    status: p.status,                          // success · failed · running · canceled · skipped · pending
    source: p.source ?? detail?.source ?? null, // push · merge_request_event · schedule …
    webUrl: p.web_url,
    createdAt: p.created_at ?? detail?.created_at ?? null,
    startedAt: detail?.started_at ?? null,
    finishedAt: detail?.finished_at ?? null,
    durationSec: detail?.duration ?? null,      // 잡이 실제로 돈 시간
    queuedSec: detail?.queued_duration ?? null, // 러너를 기다린 시간
    user: detail?.user?.username ?? null,
    jobs: null,
  };
}

function shapeJob(j) {
  return {
    id: j.id,
    name: j.name,
    stage: j.stage,
    status: j.status,
    allowFailure: Boolean(j.allow_failure),
    durationSec: j.duration ?? null,
    queuedSec: j.queued_duration ?? null,
    startedAt: j.started_at ?? null,
    finishedAt: j.finished_at ?? null,
    failureReason: j.failure_reason ?? null,
    webUrl: j.web_url ?? null,
    // 🔴 어느 러너에서 돌았나. 러너 둘의 성격이 달라서(슬롯 4 vs 1) 같은 잡도
    //    시간이 다르다. 이건 API 가 준다.
    runnerId: j.runner?.id ?? null,
    runnerName: j.runner?.description ?? j.runner?.name ?? null,
  };
}

async function fetchJobs(pipelineId) {
  const raw = await api(`/projects/${PROJECT}/pipelines/${pipelineId}/jobs?per_page=100&include_retried=false`);
  return raw.map(shapeJob).sort((a, b) => (b.durationSec ?? -1) - (a.durationSec ?? -1));
}

// ── 러너 ─────────────────────────────────────────────────────────────────────
//
// 🔴 여기서 나오는 것과 안 나오는 것을 섞지 않는다. 코어·슬롯·load 는 API 에
//    없으므로 runner-facts 파일에서만 온다. 안 주면 null 로 남긴다.

function loadRunnerFacts() {
  if (!runnerFactsPath) return {};
  try {
    const obj = JSON.parse(readFileSync(runnerFactsPath, 'utf8'));
    if (!obj || typeof obj !== 'object') throw new Error('객체가 아닙니다');
    log(`실측    러너 값 ${Object.keys(obj).length}개를 ${runnerFactsPath} 에서 읽었습니다`);
    return obj;
  } catch (err) {
    warnings.push(`runner-facts 를 못 읽었습니다 (${runnerFactsPath}) — ${err.message}. 코어·슬롯·load 는 비워 둡니다.`);
    return {};
  }
}

async function collectRunners(facts) {
  let list = [];
  try {
    list = await api(`/projects/${PROJECT}/runners?per_page=100`);
  } catch (err) {
    warnings.push(`러너 목록을 못 받았습니다 — ${err.message.split('\n')[0]}`);
    return [];
  }

  // 지금 실제로 도는 잡. 이건 API 가 준다.
  let running = [];
  try {
    running = await api(`/projects/${PROJECT}/jobs?scope[]=running&per_page=100`);
  } catch {
    warnings.push('지금 도는 잡 목록을 못 받았습니다 — "지금 도는 잡" 칸은 비워 둡니다.');
    running = null;
  }

  return list.map((r) => {
    const key = r.description || String(r.id);
    const f = facts[key] || facts[String(r.id)] || {};
    const runningHere = running === null ? null : running.filter((j) => j.runner?.id === r.id).length;
    return {
      id: r.id,
      name: r.description || r.name || `runner-${r.id}`,
      ipAddress: r.ip_address ?? null,
      online: r.online ?? null,
      status: r.status ?? null,
      isShared: r.is_shared ?? false,
      runnerType: r.runner_type ?? null,
      runningNow: runningHere,          // API 실측
      // 아래 넷은 API 에 없다. runner-facts 로 준 것만 채워진다.
      cores: typeof f.cores === 'number' ? f.cores : null,
      slots: typeof f.slots === 'number' ? f.slots : null,
      load1: typeof f.load1 === 'number' ? f.load1 : null,
      loadMeasuredAt: f.measuredAt ?? null,
      factsSource: Object.keys(f).length ? 'runner-facts 파일' : null,
    };
  });
}

// ── 최근 잡을 통째로 훑어 "함께 돈 개수" 를 센다 ─────────────────────────────
//
// 잡 하나의 소요시간이 길었을 때 그게 자기 탓인지 이웃 탓인지는, 그 잡이 도는
// 동안 **같은 러너에서** 몇 개가 함께 돌고 있었는지를 봐야 갈린다.
// started_at·finished_at 이 겹치는 구간을 세면 나온다.

async function collectJobWindow() {
  if (!jobWindow) return [];
  const out = [];
  for (let page = 1; out.length < jobWindow && page <= 20; page++) {
    let batch;
    try {
      batch = await api(`/projects/${PROJECT}/jobs?per_page=100&page=${page}`);
    } catch (err) {
      warnings.push(`최근 잡 목록을 못 받았습니다 — ${err.message.split('\n')[0]}. 동시 실행 분석을 건너뜁니다.`);
      break;
    }
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  const shaped = out.slice(0, jobWindow).map((j) => ({
    id: j.id,
    name: j.name,
    stage: j.stage,
    status: j.status,
    ref: j.ref,
    durationSec: j.duration ?? null,
    queuedSec: j.queued_duration ?? null,
    startedAt: j.started_at ?? null,
    finishedAt: j.finished_at ?? null,
    pipelineId: j.pipeline?.id ?? null,
    webUrl: j.web_url ?? null,
    runnerId: j.runner?.id ?? null,
    runnerName: j.runner?.description ?? j.runner?.name ?? null,
    concurrentPeak: null,   // 아래에서 채운다
  }));
  log(`  최근 잡 ${shaped.length}개를 훑었습니다`);
  return shaped;
}

/**
 * 같은 러너에서 이 잡이 도는 동안 **동시에 돌던 잡의 최대 개수**(자기 포함).
 * 1 이면 혼자 돌았다는 뜻이고, 슬롯 수와 같으면 정원이 찼다는 뜻이다.
 */
function computeConcurrency(jobs) {
  const byRunner = new Map();
  for (const j of jobs) {
    if (!j.startedAt || !j.finishedAt || j.runnerId == null) continue;
    const s = Date.parse(j.startedAt), e = Date.parse(j.finishedAt);
    if (!isFinite(s) || !isFinite(e) || e < s) continue;
    j._s = s; j._e = e;
    if (!byRunner.has(j.runnerId)) byRunner.set(j.runnerId, []);
    byRunner.get(j.runnerId).push(j);
  }
  for (const [, list] of byRunner) {
    for (const a of list) {
      // 후보 시점: 자기 시작 + 자기 구간 안에서 시작하는 이웃들의 시작 시각
      const marks = [a._s];
      for (const b of list) if (b._s > a._s && b._s < a._e) marks.push(b._s);
      let peak = 1;
      for (const t of marks) {
        let n = 0;
        for (const b of list) if (b._s <= t && b._e > t) n++;
        if (n > peak) peak = n;
      }
      a.concurrentPeak = peak;
    }
  }
  for (const j of jobs) { delete j._s; delete j._e; }
  return jobs;
}

/** 잡 이름별로 "동시 실행 수 → 소요시간" 표를 만든다. 표본이 있는 것만. */
function summarizeConcurrency(jobs) {
  const byName = {};
  for (const j of jobs) {
    if (!j.durationSec || !j.concurrentPeak || j.status !== 'success') continue;
    const bucket = String(Math.min(j.concurrentPeak, 8));
    byName[j.name] ??= { name: j.name, buckets: {}, total: 0 };
    byName[j.name].buckets[bucket] ??= [];
    byName[j.name].buckets[bucket].push(j.durationSec);
    byName[j.name].total++;
  }
  const median = (a) => {
    const s = a.slice().sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return Object.values(byName)
    .filter((e) => e.total >= 2)
    .map((e) => ({
      name: e.name,
      total: e.total,
      buckets: Object.keys(e.buckets).sort((a, b) => a - b).map((k) => ({
        concurrent: Number(k),
        n: e.buckets[k].length,
        medianSec: Math.round(median(e.buckets[k])),
        minSec: Math.round(Math.min(...e.buckets[k])),
        maxSec: Math.round(Math.max(...e.buckets[k])),
      })),
    }))
    .sort((a, b) => b.total - a.total);
}

async function collectBranch(ref) {
  const enc = encodeURIComponent(ref);
  let list;
  try {
    list = await api(`/projects/${PROJECT}/pipelines?ref=${enc}&per_page=${perBranch}&order_by=id&sort=desc`);
  } catch (err) {
    warnings.push(`${ref}: 파이프라인 목록을 못 받았습니다 — ${err.message.split('\n')[0]}`);
    return { ref, found: false, error: err.message, pipelines: [] };
  }
  if (!Array.isArray(list) || list.length === 0) {
    return { ref, found: false, error: '파이프라인이 하나도 없습니다 (브랜치가 없거나, 아직 아무것도 안 돌았습니다)', pipelines: [] };
  }

  // 목록 응답에는 소요시간이 없다. 하나씩 상세를 받아야 duration 이 나온다.
  const details = await pool(list, async (p) => {
    try { return await api(`/projects/${PROJECT}/pipelines/${p.id}`); }
    catch { return null; }
  });
  const pipelines = list.map((p, i) => shapePipeline(p, details[i]));

  // 잡: 최신 파이프라인 + 최근 실패 파이프라인은 항상. --jobs=all 이면 전부.
  const wanted = new Set();
  if (pipelines[0]) wanted.add(pipelines[0].id);
  const lastFailed = pipelines.find((p) => p.status === 'failed');
  if (lastFailed) wanted.add(lastFailed.id);
  if (jobsMode === 'all') pipelines.forEach((p) => wanted.add(p.id));

  await pool([...wanted], async (id) => {
    try {
      const jobs = await fetchJobs(id);
      const target = pipelines.find((p) => p.id === id);
      if (target) target.jobs = jobs;
    } catch (err) {
      warnings.push(`${ref} #${id}: 잡 목록을 못 받았습니다 — ${err.message.split('\n')[0]}`);
    }
  });

  log(`  ${ref.padEnd(16)} 파이프라인 ${String(pipelines.length).padStart(2)}개, 최신 ${pipelines[0].status}`);
  return { ref, found: true, error: null, pipelines };
}

// ── 실행 ─────────────────────────────────────────────────────────────────────

async function main() {
  log(`GitLab  ${API}`);
  log(`프로젝트 ${projectPath}`);
  log(`토큰    ${tokenSource} (…${token.trim().slice(-4)})`);
  log('');

  let project;
  try {
    project = await api(`/projects/${PROJECT}`);
  } catch (err) {
    console.error(`\n🔴 프로젝트를 못 열었습니다.\n   ${err.message}\n`);
    process.exit(1);
  }
  log(`열림    ${project.name_with_namespace}  (기본 브랜치 ${project.default_branch})`);

  let branches;
  if (typeof branchArg === 'string' && branchArg.trim()) {
    branches = branchArg.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (discover) {
    const all = await api(`/projects/${PROJECT}/repository/branches?per_page=100`);
    branches = all.map((b) => b.name).filter((n) => /(^|\/)(dev|main|func)$/.test(n)).sort();
    log(`찾음    브랜치 ${branches.length}개`);
  } else {
    branches = DEFAULT_BRANCHES;
  }

  log('');
  log('받는 중…');
  const results = [];
  for (const ref of branches) results.push(await collectBranch(ref));

  // 러너 — 누가 돌리고 있나
  const facts = loadRunnerFacts();
  const runners = await collectRunners(facts);
  log(`  러너 ${runners.length}대`);

  // 동시 실행 — 이 잡이 느렸던 게 자기 탓인가 이웃 탓인가
  let windowJobs = await collectJobWindow();
  windowJobs = computeConcurrency(windowJobs);
  const concurrency = summarizeConcurrency(windowJobs);

  // runner-facts 에는 있는데 API 러너 목록에 없는 이름이 있으면 알린다
  for (const key of Object.keys(facts)) {
    if (!runners.some((r) => r.name === key || String(r.id) === key)) {
      warnings.push(`runner-facts 의 "${key}" 는 이 프로젝트의 러너 목록에 없습니다 — 이름이 GitLab 의 러너 description 과 같은지 보세요.`);
    }
  }
  if (!runnerFactsPath) {
    warnings.push('코어 수·동시 슬롯 수·load average 는 GitLab API 에 없습니다. --runner-facts=파일 로 주거나 페이지에서 직접 넣으세요.');
  }

  const data = {
    schema: SCHEMA,
    source: 'gitlab-api',
    generatedAt: new Date().toISOString(),
    collector: 'collect.mjs',
    host,
    projectPath,
    projectUrl: project.web_url,
    defaultBranch: project.default_branch,
    perBranch,
    jobsMode,
    tokenSource,
    branches: results,
    runners,
    runnerFactsPath,
    jobWindow: { requested: jobWindow, count: windowJobs.length, jobs: windowJobs },
    concurrency,
    warnings,
  };

  writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');

  // 사람이 읽는 요약 — 터미널에서 바로 판단이 서게.
  const fmt = (s) => (s == null ? '   —  ' : s >= 60 ? `${Math.floor(s / 60)}분 ${String(Math.round(s % 60)).padStart(2, '0')}초` : `${Math.round(s)}초`);
  console.log('');
  console.log('브랜치            최신 상태   소요        최근 ' + perBranch + '회 중 실패');
  console.log('─'.repeat(64));
  for (const b of results) {
    if (!b.found) { console.log(`${b.ref.padEnd(17)} (데이터 없음) ${b.error}`); continue; }
    const latest = b.pipelines[0];
    const fails = b.pipelines.filter((p) => p.status === 'failed').length;
    console.log(`${b.ref.padEnd(17)} ${String(latest.status).padEnd(11)} ${fmt(latest.durationSec).padEnd(11)} ${fails}회`);
  }
  if (runners.length) {
    console.log('러너                코어  슬롯  지금 도는 잡  load  load/코어');
    console.log('─'.repeat(64));
    for (const r of runners) {
      const per = r.load1 != null && r.cores ? (r.load1 / r.cores).toFixed(2) : '—';
      console.log(
        `${String(r.name).slice(0, 18).padEnd(19)}` +
        `${(r.cores ?? '—').toString().padStart(4)}  ` +
        `${(r.slots ?? '—').toString().padStart(4)}  ` +
        `${(r.runningNow ?? '—').toString().padStart(11)}  ` +
        `${(r.load1 ?? '—').toString().padStart(5)}  ${per.padStart(8)}`
      );
    }
    console.log('  코어·슬롯·load 가 — 이면 그건 API 에 없는 값입니다. 서버에서 재서 넣으세요:');
    console.log('    nproc; cat /proc/loadavg; grep -i \'^concurrent\' /etc/gitlab-runner/config.toml');
    console.log('');
  }
  if (concurrency.length) {
    console.log('동시 실행 수에 따른 소요시간 (성공한 잡의 중앙값)');
    console.log('─'.repeat(64));
    for (const c of concurrency.slice(0, 6)) {
      console.log(`${c.name.padEnd(26)} ` + c.buckets.map((b) => `${b.concurrent}개=${b.medianSec}초(n${b.n})`).join('  '));
    }
    console.log('');
  }
  if (warnings.length) {
    console.log('경고');
    warnings.forEach((w) => console.log('  · ' + w));
    console.log('');
  }
  console.log(`✔ ${outPath} 를 썼습니다. 같은 폴더의 index.html 을 열면 이 파일을 스스로 읽습니다.`);
}

function readHelp() {
  return `collect.mjs — 팀 CI 상태 수집기

  node collect.mjs                      기본 브랜치 목록을 최근 ${'12'}회까지
  node collect.mjs --jobs=all           잡 단위 추세까지 (느림)
  node collect.mjs --branches=back/dev  한 브랜치만
  node collect.mjs --discover           브랜치를 저장소에서 직접 찾아서
  node collect.mjs --runner-facts=runner-facts.json
                                         러너 서버에서 직접 잰 코어·슬롯·load 를 함께

토큰은 GITLAB_TOKEN 환경변수(또는 --token=)로 줍니다. scope 는 read_api.

🔴 코어 수·동시 슬롯 수·load average 는 GitLab API 에 없습니다. 러너 서버에서
   직접 재세요 —  nproc; cat /proc/loadavg; grep -i '^concurrent' /etc/gitlab-runner/config.toml
   그 값을 runner-facts.json 에 적어 --runner-facts 로 주거나, 상태 페이지의
   "직접 잰 값" 칸에 넣으면 됩니다.`;
}

main().catch((err) => {
  console.error(`\n🔴 실패했습니다. 파일을 만들지 않았습니다.\n   ${err.message}\n`);
  process.exit(1);
});
