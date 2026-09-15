#!/usr/bin/env node
/**
 * build-flow.mjs — 파트마다 흩어져 있는 `dataflow.json` 조각을 모아
 *                  가동 상태 페이지가 그릴 `graph.json` 한 장으로 만든다
 *
 * 왜 모아야 하나:
 *   페이지는 서버에 **파일 몇 개로 설치된다** (`/srv/gabolle/www/status/`).
 *   저장소가 통째로 서버에 있지 않으므로, 브라우저가 `bigData/dataflow.json` 을
 *   직접 읽을 방법이 없다. 그래서 **설치할 때 한 번 모아서** 페이지 옆에 떨어뜨린다.
 *
 * 왜 조각으로 두나:
 *   그림 하나를 한 파일에 적으면, 파트가 늘 때마다 남의 파일을 고쳐야 하고 거기서
 *   충돌이 난다. 조각으로 두면 **새 파트는 자기 폴더에 파일 하나만 놓으면** 된다.
 *   이 프로그램이 알아서 찾는다 — 목록을 어디에도 적지 않는다.
 *
 * 🔴 이 프로그램이 하는 제일 중요한 일은 그리는 것이 아니라 **확인하는 것**이다.
 *    조각은 "이 화살표는 이어져 있다" 고 주장할 수 있지만, 그 주장의 근거로
 *    **확인할 파일 경로**를 같이 적게 한다. 파일이 없으면 주장과 무관하게 끊긴
 *    것으로 표시한다. 그림이 거짓말을 못 하게 하는 장치다.
 *
 * 쓰는 법:
 *   node ci/status/flow/build-flow.mjs                  # graph.json 을 만든다
 *   node ci/status/flow/build-flow.mjs --check          # 만들지 않고 검사만 한다
 *   node ci/status/flow/build-flow.mjs --out=<경로>
 *
 * 판정은 종료 코드다 — 0 이면 통과, 1 이면 조각이 잘못됐다.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..');            // ci/status/flow → 저장소 뿌리
const PIECE = 'dataflow.json';

// ── 칸의 단계 ────────────────────────────────────────────────────────────────
// 그림의 가로축이다. 데이터는 왼쪽에서 오른쪽으로 흐른다.
// 조각이 여기 없는 단계를 쓰면 종료 코드 1 로 거부한다 — 오타 하나가 칸을
// 조용히 사라지게 하는 것보다, 시끄럽게 실패하는 편이 낫다.
const STAGES = [
  { id: 'source',  label: '원천',  hint: '바깥에서 온다. 우리가 만들지 않는다' },
  { id: 'process', label: '가공',  hint: '받은 것으로 계산한다. 네트워크를 안 쓴다' },
  { id: 'store',   label: '저장',  hint: '계산 결과가 앉는 자리' },
  { id: 'serve',   label: '서빙',  hint: '요청이 올 때마다 실시간으로 돈다' },
  { id: 'view',    label: '화면',  hint: '사람이 보는 것' },
];
const STAGE_IDS = new Set(STAGES.map((s) => s.id));

// ── 상태 넷 ──────────────────────────────────────────────────────────────────
// 여기에 'unknown' 을 하나 더 둔다. **모르는 것을 안다고 하지 않기 위해서다.**
// 이 저장소의 상태 페이지가 "못 잰 것은 아직 안 잼이라고 쓴다" 고 정한 것과 같다.
const STATES = new Set(['ok', 'partial', 'broken', 'planned', 'unknown']);

const die = (msg) => { console.error(`\n  ✗ ${msg}\n`); process.exit(1); };

// ─────────────────────────────────────────────────────────────────────────────
// 1. 조각 찾기 — 목록을 안 적는다. 폴더를 훑는다
// ─────────────────────────────────────────────────────────────────────────────
function findPieces() {
  const found = [];
  for (const name of readdirSync(ROOT, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name.startsWith('.')) continue;
    if (name.name === 'node_modules') continue;
    const p = join(ROOT, name.name, PIECE);
    if (existsSync(p)) found.push({ dir: name.name, path: p });
  }
  return found.sort((a, b) => a.dir.localeCompare(b.dir));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 증거 확인 — 조각의 주장이 아니라 파일을 본다
// ─────────────────────────────────────────────────────────────────────────────
//
// 증거는 넷 중 하나로 적는다.
//   { "file":  "경로" }            그 파일이 있어야 한다
//   { "any":   ["경로", …] }       하나라도 있으면 된다
//   { "all":   ["경로", …] }       전부 있어야 한다
//   { "ref":   "브랜치:경로" }     이 브랜치 말고 다른 브랜치에 있다
//   { "human": "설명" }            저장소로는 확인 못 한다 (사람이 받아오는 파일 등)
//
// 🔴 `ref` 의 브랜치 이름은 **결과에 안 싣는다.** 이 페이지는 로그인 없이 누구나
//    보고, 그 규칙이 사람 이름·커밋 번호·브랜치 이름을 넣지 말라고 정해 두었다.
//    나가는 것은 "다른 곳에 있다 / 확인 못 했다" 는 판정뿐이다.

// 🔴 다른 브랜치를 보는 증거는 **"있다" 만 증명하고 "없다" 는 절대 주장하지 않는다.**
//
//    CI 러너는 브랜치 하나만 얕게 복제하고, 서버도 마찬가지다. 거기서는 남의
//    브랜치가 아예 없으므로 "못 찾음" 이 "그 파일이 없음" 과 구별되지 않는다.
//    구별 못 하는 것을 "끊김" 으로 적으면, 멀쩡한 앱이 끊긴 것으로 그려진다.
//
//    이 팀은 이걸 이미 한 번 겪었다 — 문서가 **비관 쪽으로 틀렸을 때** 에이전트가
//    그것을 읽고 시도조차 안 했고, 그동안 실제로 되는 것이 묻혔다. 버그보다 나빴다.
//    그래서 못 찾으면 `끊김` 이 아니라 **`확인 못 함`** 을 낸다.
function refExists(ref) {
  try {
    execFileSync('git', ['cat-file', '-e', ref], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch (e) {
    return null;
  }
}

function checkEvidence(ev) {
  if (!ev || typeof ev !== 'object') return { kind: 'none', found: null, shown: null };
  if (ev.human) return { kind: 'human', found: null, shown: ev.human };
  if (ev.ref) {
    const found = refExists(ev.ref);
    return {
      kind: 'ref', found,
      shown: found ? '다른 브랜치에 있는 것을 확인했다'
                   : '다른 브랜치에 있어 여기서는 확인 못 했다',
    };
  }
  if (ev.file) return { kind: 'file', found: existsSync(join(ROOT, ev.file)), shown: ev.file };
  if (Array.isArray(ev.any)) {
    const hit = ev.any.find((p) => existsSync(join(ROOT, p)));
    return { kind: 'any', found: Boolean(hit), shown: hit || ev.any[0] };
  }
  if (Array.isArray(ev.all)) {
    const miss = ev.all.filter((p) => !existsSync(join(ROOT, p)));
    return { kind: 'all', found: miss.length === 0, shown: miss.length ? miss[0] : ev.all[0] };
  }
  return { kind: 'none', found: null, shown: null };
}

// ── 상태를 정하는 규칙 — 한 문장으로 말할 수 있어야 한다 ──────────────────────
//
//   **파일이 없으면 무조건 끊김. 파일이 있어도 사람이 "반쪽" 이라 적었으면 반쪽.**
//
// 왜 이렇게 가르나: 파일이 없다는 것은 **잰 사실**이라 사람의 주장보다 세다.
// 반대로 파일이 있다는 것은 "돈다" 는 뜻이 아니다 — 머지는 됐는데 운영에는
// 안 올라간 것이 이 팀에서 실제로 여러 번 있었다. 그건 사람만 안다.
function resolveState(declared, ev) {
  if (ev.found === false) {
    return { state: 'broken', by: 'measured' };            // 잰 것이 이긴다
  }
  if (declared) {
    return { state: declared, by: ev.found === true ? 'stated' : 'stated' };
  }
  if (ev.found === true) return { state: 'ok', by: 'measured' };
  return { state: 'unknown', by: 'none' };                 // 아무 근거도 없다
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 읽고 합치기
// ─────────────────────────────────────────────────────────────────────────────
const problems = [];
const nodes = [];
const edges = [];
const parts = [];

for (const piece of findPieces()) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(piece.path, 'utf8'));
  } catch (e) {
    problems.push(`${piece.dir}/${PIECE} — JSON 이 깨졌습니다: ${e.message}`);
    continue;
  }

  const partId = raw.part || piece.dir;
  if (!raw.label) problems.push(`${piece.dir}/${PIECE} — "label"(사람이 읽을 파트 이름)이 없습니다`);
  parts.push({ id: partId, label: raw.label || partId, note: raw.note || '', dir: piece.dir });

  for (const n of raw.nodes || []) {
    if (!n.id) { problems.push(`${piece.dir} — id 없는 칸이 있습니다`); continue; }
    if (!STAGE_IDS.has(n.stage)) {
      problems.push(`${piece.dir} · ${n.id} — 모르는 단계 "${n.stage}". 쓸 수 있는 것: ${[...STAGE_IDS].join(' · ')}`);
      continue;
    }
    if (n.state && !STATES.has(n.state)) {
      problems.push(`${piece.dir} · ${n.id} — 모르는 상태 "${n.state}"`);
      continue;
    }
    if (n.state && n.state !== 'ok' && !n.why) {
      problems.push(`${piece.dir} · ${n.id} — "${n.state}" 라고 적었으면 "why"(왜 그런지 한 줄)도 적어야 합니다`);
    }
    const ev = checkEvidence(n.evidence);
    const { state, by } = resolveState(n.state, ev);
    nodes.push({
      id: n.id, part: partId, stage: n.stage,
      label: n.label || n.id, kind: n.kind || 'step',
      note: n.note || '', why: n.why || '',
      state, by, evidence: ev.shown, evidenceKind: ev.kind,
    });
  }

  for (const e of raw.edges || []) {
    if (!e.from || !e.to) { problems.push(`${piece.dir} — from/to 없는 화살표가 있습니다`); continue; }
    if (e.state && !STATES.has(e.state)) {
      problems.push(`${piece.dir} · ${e.from}→${e.to} — 모르는 상태 "${e.state}"`);
      continue;
    }
    if (e.state && e.state !== 'ok' && !e.why) {
      problems.push(`${piece.dir} · ${e.from}→${e.to} — "${e.state}" 라고 적었으면 "why" 도 적어야 합니다`);
    }
    const ev = checkEvidence(e.evidence);
    const { state, by } = resolveState(e.state, ev);
    edges.push({
      from: e.from, to: e.to, part: partId,
      label: e.label || '', note: e.note || '', why: e.why || '',
      state, by, evidence: ev.shown, evidenceKind: ev.kind,
    });
  }
}

// ── 이어지는지 본다 ──────────────────────────────────────────────────────────
// 화살표가 없는 칸을 가리키면 그림에 구멍이 난다. 조용히 빠지게 두지 않는다.
const byId = new Map(nodes.map((n) => [n.id, n]));
const dupes = new Set();
const seen = new Set();
for (const n of nodes) {
  if (seen.has(n.id)) dupes.add(n.id);
  seen.add(n.id);
}
for (const id of dupes) problems.push(`칸 id 가 둘 이상입니다: "${id}" — 파트 이름을 앞에 붙여 겹치지 않게 하세요`);
for (const e of edges) {
  if (!byId.has(e.from)) problems.push(`화살표가 없는 칸에서 옵니다: "${e.from}" → ${e.to}`);
  if (!byId.has(e.to)) problems.push(`화살표가 없는 칸으로 갑니다: ${e.from} → "${e.to}"`);
}

if (problems.length) {
  console.error(`\n  흐름 조각에 문제가 ${problems.length}건 있습니다.\n`);
  for (const p of problems) console.error(`    · ${p}`);
  console.error('');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 내놓기
// ─────────────────────────────────────────────────────────────────────────────
const counts = { ok: 0, partial: 0, broken: 0, planned: 0, unknown: 0 };
for (const x of [...nodes, ...edges]) counts[x.state]++;

const graph = {
  builtAt: new Date().toISOString(),
  stages: STAGES,
  parts,
  nodes,
  edges,
  counts,
};

// ── 🔴 어느 브랜치에서 만드는지가 답을 바꾼다 ────────────────────────────────
//
// 파트마다 브랜치가 다르다. 지금 체크아웃돼 있지 않은 파트의 파일은 **여기서는
// 없는 것으로 보인다** — 그러면 멀쩡한 파트가 끊긴 것으로 그려진다.
// 전부 합쳐져 있는 곳은 최상위 `main` 뿐이므로, 서버에 올릴 그림은 거기서 만든다.
//
// 이걸 조용히 두면 다음 사람이 자기 브랜치에서 만들어 보고 그 그림을 믿는다.
// 그래서 **합쳐지는 자리가 아니면 말해 준다.** 그림에는 안 싣는다 — 이 페이지는
// 로그인 없이 누구나 보고, 브랜치 이름을 넣지 않기로 한 자리다.
function onMergeBranch() {
  try {
    const b = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT })
      .toString().trim();
    return b === 'main' || b === 'HEAD';
  } catch { return null; }
}

const outArg = process.argv.find((a) => a.startsWith('--out='));
const out = outArg ? resolve(outArg.slice('--out='.length)) : join(HERE, 'graph.json');

const broken = [...nodes, ...edges].filter((x) => x.state === 'broken' || x.state === 'partial');

if (process.argv.includes('--check')) {
  console.log(`  조각 ${parts.length}개 · 칸 ${nodes.length}개 · 화살표 ${edges.length}개 — 이상 없습니다.`);
} else {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(graph, null, 2) + '\n', 'utf8');
  console.log(`  ${out}`);
  console.log(`  조각 ${parts.length}개 · 칸 ${nodes.length}개 · 화살표 ${edges.length}개`);
}

console.log(`  이어짐 ${counts.ok} · 반쪽 ${counts.partial} · 끊김 ${counts.broken} · 계획 ${counts.planned} · 모름 ${counts.unknown}`);

if (onMergeBranch() === false) {
  console.log('');
  console.log('  ⚠ 파트가 다 합쳐지는 브랜치가 아닌 곳에서 만들었습니다.');
  console.log('    다른 파트의 파일이 여기 없으면 **끊긴 것으로 보입니다** — 실제로는 멀쩡한데도.');
  console.log('    서버에 올릴 그림은 전부 합쳐지는 최상위 브랜치에서 만드세요.');
}
if (broken.length) {
  console.log('\n  끊기거나 반쪽인 곳:');
  for (const b of broken) {
    const name = b.id ? b.label : `${b.from} → ${b.to}`;
    const mark = b.by === 'measured' ? '잼' : '적음';
    console.log(`    · [${mark}] ${name}${b.why ? ` — ${b.why}` : ''}`);
  }
  console.log('');
}
