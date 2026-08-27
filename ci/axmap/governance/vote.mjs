#!/usr/bin/env node
/**
 * 표를 던진다 — **저장소 안의 파일 하나로.**
 *
 *   node axmap/governance/vote.mjs --branch <소스브랜치> [--sha <커밋>]
 *                                  [--vote approve|reject] [--note "..."] [--force]
 *
 * GitLab 의 Approve 버튼을 쓰지 않는 이유는 [GOVERNANCE.md](GOVERNANCE.md) 와
 * docs/DECISIONS.md 의 D18 에 있다 — 판정을 GitLab API(**다른 프로그램이 GitLab 에
 * 물어보는 창구**)에 걸면, 이 저장소를 다른 곳으로 clone(**저장소를 통째로
 * 내려받는 것**)한 사람에게는 이 층이 **존재하지 않는다.** 파일이면 clone 이 곧
 * 이관이다.
 *
 * ── 자리와 모양 ──────────────────────────────────────────────────────────
 *
 *   브랜치: axmap/votes                       코드와 섞지 않는다
 *   경로  : votes/<소스브랜치>/<voter>-<sha앞8자>.json
 *
 * 브랜치 이름의 `/` 는 그대로 디렉터리 구분자로 둔다
 * (`votes/feat/S15P21E201-144-login/…`). 치환하면 서로 다른 두 브랜치가 같은
 * 디렉터리를 가리킬 수 있고, 이 저장소는 락에서 **치환이 곧 소유권 충돌**이라는
 * 이유로 그것을 금지해 왔다 (SPEC §3).
 *
 * **한 사람이 한 커밋에 정확히 파일 하나.** 중복이 파일시스템 수준에서 불가능하다.
 *
 * ── 여기서 하지 않는 것 ───────────────────────────────────────────────────
 *
 * 🔴 `committerEmail` 을 파일에 적지 않는다. 그 칸은 게이트가 git 에서 채워
 *    표에 적힌 신원과 **대조**하는 자리다. 표를 쓰는 사람이 적으면 대조가 아니라
 *    자기 신고가 되고, 그러면 남의 이름으로 표를 만드는 데 아무 비용이 안 든다.
 *
 * 🔴 판정을 하지 않는다. 자기 표인지·투표권자인지 **경고는 하지만**, 세는 것은
 *    언제나 게이트다. 여기서 미리 거르면 규칙이 두 군데로 갈라지고, 그때부터
 *    한 쪽만 고쳐지는 날이 온다.
 *
 * ── 장부와 같은 방식 ─────────────────────────────────────────────────────
 *
 * 표 브랜치를 다루는 방법은 `bin/axmap.mjs` 의 장부(`axmap/claims`)와 같다:
 * 고아 브랜치(**아무 이력에도 붙지 않은 브랜치**)를 worktree(**같은 저장소의 다른
 * 브랜치를 별도 폴더에 펼쳐 둔 작업 공간**)로 붙여 두고, fetch → reset --hard →
 * 쓰기 → 커밋 → push 순으로 간다. push 가 거부되면 그 사이에 누가 먼저 쓴 것이므로
 * 최신을 받아 다시 한다 (CAS — **Compare-And-Swap**, "내가 읽은 뒤로 바뀐 게
 * 없을 때만 쓴다". git push 가 원래 이렇게 동작한다).
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { agentNameError } from '../src/protocol.mjs'
import { EXIT, DEFAULT_POLICY_PATH } from '../src/governance.mjs'

const VOTES_BRANCH = 'axmap/votes'
const VOTES_REL = path.join('.axmap', 'votes')

/** push 가 거부될 때(= 누가 먼저 도착) 다시 해보는 횟수. bin/axmap.mjs 와 같은 값. */
const MAX_CAS_RETRIES = 5
/** 50 → 1600ms. bin/axmap.mjs 의 계단을 그대로 쓴다. */
const BACKOFF_MS = [50, 100, 200, 400, 800, 1600]

// ---------------------------------------------------------------------------
// git — bin/axmap.mjs 의 관례 그대로
// ---------------------------------------------------------------------------

/**
 * git 이 훅을 실행할 때 심어 놓는 환경변수들. cwd 보다 우선하므로, 남겨 두면
 * 표 worktree 를 다루는 명령이 **커밋 중인 저장소**를 가리켜 깨진다.
 */
const GIT_ENV_KEYS = [
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_COMMON_DIR',
  'GIT_INDEX_FILE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_PREFIX',
]

function cleanEnv() {
  const e = { ...process.env }
  for (const k of GIT_ENV_KEYS) delete e[k]
  return e
}

let ROOT = null

function git(args, opts = {}) {
  const r = spawnSync('git', args, {
    cwd: opts.cwd ?? ROOT ?? undefined,
    input: opts.input,
    env: cleanEnv(),
    encoding: 'utf8',
    windowsHide: true,
  })
  return { code: r.status ?? 1, out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim() }
}

function gitOrDie(args, opts = {}) {
  const r = git(args, opts)
  if (r.code !== 0) die(`git ${args.join(' ')} 실패\n${r.err || r.out}`)
  return r
}

function die(msg, code = EXIT.UNDECIDABLE) {
  console.error(msg)
  process.exit(code)
}

/**
 * 의존성 없는 동기 sleep. `Atomics.wait` 은 아무도 깨우지 않는 SharedArrayBuffer
 * 에서 timeout 만큼 정확히 멈춘다. spawnSync 로 짜인 이 파일에 async 를 들이면
 * 호출부 전체가 물든다 (bin/axmap.mjs 와 같은 이유).
 */
function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * 백오프에 난수를 안 쓰고 **pid** 를 쓴다. 흩어놓는 목적은 pid 로도 달성되고,
 * 난수와 달리 같은 입력에서 같은 타이밍이 재현되므로 테스트가 확인할 수 있다.
 */
function backoffFor(attempt) {
  const b = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]
  return b + Math.floor((b * (process.pid % 64)) / 64)
}

// ---------------------------------------------------------------------------
// 인자
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { positional.push(a); continue }
    const eq = a.indexOf('=')
    if (eq !== -1) flags[a.slice(2, eq)] = a.slice(eq + 1)
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) flags[a.slice(2)] = argv[++i]
    else flags[a.slice(2)] = true
  }
  return { positional, flags }
}

const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)

const HELP = `표를 던진다 — 저장소 안의 파일 하나로

  node axmap/governance/vote.mjs --branch <소스브랜치> [옵션]

  --branch    표를 줄 브랜치 (필수)
  --sha       그 브랜치의 어느 커밋에 주는가. 생략하면 지금 헤드
  --vote      approve | reject. 생략하면 approve
  --note      한 줄 메모 (사람이 읽는다)
  --target    자기 표(G1) 경고를 위해 비교할 브랜치. 생략하면 main
  --force     자기 표라는 경고를 무릅쓰고 그래도 쓴다
  --remote    원격 이름. 없으면 git config axmap.remote → 유일한 원격 → origin
  --policy    정책 파일의 자리 (저장소 루트 기준). 없으면 AXMAP_POLICY_PATH
              → ${DEFAULT_POLICY_PATH}. 명단 경고에만 쓴다 (판정은 게이트가 한다)

  표는 ${VOTES_BRANCH} 브랜치의 votes/<브랜치>/<이름>-<sha8>.json 에 쌓인다.
  reject 는 정족수 계산에 들어가지 않는다 — 이 층은 "찬성이 몇인가" 만 센다.
  다만 판정문에는 반드시 보인다.
`

// ---------------------------------------------------------------------------
// 표 worktree — 장부와 같은 방식
// ---------------------------------------------------------------------------

function repoRoot() {
  const r = git(['rev-parse', '--show-toplevel'], { cwd: process.cwd() })
  if (r.code !== 0) die('git 저장소 안에서 실행해야 합니다.')
  return r.out
}

const votesDir = () => path.join(ROOT, VOTES_REL)

/** bin/axmap.mjs 의 `resolveRemote` 와 같은 순서. 못 고르면 null 이다. */
function resolveRemote(flags) {
  const all = git(['remote']).out.split('\n').map((s) => s.trim()).filter(Boolean)
  const given = str(flags.remote) ?? str(process.env.AXMAP_REMOTE)
  if (given) {
    if (!all.includes(given)) {
      die(`지정한 원격이 없습니다: ${given}${all.length ? ` (있는 것: ${all.join(', ')})` : ''}`)
    }
    return given
  }
  const cfg = git(['config', '--get', 'axmap.remote']).out
  if (cfg && all.includes(cfg)) return cfg
  if (all.length === 1) return all[0]
  if (all.includes('origin')) return 'origin'
  return null
}

/**
 * 표 worktree 를 준비한다. `bin/axmap.mjs` 의 `cmdInit` 과 같은 순서다.
 *
 * 원격에 이미 표 브랜치가 있으면 그것을 이어 쓰고, 없으면 빈 트리 → 부모 없는
 * 커밋 → 브랜치로 고아 브랜치를 만든다. 작업 트리를 건드리지 않는 방법이다.
 */
function ensureVotesWorktree(remote) {
  const dir = votesDir()
  // 폴더를 손으로 지웠어도 git 쪽에는 등록이 남아 `worktree add` 가
  // "already registered" 로 실패한다. 먼저 정리한다.
  git(['worktree', 'prune'])

  if (fs.existsSync(path.join(dir, '.git'))) return dir
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) {
    die(`${VOTES_REL} 가 이미 있지만 정상적인 worktree 가 아닙니다.\n지운 뒤 다시 시도하세요:  rm -rf ${VOTES_REL}`)
  }

  let base = null
  if (remote && git(['fetch', '--quiet', remote, VOTES_BRANCH]).code === 0) {
    base = gitOrDie(['rev-parse', 'FETCH_HEAD']).out
  } else if (git(['rev-parse', '--verify', '--quiet', `refs/heads/${VOTES_BRANCH}`]).code === 0) {
    base = git(['rev-parse', `refs/heads/${VOTES_BRANCH}`]).out
  } else {
    const tree = gitOrDie(['mktree'], { input: '' }).out
    base = gitOrDie(['commit-tree', tree, '-m', 'axmap: votes init']).out
    console.error(`표 브랜치를 새로 만듭니다: ${VOTES_BRANCH}`)
  }

  if (git(['rev-parse', '--verify', '--quiet', `refs/heads/${VOTES_BRANCH}`]).code !== 0) {
    gitOrDie(['branch', VOTES_BRANCH, base])
  }
  gitOrDie(['worktree', 'add', '--quiet', dir, VOTES_BRANCH])
  return dir
}

/**
 * 원격 표를 그대로 가져와 로컬을 덮어쓴다.
 *
 * `reset --hard` 인 이유는 장부와 같다 — 표는 병합 대상이 아니라 **원격이 진실**
 * 이다. 이전 시도에서 push 가 거부되어 남은 로컬 커밋도 여기서 함께 버려진다.
 */
function syncVotes(remote) {
  if (!remote) return
  const dir = votesDir()
  // fetch 는 반드시 표 worktree 안에서. FETCH_HEAD 는 worktree 별로 따로
  // 보관되므로, 본 저장소에서 fetch 하면 여기서는 그것을 볼 수 없다.
  if (git(['fetch', '--quiet', remote, VOTES_BRANCH], { cwd: dir }).code !== 0) {
    // 브랜치가 아직 없을 뿐일 수 있다. 원격 자체에 닿는지를 따로 묻는다.
    const probe = git(['ls-remote', '--exit-code', remote, 'HEAD'], { cwd: dir })
    if (probe.code === 0 || probe.code === 2) return
    die(
      '원격에 닿을 수 없어 표를 던지지 않았습니다.\n'
      + '  로컬에만 남긴 표는 CI 가 보지 못합니다 — 던졌다고 믿는 동안 아무도 안 셉니다.',
    )
  }
  const r = git(['reset', '--hard', '--quiet', 'FETCH_HEAD'], { cwd: dir })
  if (r.code !== 0) die(`표 브랜치 동기화 실패\n${r.err || r.out}`)
}

/** 표 worktree 의 현재 HEAD. push 가 실패하면 여기로 되돌린다. */
function votesHead() {
  const r = git(['rev-parse', 'HEAD'], { cwd: votesDir() })
  return r.code === 0 ? r.out : null
}

// ---------------------------------------------------------------------------
// 경고 — 조용히 무효표를 쌓지 않는다
// ---------------------------------------------------------------------------

/**
 * 이 브랜치 커밋의 author 중에 내가 있는가 (G1 — 자기 표는 안 세진다).
 *
 * 게이트는 `<타깃>..<소스>` 로 정확히 계산하지만, 여기서는 타깃을 모른다.
 * 그래서 `--target`(기본 `main`)과의 갈림점부터 센다. 그 브랜치가 없으면
 * 최근 200 커밋으로 떨어지고, **어느 범위를 봤는지 경고에 함께 적는다** —
 * 근거를 안 적으면 사람이 경고를 믿을지 말지 판단할 수 없다.
 */
function selfVoteRange(branch, targetName) {
  const t = git(['rev-parse', '--verify', '--quiet', `${targetName}^{commit}`])
  if (t.code === 0 && t.out) {
    const mb = git(['merge-base', t.out, branch])
    if (mb.code === 0 && mb.out) return { args: [`${mb.out}..${branch}`], label: `${targetName}..${branch}` }
  }
  return { args: ['-n', '200', branch], label: `${branch} 의 최근 200 커밋` }
}

function warnIfSelfVote(branch, targetName, email, force) {
  const range = selfVoteRange(branch, targetName)
  const r = git(['log', '--format=%aE', ...range.args])
  if (r.code !== 0) {
    console.error(`경고: 소스 브랜치의 author 를 읽지 못해 자기 표인지 확인하지 못했습니다.\n  ${r.err.split('\n')[0]}`)
    return
  }
  const authors = new Set(r.out.split('\n').map((s) => s.trim().toLowerCase()).filter(Boolean))
  if (!authors.has(email.toLowerCase())) return

  console.error(
    `이 표는 자기 표라 세지지 않습니다 (G1 — 자기가 쓴 코드에 자기가 찬성할 수 없습니다).\n`
    + `  ${email} 이(가) ${range.label} 의 author 목록에 있습니다.\n\n`
    + '  그래도 남기려면 --force 를 붙이세요. 파일은 남고 판정문에는 "안 센 표" 로 보입니다.\n'
    + '  조용히 무효표를 쌓지 않는 이유: 던졌다고 믿는 사람이 아무도 안 세는 표를 기다립니다.',
  )
  if (!force) process.exit(EXIT.SHORT)
  console.error('  --force 가 있어 그래도 씁니다.\n')
}

/**
 * 정책 파일의 자리. `governance/gate.mjs` 의 `resolvePolicyPath` 와 **같은 순서**다:
 * `--policy` 플래그 → 환경변수 `AXMAP_POLICY_PATH` → `DEFAULT_POLICY_PATH`.
 * 순서가 갈리면 게이트가 보는 정책과 여기서 보는 명단이 서로 다른 파일이 된다.
 *
 * 🔴 여기서도 옛 자리로 되돌아가는 폴백은 없다. 못 읽으면 경고를 접을 뿐이다 —
 *    이 CLI 는 판정하지 않으므로 못 읽는 것이 통과로 이어지지 않는다.
 */
function resolvePolicyPath(flags) {
  const given = str(flags.policy) ?? str(process.env.AXMAP_POLICY_PATH)
  const raw = given ?? DEFAULT_POLICY_PATH
  return raw.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '')
}

/**
 * 명단에 없는 사람이면 알려준다. **막지는 않는다** — 승계(**투표권자가 모자랄 때
 * 최근 기여자에게 임시 투표권을 주는 것**)로 세질 수 있고, 그 판단은 게이트의
 * 몫이기 때문이다. 여기서 막으면 규칙이 두 군데로 갈라진다.
 */
function rosterOf(targetName, policyPath) {
  const r = git(['show', `${targetName}:${policyPath}`])
  if (r.code !== 0) return null // 타깃을 모르거나 정책이 아직 없다.
  try {
    const policy = JSON.parse(r.out)
    return Array.isArray(policy?.voters) ? policy.voters : []
  } catch { return null }
}

/** 명단에서 내 email 에 해당하는 줄. email 이 유일 키다 (GOVERNANCE.md). */
function rosterEntry(roster, email) {
  if (!Array.isArray(roster)) return null
  const want = email.trim().toLowerCase()
  return roster.find((v) => String(v?.email ?? '').trim().toLowerCase() === want) ?? null
}

function warnIfNotAVoter(roster, targetName, email) {
  if (roster === null) return // 경고는 부가 기능이다. 못 읽으면 조용히 넘어간다.
  if (rosterEntry(roster, email)) return
  console.error(
    `경고: ${email} 은(는) ${targetName} 의 정책 명단에 없습니다.\n`
    + '  승계가 발동한 경우에만 세집니다. 평소에는 "투표권자가 아님" 으로 안 세집니다.',
  )
}

// ---------------------------------------------------------------------------
// 본체
// ---------------------------------------------------------------------------

const { flags } = parseArgs(process.argv.slice(2))
if (flags.help || flags.h) {
  console.log(HELP)
  process.exit(0)
}

ROOT = repoRoot()

const branch = str(flags.branch)
if (!branch) {
  die(`어느 브랜치에 표를 주는지 말해야 합니다.\n\n${HELP}`)
}

const targetName = str(flags.target) ?? 'main'

// 대상 커밋. 생략하면 그 브랜치의 지금 헤드다. 40자 전체를 적는다 — 표는 커밋에
// 묶이므로(G3) 축약형을 적어 두면 나중에 어느 커밋이었는지가 흐려진다.
const shaFlag = str(flags.sha)
const shaRef = shaFlag ?? branch
const shaRes = git(['rev-parse', '--verify', '--quiet', `${shaRef}^{commit}`])
if (shaRes.code !== 0 || !shaRes.out) {
  die(
    `커밋을 찾을 수 없습니다: ${shaRef}\n`
    + (shaFlag ? '  --sha 값을 확인하세요.' : `  브랜치 ${branch} 가 로컬에 있는지 확인하세요 (git fetch 가 필요할 수 있습니다).`),
  )
}
const sha = shaRes.out

const voteValue = str(flags.vote) ?? 'approve'
if (voteValue !== 'approve' && voteValue !== 'reject') {
  die(`--vote 는 approve 나 reject 여야 합니다: ${voteValue}`)
}
const note = str(flags.note)

// 신원. 🔴 안전한 기본값을 두지 않는다 — 이름이 겹치면 두 사람의 표가 같은 파일을
// 가리키고, 나중에 던진 쪽이 앞의 표를 덮어쓴다.
let voter = git(['config', 'user.name']).out
const email = git(['config', 'user.email']).out
if (!email) {
  die(
    'git 에 email 이 설정돼 있지 않습니다. 표의 유일 키는 email 입니다.\n'
    + '  git config user.email <내-email>\n'
    + '기본값으로 채우지 않는 이유: 사람을 가리키는 것은 이름이 아니라 email 이고,\n'
    + '틀린 email 로 던진 표는 게이트가 "투표권자가 아님" 으로 버립니다.',
  )
}
if (!voter) {
  die('git 에 이름이 설정돼 있지 않습니다.\n  git config user.name <내-이름>')
}
/**
 * 🔴 `voter` 는 **명단이 정한다.** `git config user.name` 이 아니다.
 *
 * 실측(2026-08-26): 이 PC 의 `user.name` 은 `janghyojoon` 인데 정책 명단의 `id` 는
 * `rleaderjoon`(GitLab 계정 이름)이었다. email 은 같았다. 게이트는 명단에 적힌
 * 사람의 표는 **id 까지 맞아야** 세므로, 표는 정상적으로 쓰이고 판정에서만
 * `표의 이름과 email 이 명단과 어긋남` 으로 조용히 빠졌다.
 *
 * 던진 사람은 자기가 던졌다고 믿고, 게이트는 안 셌다. **락에서 최악은 조용한
 * 통과지만 투표에서 최악은 조용한 누락이다** — 아무도 왜 안 세지는지 못 푼다.
 *
 * email 이 유일 키이므로(GOVERNANCE.md) email 로 명단을 찾아 그 줄의 `id` 를 쓴다.
 * 명단에 없으면(승계로 들어올 사람) `user.name` 을 그대로 둔다 — 승계로 들어온
 * 사람은 저장소가 이름을 정해 준 적이 없어 게이트도 id 를 대조하지 않는다.
 */
const roster = rosterOf(targetName, resolvePolicyPath(flags))
const mine = rosterEntry(roster, email)
if (mine && String(mine.id ?? '').trim() && mine.id !== voter) {
  console.error(`이름을 명단에 맞춥니다: ${voter} → ${mine.id}  (${targetName} 의 정책 기준)`)
  voter = String(mine.id).trim()
}

// 이름은 그대로 파일명이 된다. 위험한 문자를 치환해서 통과시키면 서로 다른 두
// 이름이 같은 파일을 가리킨다 — 장부가 에이전트 이름에 쓰는 검사를 그대로 쓴다.
const nameErr = agentNameError(voter)
if (nameErr) die(`${nameErr}\n  git config user.name 을 고치세요.`)

warnIfNotAVoter(roster, targetName, email)
warnIfSelfVote(branch, targetName, email, flags.force === true)

const remote = resolveRemote(flags)
if (!remote) {
  console.error(
    '경고: 원격이 없어 표가 이 저장소 안에만 남습니다.\n'
    + '      CI 는 원격의 표를 보므로, 이대로면 아무도 이 표를 세지 못합니다.',
  )
}

ensureVotesWorktree(remote)

const relPath = `votes/${branch}/${voter}-${sha.slice(0, 8)}.json`
// 시각은 루프 밖에서 한 번 정한다. CAS 재시도마다 바뀌면 같은 표가 매번 다른
// 내용이 되어, 무엇 때문에 다시 쓰는지가 이력에서 안 보인다.
const record = {
  voter,
  email,
  branch,
  sha,
  vote: voteValue,
  at: new Date().toISOString(),
  ...(note ? { note } : {}),
  // 🔴 committerEmail 은 여기 없다. 게이트가 git 에서 채운다 (파일 머리말 참고).
}

for (let attempt = 1; attempt <= MAX_CAS_RETRIES; attempt++) {
  syncVotes(remote)
  const dir = votesDir()
  const before = votesHead()

  const full = path.join(dir, ...relPath.split('/'))
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, `${JSON.stringify(record, null, 2)}\n`)

  const add = git(['add', '-A'], { cwd: dir })
  if (add.code !== 0) die(`git add 실패\n${add.err || add.out}`)
  if (git(['diff', '--cached', '--quiet'], { cwd: dir }).code === 0) {
    console.log(`이미 같은 표가 있습니다: ${relPath}`)
    process.exit(0)
  }
  // --no-verify: 연결된 worktree 는 훅 디렉터리를 공유하므로, 사용자가 설치한
  // pre-commit 훅이 표 커밋에도 발동한다. 표는 사용자 코드가 아니다.
  const c = git(['commit', '--quiet', '--no-verify', '-m', `vote(${voter}): ${voteValue} ${branch}@${sha.slice(0, 8)}`], { cwd: dir })
  if (c.code !== 0) die(`git commit 실패\n${c.err || c.out}`)

  if (!remote) {
    console.log(`표를 남겼습니다 (로컬 전용): ${relPath}`)
    process.exit(0)
  }

  const p = git(['push', '--quiet', remote, `HEAD:${VOTES_BRANCH}`], { cwd: dir })
  if (p.code === 0) {
    console.log(`표를 던졌습니다: ${relPath}`)
    console.log(`  ${voter} <${email}>  ${voteValue}  ${branch}@${sha.slice(0, 8)}`)
    if (voteValue === 'reject') {
      console.log('  reject 는 정족수 계산에 들어가지 않습니다 — 판정문에 보이기만 합니다.')
    }
    process.exit(0)
  }

  // push 가 거부됐다. 그 사이에 누가 먼저 표를 올린 것이다(CAS 실패).
  // 로컬 커밋을 되돌린다 — 남겨두면 다음 syncVotes 의 reset --hard 가 조용히
  // 지우고, 사람은 표가 어디로 갔는지 모른다.
  if (before) git(['reset', '--hard', '--quiet', before], { cwd: dir })
  console.error(`push 거부됨 (누가 먼저 표를 올림). 재시도 ${attempt}/${MAX_CAS_RETRIES}`)
  if (attempt < MAX_CAS_RETRIES) {
    const ms = backoffFor(attempt - 1)
    console.error(`  ${ms}ms 기다렸다 다시 시도합니다.`)
    sleepMs(ms)
  }
}

die(
  `표 브랜치 경합이 심해 ${MAX_CAS_RETRIES}회 재시도 후 포기했습니다.\n`
  + '  (로컬은 되돌렸습니다 — 표는 남지 않았습니다. 잠시 후 다시 시도하세요.)',
)
