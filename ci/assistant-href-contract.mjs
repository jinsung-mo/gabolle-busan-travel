#!/usr/bin/env node
/**
 * 챗봇이 내주는 이동 주소를 **앱이 전부 알고 있는지** 대조한다.
 *
 * ── 🔴 왜 이 검사가 있는가 ──────────────────────────────────────────────────
 *
 * 2026-09-18 운영에서 비서(챗봇)의 **이동 버튼 다섯 중 셋이 사라져 있었다**
 * (S15P21E201-1273). 서버는 「오늘의 환율」 버튼을 제대로 내주는데, 앱이 그 주소를
 * 모르는 주소로 보고 버튼을 지웠다. 사용자에게는 **없는 기능**으로 보였다.
 *
 * 원인은 목록이 두 곳에 있고 한쪽만 자랐다는 것이다. 그리고 **검사가 그것을 못 잡았다** —
 * 그때의 검사는 손으로 베낀 배열을 **자기 자신과** 비교하고 있어서, 두 목록이 갈라진
 * 뒤에도 계속 초록이었다.
 *
 * 그 검사는 고쳐졌지만(앱의 실제 상수를 보도록), **비교 대상인 서버 목록은 여전히 손으로
 * 베낀 스냅샷이다.** 그래서 백엔드가 여섯 번째 목적지를 추가하면 그 검사는 초록인 채로
 * 앱은 그 버튼을 또 지운다. 한 단계 멀어졌을 뿐 같은 실패가 남아 있다.
 *
 * 이 잡은 **양쪽 원본 파일을 직접 읽어** 대조한다. 베낀 값이 없다.
 *
 * ── 규칙은 한 방향이다 ──────────────────────────────────────────────────────
 *
 *   **서버가 내줄 수 있는 주소는 앱이 전부 알아야 한다.**
 *
 * 앱이 더 갖고 있는 것은 통과시킨다. 앱이 서버가 안 보내는 주소를 받아들이는 것은
 * 무해하고, 오히려 **옮겨 가는 중에 안 깨지게 하는 장치**다 — 실제로 `/plan/basic` →
 * `/plan` 으로 옮길 때 앱이 둘 다 받아서 머지 순서가 상관없었다(!1207).
 *
 * 그래서 이 검사가 빨개지면 고치는 순서도 정해진다: **앱을 먼저 넓히고, 서버를 나중에
 * 옮긴다.** 앱이 모르는 주소를 서버가 먼저 보내기 시작하는 창을 아예 만들지 않는다.
 *
 * ── 쓰는 법 ─────────────────────────────────────────────────────────────────
 *
 *   node ci/assistant-href-contract.mjs                    # CI 가 이렇게 부른다
 *   node ci/assistant-href-contract.mjs --app-ref origin/front/dev
 *   node ci/assistant-href-contract.mjs --server-ref origin/back/dev --app-ref origin/front/dev
 *
 * 🔴 **앱 코드와 서버 코드는 같은 브랜치에 없다.** `back/dev` 의 `frontend/` 는 README
 *    한 장짜리 자리표시자이고, `front/dev` 의 `backend/` 는 2026-09-09 이후로 멈춰 있어
 *    assistant 패키지가 아예 없다. 그래서 **한쪽은 반드시 다른 브랜치에서 받아 와야 한다.**
 *    ref 를 안 주면 working tree 에 파일이 있는 쪽은 그것을 쓰고(= 이 MR 이 바꾼 값),
 *    없는 쪽만 기본 ref 에서 읽는다.
 *
 * 🔴 **그 전제가 참이 아닌 브랜치가 있다 (S15P21E201-1492).** `<파트>/main` 은 `main` 에서
 *    갈라져 나와 남의 파트 폴더까지 진짜로 들고 있다 — 다만 낡았다. 거기서는 working tree 가
 *    「이 MR 이 바꾼 값」이 아니라 **아무도 안 건드린 낡은 거울**이다. 그런 자리에서는
 *    `--app-ref` / `--server-ref` 를 명시해서 그 거울을 건너뛰어야 한다. 명시한 ref 는
 *    working tree 를 이긴다.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const EXIT = { OK: 0, UNKNOWN: 1, MISMATCH: 2 }

const SERVER_FILE = 'backend/src/main/java/com/gabolle/backend/assistant/adapter/GeminiAssistantAdapter.java'
const APP_FILE = 'frontend/src/assistant/assistantApi.ts'

const DEFAULT_SERVER_REF = 'origin/back/dev'
const DEFAULT_APP_REF = 'origin/front/dev'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf('--' + name)
  return i >= 0 ? args[i + 1] : null
}

/**
 * 백엔드의 `ALLOWED_HREFS` 를 뽑는다.
 *
 * 🔴 `Set.of(` 뒤의 닫는 괄호까지를 한 덩어리로 잡는다. 이 선언은 **여러 줄에 걸쳐 있다** —
 *    줄 단위로 읽으면 둘째 줄의 주소를 놓치고, 놓친 것을 "앱에만 있는 여분" 으로 잘못
 *    보고한다. 줄바꿈까지 먹는 `[\s\S]` 를 쓰는 이유다.
 */
export function serverHrefs(source) {
  const m = source.match(/ALLOWED_HREFS\s*=\s*Set\.of\(([\s\S]*?)\)\s*;/)
  if (!m) return null
  return quoted(m[1])
}

/**
 * 앱의 `ALLOWED_NAVIGATE_HREFS` 를 뽑는다.
 *
 * 🔴 타입 표시(`: readonly AssistantNavigatePath[]`)가 붙어 있어도 읽어야 한다. 그리고
 *    **배열 여는 괄호부터 닫는 괄호까지**만 본다 — 파일 뒤쪽에 같은 이름이 다시 나오는
 *    자리(`isAllowedNavigateHref` 안의 참조)까지 긁으면 주소가 아닌 것이 섞인다.
 */
export function appHrefs(source) {
  const m = source.match(/ALLOWED_NAVIGATE_HREFS[^=]*=\s*\[([\s\S]*?)\]/)
  if (!m) return null
  return quoted(m[1])
}

/** 따옴표 안의 주소만 모은다. 주석에 적힌 예시는 `/` 로 시작하는 것만 받아서 걸러진다. */
function quoted(block) {
  const out = []
  for (const m of block.matchAll(/['"]([^'"]+)['"]/g)) {
    if (m[1].startsWith('/')) out.push(m[1])
  }
  return [...new Set(out)]
}

/**
 * 파일 하나를 읽는다. 기본은 working tree 가 있으면 그것을, 없으면 ref 에서 받아 온다.
 *
 * 🔴 **`preferRef` 면 준 ref 가 working tree 를 이긴다 — S15P21E201-1492.**
 *    전에는 파일이 있기만 하면 무조건 working tree 였고, 그래서 `--app-ref` 가
 *    <b>정작 필요한 상황에서만</b> 무력해졌다. 필요한 상황이란 그 자리에 **낡은 거울**이
 *    놓여 있는 브랜치다.
 *
 *    `back/dev` 의 `frontend/` 는 README 한 장이라 없는 것과 같지만, **`back/main` 은
 *    `main` 에서 갈라져 나와 진짜 `frontend/` 트리를 통째로 들고 있다** — 몇 주 낡은 채로.
 *    그 사본은 그 브랜치가 건드린 적도 없고 머지해도 남지 않는데, 검사는 그것을 앱의
 *    현재 모습으로 읽고 **있지도 않은 계약 위반을 보고했다.** 승격 MR !1332 가 그래서
 *    막혔다. 잡이 `git fetch origin front/dev` 를 해 두고도 그 값을 못 쓰고 있었다.
 *
 * 🔴 `git show <ref>:<경로>` 가 실패하는 것을 **조용히 빈 문자열로 넘기지 않는다.**
 *    빈 문자열은 "주소가 하나도 없다" 로 읽혀서 **모든 대조를 통과시킨다** — 검사가
 *    꺼진 것을 아무도 모르는 상태가 제일 나쁘다. `preferRef` 로 준 ref 를 못 읽을 때도
 *    working tree 로 슬쩍 물러나지 않는다. 물러나면 고친 그 함정으로 되돌아간다.
 */
export function readSource(path, ref, { preferRef = false, fs = { existsSync, readFileSync }, git = gitShow } = {}) {
  if (!preferRef && fs.existsSync(path)) {
    return { source: fs.readFileSync(path, 'utf8'), from: `working tree (${path})` }
  }
  const source = git(ref, path)
  if (source === null) return { source: null, from: `${ref}:${path}` }
  return { source, from: `${ref}:${path}` }
}

function gitShow(ref, path) {
  try {
    return execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8' })
  }
  catch {
    return null
  }
}

/**
 * 대조한다. 서버 주소가 앱 목록에 다 있으면 통과.
 *
 * @returns {{verdict: 'ok'|'mismatch', missing: string[], extra: string[]}}
 */
export function compare(server, app) {
  const missing = server.filter((href) => !app.includes(href))
  const extra = app.filter((href) => !server.includes(href))
  return { verdict: missing.length ? 'mismatch' : 'ok', missing, extra }
}

function main() {
  // 🔴 「준 것」과 「기본값」을 가른다. 손으로 준 ref 만 working tree 를 이긴다 —
  //    기본값까지 이기게 하면 이 MR 이 «실제로 바꾼» 값을 안 보게 된다.
  const givenServerRef = flag('server-ref')
  const givenAppRef = flag('app-ref')
  const serverRef = givenServerRef || DEFAULT_SERVER_REF
  const appRef = givenAppRef || DEFAULT_APP_REF

  const server = readSource(SERVER_FILE, serverRef, { preferRef: Boolean(givenServerRef) })
  const app = readSource(APP_FILE, appRef, { preferRef: Boolean(givenAppRef) })

  for (const [label, read] of [['서버', server], ['앱', app]]) {
    if (read.source === null) {
      console.log(`🟡 ${label} 쪽 파일을 못 읽었습니다 — ${read.from}`)
      console.log('   CI 라면 그 브랜치를 이름 붙여 받아왔는지 확인하십시오:')
      console.log(`   git fetch origin "+refs/heads/<브랜치>:refs/remotes/origin/<브랜치>"`)
      process.exit(EXIT.UNKNOWN)
    }
  }

  const serverList = serverHrefs(server.source)
  const appList = appHrefs(app.source)

  if (!serverList || !serverList.length) {
    console.log(`🟡 서버의 ALLOWED_HREFS 를 못 찾았습니다 — ${server.from}`)
    console.log('   선언 모양이 바뀌었다면 이 스크립트의 serverHrefs() 를 함께 고치십시오.')
    process.exit(EXIT.UNKNOWN)
  }
  if (!appList || !appList.length) {
    console.log(`🟡 앱의 ALLOWED_NAVIGATE_HREFS 를 못 찾았습니다 — ${app.from}`)
    console.log('   선언 모양이 바뀌었다면 이 스크립트의 appHrefs() 를 함께 고치십시오.')
    process.exit(EXIT.UNKNOWN)
  }

  console.log(`서버(${server.from}) ${serverList.length}개: ${serverList.join(' ')}`)
  console.log(`앱  (${app.from}) ${appList.length}개: ${appList.join(' ')}`)
  console.log()

  const { verdict, missing, extra } = compare(serverList, appList)

  if (extra.length) {
    console.log(`🟢 앱에만 있는 주소 ${extra.length}개: ${extra.join(' ')}`)
    console.log('   막지 않습니다 — 서버가 안 보내는 주소를 앱이 받아들이는 것은 무해하고,')
    console.log('   주소를 옮기는 동안 이미 깔린 앱이 안 깨지게 하는 장치입니다.')
    console.log()
  }

  if (verdict === 'mismatch') {
    console.log(`🔴 서버가 내주는데 앱이 모르는 주소 ${missing.length}개: ${missing.join(' ')}`)
    console.log()
    console.log('   이대로 배포되면 비서가 그 주소로 가는 버튼을 내줘도 **앱이 버튼을 지웁니다.**')
    console.log('   사용자에게는 답변 글만 남아 「없는 기능」으로 보입니다 (S15P21E201-1273 과 같은 사고).')
    console.log()
    console.log('   고치는 순서 — 앱을 먼저 넓히고 서버를 나중에 옮깁니다:')
    console.log(`     1. ${APP_FILE} 의 ALLOWED_NAVIGATE_HREFS 에 위 주소를 넣는다`)
    console.log('     2. 그 주소의 화면이 앱에 실제로 있는지 확인한다 (frontend/app/... 라우트)')
    console.log('     3. 그 MR 이 front/dev 에 머지된 뒤에 이 서버 변경을 머지한다')
    process.exit(EXIT.MISMATCH)
  }

  console.log('🟢 서버가 내주는 주소를 앱이 전부 알고 있습니다.')
  process.exit(EXIT.OK)
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  main()
}
