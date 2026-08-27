#!/usr/bin/env node
/**
 * 에이전트 사이의 쪽지함 — 사람을 거치지 않고 서로에게 말한다.
 *
 *   node tools/bus.mjs post --to <상대> --subject "<제목>"   (본문은 stdin)
 *   node tools/bus.mjs list [--to <나>|--mine] [--from <상대>] [--all]
 *                          [--throttle <초>] [--quiet-if-empty]   ← 훅용
 *   node tools/bus.mjs read <아이디>
 *   node tools/bus.mjs reply <아이디> --subject "<제목>"      (본문은 stdin)
 *
 * ── 왜 파일 하나가 아니라 **디렉터리**인가 ────────────────────────────────
 *
 * 🔴 쪽지 하나 = 파일 하나. 그래야 두 에이전트가 동시에 써도 안 부딪힌다.
 *
 * 처음엔 append-only 로그 파일 하나를 생각했다. 그런데 그건 우리가 이미
 * 아는 실패다 — 두 사람이 같은 파일 끝에 줄을 붙이면 git 이 텍스트 충돌을
 * 낸다. 이 저장소가 장부를 파서로 만든 이유가 정확히 그것이다
 * (docs/EXPERIMENT.md). 쪽지함에서 같은 실수를 반복하지 않는다.
 *
 * 파일 이름에 시각과 보낸 사람이 들어가므로 두 사람이 같은 이름을 쓸 일이 없다.
 * 충돌이 구조적으로 불가능하면 조율도 필요 없다.
 *
 * ── 왜 git 인가 ──────────────────────────────────────────────────────────
 *
 * 이미 있는 채널이다. 두 에이전트가 다른 컴퓨터에 있어도 pull/push 로 오간다.
 * 새 서버도, 새 의존성도, 새 인증도 필요 없다. 그리고 **기록이 남는다** —
 * 나중에 "왜 이렇게 정했나" 를 되짚을 수 있다.
 *
 * ⚠️ 실시간이 아니다. 상대가 pull 해야 읽는다. 급한 것은 claim 의 `--intent`
 *    에 한 줄로 적는 편이 빠르다 — 그건 `axmap status` 로 바로 보인다.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** **이 프로그램**의 뿌리. 데이터가 아니라 코드를 찾을 때만 쓴다 (`who` 의 axmap.mjs). */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** 지금 서 있는 폴더가 속한 **대상 저장소**의 루트. git 이 없거나 밖이면 null. */
function targetRepo() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch { return null }
}

/**
 * 쪽지가 쌓이는 곳. **기본값은 대상 저장소이고 `AXMAP_BUS_DIR` 로 옮길 수 있다.**
 *
 * 🔴 프로그램은 여기(axMap)에 있고 데이터는 대상 저장소에 있어야 한다.
 *    MCP 서버가 남의 저장소에 붙었을 때 이 값을 `<대상>/docs/bus` 로 넘긴다.
 *    안 그러면 그 팀의 쪽지가 axMap 저장소에 쌓이고, 정작 팀의 저장소에는
 *    아무것도 안 남는다 — 쪽지는 커밋해야 상대에게 가는데 커밋할 저장소가
 *    엉뚱한 곳이 되는 것이다.
 *
 * 🔴 예전 기본값은 `ROOT/docs/bus` 였다. **사본에서 조용히 틀린다** — 팀 저장소의
 *    `ci/axmap/tools/bus.mjs` 에서 `ROOT` 는 `ci/axmap` 이므로 없는 폴더를 가리키고,
 *    `readdirSync` 가 던지면 `readAll` 이 빈 배열을 낸다. 즉 **쪽지가 있어도
 *    "쪽지 없음" 이라고 답한다.** 2026-08-26 에 팀 저장소에서 실제로 그랬다.
 *    프로그램 위치로 데이터를 찾은 것이 원인이므로 이제 대상 저장소에게 묻는다.
 *
 *    못 찾으면 `ROOT` 로 되돌리지 않는다. 그건 서로 다른 두 상황(대상 저장소 안 /
 *    엉뚱한 곳)을 한 값으로 만드는 치환이고, 위 사고가 정확히 그 치환이었다.
 *
 * 🔴 그리고 이제 그 자리는 `docs/bus` 가 **아니다.** 고아 브랜치 `axmap/bus` 의
 *    worktree(`.axmap/bus/messages`)다. 작업 트리에 두면 상대에게 가는 데
 *    커밋 -> MR -> 머지 -> pull 이 필요했고, 보내려면 `docs/bus` 를 claim 해야 해서
 *    한 번에 한 명만 쪽지를 보낼 수 있었다. 장부가 그 문제를 이미 안 겪으므로
 *    같은 방식으로 옮긴다. 근거는 `bin/axmap.mjs` 의 `BUS_BRANCH` 주석.
 */
const REPO = (() => {
  if (process.env.AXMAP_BUS_DIR) return null // 대상이 명시됐으면 저장소를 물을 필요가 없다
  const repo = targetRepo()
  if (!repo) {
    console.error(
      '쪽지함을 찾지 못했습니다 — 여기는 git 저장소 안이 아닙니다.\n' +
        '대상 저장소 안에서 실행하거나 AXMAP_BUS_DIR 로 쪽지함을 직접 지정하세요.',
    )
    process.exit(1)
  }
  return repo
})()

/** 쪽지 worktree 의 루트. 커밋·push 는 여기서 돈다. */
const BUS_WT = REPO ? path.join(REPO, '.axmap', 'bus') : null
const BUS_BRANCH = 'axmap/bus'

/** **쓰는 곳은 하나뿐이다.** */
const BOX = process.env.AXMAP_BUS_DIR
  ? path.resolve(process.env.AXMAP_BUS_DIR)
  : path.join(BUS_WT, 'messages')

/**
 * **읽는 곳은 둘이다.** 옛 쪽지함(`docs/bus`)은 읽기만 한다.
 *
 * 옮기지 않는 이유: 옮기면 같은 내용이 두 브랜치에 남고 어느 쪽이 진짜인지
 * 아무도 모른다. 새것은 전부 고아 브랜치로 가므로 옛것은 자연히 마른다.
 */
const READ_BOXES = [BOX, ...(REPO ? [path.join(REPO, 'docs', 'bus')] : [])]

function gitBus(argv, opts = {}) {
  try {
    return {
      code: 0,
      out: execFileSync('git', argv, {
        cwd: BUS_WT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts,
      }).trim(),
    }
  } catch (e) { return { code: e.status ?? 1, out: '', err: String(e.stderr ?? e.message) } }
}

const busReady = () => BUS_WT !== null && fs.existsSync(path.join(BUS_WT, '.git'))

/**
 * 원격의 쪽지를 받아온다. **실패해도 죽지 않는다** — 못 받은 것은 위험이 아니라
 * 지연이다. 장부(`syncLedger`)가 같은 자리에서 죽는 것과 정반대이고, 그 차이의
 * 근거는 `bin/axmap.mjs` 의 `BUS_BRANCH` 주석에 있다.
 *
 * 🔴 `--throttle <초>` 는 **훅 때문에 생겼다.** MCP 서버는 세션 내내 살아 있어서
 *    `unreadBanner` 가 프로세스 안의 변수(`busCheckedAt`)로 15초를 잴 수 있었다.
 *    훅은 부를 때마다 **새 프로세스**라 그 변수가 매번 0에서 시작한다 — 즉 캐시가
 *    절대 안 맞고 훅이 뜰 때마다 `git fetch` 가 돈다. 그래서 시계를 프로세스
 *    밖(스탬프 파일)에 둔다. 캐시를 그대로 옮겨 붙이면 조용히 원격을 두들긴다.
 *
 *    스탬프는 `.axmap/.bus-lastfetch` 다. `.axmap/` 는 통째로 무시되고(.gitignore),
 *    쪽지 worktree(`.axmap/bus`) **바깥**이라 고아 브랜치에 섞이지 않는다.
 */
function pull() {
  if (!busReady()) return
  const sec = Number(flag('--throttle', '0'))
  const stampFile = REPO ? path.join(REPO, '.axmap', '.bus-lastfetch') : null
  if (sec > 0 && stampFile) {
    // 스탬프가 아직 신선하면 원격을 묻지 않고 **로컬 worktree 만** 읽는다.
    // 이미 받아둔 쪽지는 그대로 보인다 — 늦는 것은 새로 온 쪽지뿐이다.
    try {
      if (Date.now() - fs.statSync(stampFile).mtimeMs < sec * 1000) return
    } catch { /* 스탬프가 없으면 이번이 처음이다. 받아온다 */ }
  }
  const remote = gitBus(['config', '--get', 'axmap.remote'], { cwd: REPO }).out || 'origin'
  if (gitBus(['fetch', '--quiet', remote, BUS_BRANCH]).code !== 0) return
  gitBus(['reset', '--hard', '--quiet', 'FETCH_HEAD'])
  // 🔴 성공했을 때만 찍는다. 실패에도 찍으면 원격이 잠깐 막힌 사이에 스탬프가
  //    갱신되어 **다음 창까지 조용히 안 받는다.** 못 받은 것은 지연이지 성공이 아니다.
  if (stampFile) { try { fs.writeFileSync(stampFile, '') } catch { /* 스탬프 실패는 치명적이지 않다 */ } }
}

const args = process.argv.slice(2)
const cmd = args[0]
const flag = (n, d = null) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1] }
const has = (n) => args.includes(n)

/**
 * 나는 누구인가. 선점 프로토콜과 **같은 값**을 쓴다 — 두 이름을 두면 갈린다.
 *
 * 🔴 MCP 서버는 `AXMAP_AGENT` 를 떨어뜨려 주지만 **훅은 그렇지 않다.** 훅은
 *    하네스가 직접 띄우는 새 프로세스라 서버의 환경을 물려받지 않는다. 그래서
 *    서버의 `resolveAgent()` 와 **같은 순서**로 되짚는다 — 환경변수가 없으면
 *    `git config user.name`. 두 곳이 다른 순서를 쓰면 같은 사람이 두 이름을
 *    갖게 되고, 그 순간 자기 앞으로 온 쪽지가 자기 함에 안 들어온다.
 *
 * 🔴 못 찾으면 기본 이름으로 채우지 않고 죽는다. 채우는 순간 clone 한 모두가
 *    한 사람이 되고 쪽지함이 하나로 합쳐진다 (`mcp/server.mjs` 의 같은 판단).
 */
function me() {
  const v = process.env.AXMAP_AGENT
  if (v && /^[\w.-]{1,64}$/.test(v)) return v
  try {
    const n = execFileSync('git', ['config', 'user.name'], {
      cwd: REPO ?? process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    // 서버와 달리 여기서는 형식을 본다. 통과 못 하면 아래에서 죽는다 —
    // 못 읽는 이름을 그냥 쓰면 파일 이름과 필터가 조용히 어긋난다.
    if (n && /^[\w.-]{1,64}$/.test(n)) return n
  } catch { /* 아래에서 죽는다 */ }
  console.error(
    'AXMAP_AGENT 를 먼저 정하세요 (선점과 같은 값).\n' +
      '  git config user.name 으로도 정하지 못했습니다.\n' +
      '  기본 이름으로 대신 채우지 않습니다 — 여러 사람이 같은 이름이 되면\n' +
      '  서로의 쪽지함이 하나로 합쳐집니다.',
  )
  process.exit(1)
}

/**
 * 읽음 표시 — 규격은 `docs/SPEC.md` §2「읽음 표시」다. 여기와 `bin/axmap.mjs`
 * 의 `unreadNotes` 가 **같은 파일을 같은 규칙으로** 본다. 규칙이 한 줄이라
 * (`id > seen`) 공유 모듈로 빼지 않았지만, 한쪽을 고치면 반드시 다른 쪽도 본다.
 *
 * 🔴 장부에 넣지 않는다. 읽었는지는 나만의 상태라 남과 합의할 필요가 없고,
 *    장부에 쓰면 쪽지를 볼 때마다 push 경합이 생긴다.
 */
const SEEN_FILE = REPO ? path.join(REPO, '.axmap-bus-seen.json') : null

function readSeen(who) {
  if (!SEEN_FILE) return ''
  try { return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8'))[who] ?? '' } catch { return '' }
}

/**
 * 🔴 **조용히 실패한다.** 못 찍으면 다음에 같은 쪽지가 한 번 더 뜰 뿐이다.
 *    여기서 죽으면 쪽지를 보려다 명령이 통째로 죽는다 — 그쪽이 훨씬 나쁘다.
 *
 * 🔴 읽고-고쳐-쓴다. 이 파일에는 여러 에이전트의 표시가 함께 들어 있어서
 *    통째로 덮으면 남의 표시가 지워진다. 같은 사람의 두 세션이 동시에 쓰면
 *    한쪽이 질 수 있는데, 지는 쪽의 손해는 "한 번 더 뜬다" 뿐이라 잠그지 않는다.
 */
function markSeen(who, id) {
  if (!SEEN_FILE || !who || !id) return
  try {
    let all = {}
    try { all = JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')) } catch { /* 처음이다 */ }
    if ((all[who] ?? '') >= id) return           // 뒤로 가지 않는다
    all[who] = id
    fs.writeFileSync(SEEN_FILE, JSON.stringify(all, null, 2) + '\n')
  } catch { /* 조용히 */ }
}

const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
const slug = (s) => s.toLowerCase().replace(/[^\w가-힣]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'msg'

function readAll() {
  const found = []
  for (const box of READ_BOXES) {
    let ns = []
    try { ns = fs.readdirSync(box).filter((f) => f.endsWith('.md')) } catch { continue }
    for (const f of ns) found.push({ box, f })
  }
  return found.map(({ box, f }) => {
    const text = fs.readFileSync(path.join(box, f), 'utf8')
    const head = {}
    // 앞머리 `키: 값` 줄들. 빈 줄이 나오면 본문이 시작된다.
    //
    // 🔴 `split('\n')` 이 아니라 `\r?\n` 이다. 2026-08-26 에 여기서 물렸다.
    //
    //    쪽지가 고아 브랜치로 옮겨가면서 그 worktree 는 `.gitattributes` 가 닿지
    //    않는 트리가 됐고, Windows(`core.autocrlf=true`)에서 CRLF 로 체크아웃됐다.
    //    그러면 줄이 `from: alice\r` 이 되는데, **JS 정규식에서 `.` 은 `\r` 을
    //    안 먹는다** (`\r` 도 줄바꿈 문자다). `m` 플래그도 없어 `$` 는 문자열
    //    끝에서만 맞으므로 첫 줄부터 매치가 실패하고, 머리말이 통째로 빈 객체가
    //    된다. 그 결과가 "받는 사람이 없는 쪽지" 라 **목록에서 조용히 사라졌다.**
    //
    //    브랜치에 `.gitattributes` 도 함께 심었지만(`ensureBus`), 그것에만
    //    기대지 않는다. 데이터 포맷이 체크아웃 설정에 의존하면 그 설정이 닿지
    //    않는 자리가 생길 때마다 같은 사고가 난다 — 오늘 이미 세 번 났다.
    const lines = text.split(/\r?\n/)
    let i = 0
    for (; i < lines.length; i++) {
      const m = lines[i].match(/^(\w+):\s*(.*)$/)
      if (!m) break
      head[m[1]] = m[2].trim()
    }
    return { id: f.replace(/\.md$/, ''), file: f, ...head, body: lines.slice(i).join('\n').trim() }
  }).sort((a, b) => (a.id < b.id ? -1 : 1))
}

function stdin() {
  try { return fs.readFileSync(0, 'utf8') } catch { return '' }
}

function post({ to, subject, body, replyTo = null }) {
  const from = me()
  if (!subject) { console.error('--subject 가 필요합니다.'); process.exit(1) }
  if (!body.trim()) { console.error('본문이 비었습니다 (stdin 으로 주세요).'); process.exit(1) }
  // 🔴 쪽지함이 없으면 **쓰지 않고 거부한다.**
  //
  //    그냥 쓰면 `.axmap/bus/messages` 가 worktree 아닌 맨 폴더로 생기고, 그러면
  //    나중에 `ensureBus` 가 "정상적인 쪽지함이 아닙니다 — 지운 뒤 다시 하세요"
  //    라고 안내한다. **안 간 쪽지를 지우라고 시키는 것**이다. 여기서 멈추면
  //    사람은 init 한 번 하고 다시 보내면 된다 — 잃는 것이 없다.
  if (!process.env.AXMAP_BUS_DIR && !busReady()) {
    console.error(
      '쪽지함이 아직 없습니다. 한 번만 준비하면 됩니다:\n' +
        '  axmap init            (MCP 에서는 ax_init)\n\n' +
        '준비 전에 쪽지를 쓰지 않습니다 — 여기 남으면 아무에게도 안 가고,\n' +
        '나중에 쪽지함을 만들 때 지워야 할 것으로 보입니다.',
    )
    process.exit(1)
  }
  fs.mkdirSync(BOX, { recursive: true })
  const now = new Date()
  const id = `${stamp(now)}-${from}-${slug(subject)}`
  const head = [
    `from: ${from}`,
    `to: ${to ?? 'all'}`,
    `at: ${now.toISOString()}`,
    `subject: ${subject}`,
    replyTo ? `replyTo: ${replyTo}` : null,
  ].filter(Boolean).join('\n')
  // 임시 파일에 다 쓴 뒤 rename 한다. 같은 디렉터리 안의 rename 은 원자적이라
  // 읽는 쪽이 반쯤 쓰인 쪽지를 보는 일이 없다 — bin/axmap.mjs 의 writeFileAtomic 과
  // 같은 이유다. 장부만큼 치명적이진 않지만(쪽지는 판정에 쓰이지 않는다) 같은 값이면
  // 안전한 쪽으로 쓴다. 임시 이름이 `.md` 로 끝나지 않아 list 의 필터에도 안 걸린다.
  const dst = path.join(BOX, `${id}.md`)
  const tmp = `${dst}.tmp-${process.pid}`
  try {
    fs.writeFileSync(tmp, `${head}\n\n${body.trim()}\n`)
    fs.renameSync(tmp, dst)
  } catch (e) {
    try {
      fs.rmSync(tmp, { force: true })
    } catch {
      /* 무시 */
    }
    throw e
  }
  console.log(`보냄  ${id}`)
  console.log(`  쪽지함: ${BOX}`)
  console.log(`  ${publish(id)}`)
}

/**
 * 쪽지를 고아 브랜치에 실어 보낸다.
 *
 * 🔴 예전에는 여기서 아무것도 안 했다. 쪽지가 작업 트리(`docs/bus`)에 있어서
 *    "부르는 쪽이 자기 작업과 함께 올리게" 두는 것이 맞았다 — 여기서 커밋하면
 *    남이 작업 중인 트리를 건드리기 때문이다. 이제 쪽지는 **자기 worktree** 에
 *    있으므로 그 걱정이 사라졌고, 미루면 상대가 MR 한 사이클을 기다린다.
 *
 * 🔴 push 가 거부되면 **한 번만** 다시 시도한다. 쪽지 하나 = 파일 하나라 남과
 *    부딪힐 일이 없고, 거부는 곧 "그 사이 남이 쪽지를 넣었다" 는 뜻이다.
 *    받아서 다시 얹으면 끝난다. 그래도 안 되면 **죽이지 않는다** — 쪽지는
 *    로컬에 남아 있고 다음 호출에 함께 올라간다. 여기서 죽이면 원격이 잠깐
 *    흔들릴 때마다 사람의 작업이 멈춘다.
 */
function publish(id) {
  if (!busReady()) {
    return '아직 안 갔습니다 — 쪽지함이 준비되지 않았습니다. `axmap init` 을 한 번 실행하세요.'
  }
  const remote = gitBus(['config', '--get', 'axmap.remote'], { cwd: REPO }).out || 'origin'
  for (let attempt = 1; attempt <= 2; attempt++) {
    gitBus(['add', '-A'])
    // --no-verify: 연결된 worktree 는 훅을 공유한다. 쪽지함은 사용자 코드가 아니다.
    gitBus(['commit', '--quiet', '--no-verify', '-m', `bus: ${id}`])
    if (gitBus(['push', '--quiet', remote, `HEAD:${BUS_BRANCH}`]).code === 0) {
      return '보냈습니다. 상대는 아무 axMap 도구나 부르면 바로 봅니다.'
    }
    if (attempt === 1) {
      // 남이 먼저 넣었다. 받아서 내 쪽지를 그 위에 다시 얹는다.
      const mine = path.join(BOX, `${id}.md`)
      const keep = fs.existsSync(mine) ? fs.readFileSync(mine) : null
      pull()
      if (keep !== null) { fs.mkdirSync(BOX, { recursive: true }); fs.writeFileSync(mine, keep) }
    }
  }
  return '아직 안 갔습니다 — 원격에 못 올렸습니다. 다음 쪽지를 보낼 때 함께 올라갑니다.'
}

/**
 * 이 파일을 지금 폴더에서 부르는 명령. **문자열로 적지 않고 계산한다.**
 * 벤더링된 사본에서는 `tools/bus.mjs` 가 아니라 `ci/axmap/tools/bus.mjs` 다.
 */
function selfCmd() {
  const self = fileURLToPath(import.meta.url)
  const rel = path.relative(process.cwd(), self).replace(/\\/g, '/')
  return `node ${rel.startsWith('.') ? rel : './' + rel}`
}

/**
 * 🔴 `--mine` 과 `--quiet-if-empty` 도 훅 때문에 생겼다.
 *
 *    `--mine`  — 훅은 자기 이름을 모른다. `--to <이름>` 을 설정 파일에 박으면
 *                clone 한 모두가 한 사람의 함을 보게 된다. `me()` 가 풀게 한다.
 *    `--quiet` — 훅은 매 턴 돈다. 쪽지가 없을 때 "쪽지 없음." 을 찍으면 그 줄이
 *                대화의 절반을 채우고, 그러면 정작 쪽지가 왔을 때 안 보인다.
 *                **아무것도 없을 때 아무 말도 안 하는 것이 알림의 조건이다.**
 */
function list() {
  pull()
  const all = readAll()
  const to = has('--mine') ? me() : flag('--to')
  const from = flag('--from')
  let rows = all.filter((m) => (has('--all') || !to || m.to === to || m.to === 'all')
    && (!from || m.from === from))

  // 🔴 `--unread` 는 자기 앞으로 온 것을 가릴 때만 뜻이 있다. 받는 사람이
  //    정해지지 않았는데 "안 읽음" 을 말하면 누구의 읽음인지가 없다.
  const who = has('--unread') ? (to || me()) : null
  if (who) {
    const seen = readSeen(who)
    rows = rows.filter((m) => m.id > seen)
  }

  if (!rows.length) return has('--quiet-if-empty') ? undefined : console.log('쪽지 없음.')
  for (const m of rows) {
    console.log(`${m.at?.slice(0, 16).replace('T', ' ')}  ${(m.from ?? '?').padEnd(18)} → ${(m.to ?? 'all').padEnd(18)} ${m.subject ?? ''}`)
    console.log(`    ${m.id}`)
  }
  console.log(`\n총 ${rows.length}개. 본문:  ${selfCmd()} read <아이디>`)

  // 🔴 **찍는 것은 보여준 뒤다.** 위에서 죽으면 안 찍혀야 다음에 다시 뜬다.
  //    규격은 SPEC §2「읽음 표시」— 목록에 뜬 순간이 읽은 순간이다.
  //
  // 🔴 `--no-mark` 는 **목록을 잘라서 보여주는 쪽**을 위한 것이다. MCP 배너는
  //    받은 줄 중 3건만 그리는데, 여기서 전부를 찍으면 4번째부터는 화면에 뜬
  //    적도 없이 읽음이 되어 **영영 안 보인다.** 목록을 그대로 다 내보내는 쪽
  //    (사람이 부른 `list`)은 이 플래그가 필요 없다.
  //
  //    규칙 한 줄로 적으면 **그린 쪽이, 그린 것만 찍는다.** 자르는 쪽은
  //    `--no-mark` 로 읽기만 하고 자기가 그린 id 를 `seen` 에 넘긴다.
  if (who && !has('--no-mark')) {
    markSeen(who, rows.reduce((hi, m) => (m.id > hi ? m.id : hi), ''))
  }
}

function read(id) {
  pull()
  const m = readAll().find((x) => x.id === id || x.id.includes(id))
  if (!m) { console.error(`없는 쪽지: ${id}`); process.exit(1) }
  console.log(`── ${m.subject}\n   ${m.from} → ${m.to}   ${m.at}\n`)
  console.log(m.body)
}

/** 지금 누가 무엇을 잡고 있나 — 쪽지를 보내기 전에 상대가 뭘 하는지 본다. */
function who() {
  try {
    console.log(execFileSync('node', [path.join(ROOT, 'bin', 'axmap.mjs'), 'status'], {
      encoding: 'utf8', env: { ...process.env, AXMAP_AGENT: process.env.AXMAP_AGENT ?? 'bus' },
    }))
  } catch (e) { console.error(e.message) }
}

/**
 * 읽음 표시를 **주어진 쪽지에만** 찍는다. 규격은 SPEC §2「읽음 표시」.
 *
 * 🔴 이것이 따로 있는 이유는 하나다 — **목록을 잘라서 보여주는 쪽이 있기 때문이다.**
 *    `list` 는 자기가 낸 줄을 전부 알지만, MCP 배너처럼 그중 앞의 몇 줄만 그리는
 *    쪽은 `list` 에게 "내가 실제로 그린 것" 을 말해줄 방법이 없었다. 그래서
 *    찍는 일을 목록에서 떼어내 여기로 옮겼다.
 *
 * 🔴 `pull()` 을 하지 않는다. 로컬 파일 하나를 쓸 뿐이라 원격을 물을 이유가 없고,
 *    알림을 그릴 때마다 fetch 가 돌면 배너가 도구를 느리게 만든다.
 *
 * 고수위 하나만 들고 있으므로(SPEC §2) 여러 개를 받아도 가장 큰 것만 남는다.
 * 뒤로 가지 않는지는 `markSeen` 이 본다.
 */
function seen() {
  const ids = []
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--to') { i++; continue }        // 그 다음 것은 id 가 아니다
    if (args[i].startsWith('--')) continue
    ids.push(args[i])
  }
  if (!ids.length) {
    console.error(`찍을 쪽지 id 를 주세요.  예:  ${selfCmd()} seen <아이디> [<아이디>…]`)
    process.exit(1)
  }
  markSeen(has('--mine') ? me() : (flag('--to') || me()),
    ids.reduce((hi, id) => (id > hi ? id : hi), ''))
}

switch (cmd) {
  case 'post': post({ to: flag('--to'), subject: flag('--subject'), body: stdin() }); break
  case 'reply': {
    const target = args[1]
    const src = readAll().find((x) => x.id === target || x.id.includes(target))
    if (!src) { console.error(`없는 쪽지: ${target}`); process.exit(1) }
    post({ to: src.from, subject: flag('--subject') ?? `Re: ${src.subject}`, body: stdin(), replyTo: src.id })
    break
  }
  case 'list': list(); break
  case 'read': read(args[1]); break
  case 'seen': seen(); break
  case 'who': who(); break
  default:
    console.log(`에이전트 쪽지함

  ${selfCmd()} post --to <상대> --subject "<제목>" < 본문.md
  ${selfCmd()} list [--to <나>|--mine] [--from <상대>] [--all]
                   [--unread] [--no-mark] [--throttle <초>] [--quiet-if-empty]
  ${selfCmd()} read <아이디>
  ${selfCmd()} seen <아이디> [<아이디>…]   보여준 쪽지만 읽음으로 찍는다
  ${selfCmd()} reply <아이디> < 본문.md
  ${selfCmd()} who          지금 누가 무엇을 잡고 있나

목록을 잘라서 보여주는 쪽은 --no-mark 로 읽기만 하고, 자기가 그린 아이디만
seen 에 넘기세요. 안 그러면 화면에 뜬 적 없는 쪽지가 읽음이 되어 안 보입니다.

AXMAP_AGENT 를 선점과 같은 값으로 두세요.
쪽지는 고아 브랜치 ${BUS_BRANCH} 로 바로 갑니다 — 커밋도 MR 도 필요 없습니다.`)
}
