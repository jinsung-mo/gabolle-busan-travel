#!/usr/bin/env node
/**
 * 머지된 커밋의 Jira 카드를 옮긴다.
 *
 * 사람이 손으로 옮기면 잊는다. 실측 — S15P21E201-525 는 MR !32 로 머지가 끝났는데도
 * "해야 할 일" 에 그대로 있었다. 잊은 보드는 거짓말을 하고, **거짓말하는 보드는
 * 없는 보드보다 나쁘다.** 다들 그것을 보고 남은 일을 가늠하기 때문이다.
 *
 * ── 🔴 어디서 옮기는가가 이 파일의 전부다 ───────────────────────────────────
 *
 * `dev` 머지에서 "완료" 를 찍으면 안 된다. `dev` 는 아직 릴리스가 아니다.
 * 거기서 완료를 찍으면 **보드는 다 됐다고 말하는데 사용자는 아무것도 못 받은**
 * 상태가 된다.
 *
 *   파트 dev · 파트 브랜치에 머지  →  진행 중
 *   최상위 main 에 머지            →  완료
 *
 * 🔴 **뒤로 가지 않는다.** 이미 완료인 카드를 나중의 dev 머지가 "진행 중" 으로
 *    내리면 안 된다. hotfix 하나가 보드 전체를 되감는 일이 실제로 생긴다.
 *    그래서 상태에 순서를 매기고 **앞으로 갈 때만** 옮긴다.
 *
 * 🔴 상태를 **이름이 아니라 갈래(statusCategory)로 판정한다.** 이 Jira 는 한국어라
 *    상태 이름이 "해야 할 일 / 진행 중 / 완료" 지만, 이름은 프로젝트마다 바뀔 수
 *    있고 바뀌면 이 파일이 조용히 아무것도 안 하게 된다. 갈래(new · indeterminate
 *    · done)는 Jira 가 정한 것이라 안 바뀐다.
 *
 * ── 쓰는 법 ─────────────────────────────────────────────────────────────────
 *
 *   node ci/jira-transition.mjs                     # CI 가 이렇게 부른다
 *   node ci/jira-transition.mjs --dry-run           # 무엇을 할지만 보고 안 바꾼다
 *   node ci/jira-transition.mjs --range a..b --branch main
 *
 * 필요한 CI 변수 — Settings → CI/CD → Variables
 *   JIRA_BASE_URL   https://ssafy.atlassian.net
 *   JIRA_EMAIL      토큰을 만든 사람의 계정 메일
 *   JIRA_TOKEN      id.atlassian.com → Security → API tokens (Masked 로 둔다)
 *
 * 🔴 토큰이 없으면 **조용히 건너뛰지 않는다.** 무엇을 하려 했는지 찍고 종료 코드
 *    0 으로 끝낸다. 버전 잡이 같은 자리에서 하는 것과 같은 태도다 —
 *    **안 움직인 것을 아무도 모르는 상태가 제일 나쁘다.**
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf('--' + name)
  return i >= 0 ? args[i + 1] : null
}
const DRY = args.includes('--dry-run')

const BASE = (process.env.JIRA_BASE_URL || '').replace(/\/+$/, '')
const EMAIL = process.env.JIRA_EMAIL || ''
const TOKEN = process.env.JIRA_TOKEN || ''
const PROJECT = process.env.JIRA_PROJECT_KEY || 'S15P21E201'

const BRANCH = flag('branch') || process.env.CI_COMMIT_BRANCH || ''
const RANGE =
  flag('range') ||
  (process.env.CI_COMMIT_BEFORE_SHA && process.env.CI_COMMIT_SHA
    ? `${process.env.CI_COMMIT_BEFORE_SHA}..${process.env.CI_COMMIT_SHA}`
    : '')

/** 갈래에 순서를 매긴다. 앞으로만 간다. */
const RANK = { new: 0, indeterminate: 1, done: 2 }

/**
 * 브랜치 → 이 카드가 가야 할 갈래.
 *
 * 🔴 최상위 `main` 은 **접두사가 없는 것뿐이다.** `back/main` 은 파트 브랜치다.
 *    이 둘을 안 가르면 파트에 머지할 때마다 카드가 완료로 날아간다.
 *    (버전 계산이 같은 자리에서 같은 실수를 막는다 — CONTRIBUTING 2절)
 */
function targetCategory(branch) {
  const name = String(branch || '').trim()
  if (!name) return null
  if (name === 'main' || name === 'master') return 'done'
  const leaf = name.replace(/^.*\//, '')
  if (leaf === 'main' || leaf === 'master' || leaf === 'func' || leaf === 'dev') {
    return 'indeterminate'
  }
  return null // 기능 브랜치에서는 아무것도 안 한다
}

/**
 * 커밋 **제목 한 줄**에서 "이 커밋이 한 일" 의 카드 번호를 뽑는다 — S15P21E201-972.
 *
 * 🔴 <b>본문을 읽지 않는다.</b> 예전에는 `%s%n%b` 로 제목과 본문을 함께 읽고 거기서
 *    키를 전부 긁었다. 그런데 본문에는 <b>내가 한 일이 아닌 키</b>가 자주 들어간다 —
 *    "상위 스토리는 …", "이 자리는 452 의 일이다", "-944 와 같은 패턴" 같은 참조다.
 *    참조와 실제로 그 일을 한 커밋을 구분하지 못해서, 2026-09-15 실측에서 <b>아직
 *    시작도 안 한 티켓</b>이 머지된 것으로 잡혔다. 참조로 걸렸던 키가 14건이었다.
 *
 * 세는 것은 둘뿐이다.
 *   1. 제목 <b>맨 앞</b>의 `[KEY-###]` — 팀 커밋 규칙(CONTRIBUTING 2절)이 그 자리에 적게 한다
 *   2. 머지 커밋의 `Merge branch '…/KEY-###-…'` — 첫 따옴표 안, 즉 <b>들어온 브랜치</b>에서만
 *      찾는다. 뒤의 `into '…'` 는 대상 브랜치라 거기서 찾으면 안 된다
 *
 * @returns 이 제목이 한 일의 카드 번호. 없으면 빈 배열 (커밋 하나는 한 티켓의 일이다)
 */
export function keysFromSubject(subject, project = 'S15P21E201') {
  const line = String(subject || '')

  const head = line.match(new RegExp('^\\[(' + project + '-\\d+)\\]'))
  if (head) return [head[1]]

  const merge = line.match(/^Merge branch '([^']*)'/)
  if (merge) {
    const inBranch = merge[1].match(new RegExp(project + '-\\d+'))
    if (inBranch) return [inBranch[0]]
  }

  return []
}

/** 이번에 들어온 커밋들이 한 일의 카드 번호. 중복은 없앤다. */
function keysInRange(range) {
  const ZERO = '0000000000000000000000000000000000000000'
  if (!range || range.includes(ZERO)) {
    console.log(`구간이 없거나 빈 sha 가 있습니다 (${range || '(없음)'}) — 첫 push 로 보고 건너뜁니다.`)
    return []
  }
  let out = ''
  try {
    // 🔴 %s 만 읽는다. 본문(%b)을 읽으면 남의 티켓 참조까지 딸려 온다 — 위 javadoc 참고.
    out = execFileSync('git', ['log', '--format=%s', range], { encoding: 'utf8' })
  } catch (e) {
    // 🔴 못 읽은 것을 "카드 0개" 로 내지 않는다. 그러면 조용히 아무것도 안 한다.
    console.error(`구간을 읽지 못했습니다 (${range}): ${e.message}`)
    process.exit(1)
  }
  const keys = []
  for (const line of out.split('\n')) keys.push(...keysFromSubject(line, PROJECT))
  return [...new Set(keys)]
}

/**
 * 이 카드를 타입 때문에 건드리면 안 되는가 — S15P21E201-972.
 *
 * 🔴 <b>에픽은 커밋 하나로 끝나는 물건이 아니다.</b> 이 저장소에는 에픽 키로 직접 커밋한
 *    이력이 실제로 있어서(예: `[S15P21E201-41] docs: …`, 41 은 출시 준비 에픽), 그 커밋이
 *    최상위 `main` 에 들어가면 <b>에픽 전체가 완료로 바뀐다.</b>
 *
 * 🔴 <b>타입을 이름으로 판정하지 않는다.</b> 티켓(-972)은 영문 이름(`Epic`)으로 거르라고
 *    적었는데, 그건 <b>JQL 로 검색할 때</b> 이야기다. 이슈를 직접 읽으면
 *    {@code issuetype.name} 이 <b>화면 언어를 따라 한글로</b> 온다 — 2026-09-15 실측에서
 *    이 프로젝트의 에픽은 `"에픽"`, 작업은 `"작업"` 이었다. 영문으로 비교했다면
 *    <b>한 번도 안 걸려서 에픽이 그대로 날아갔을 것</b>이다.
 *
 *    대신 {@code hierarchyLevel} 은 숫자라 언어를 안 탄다 — 에픽 1, 작업 0 (같은 날 실측).
 *    이 파일이 상태를 이름이 아니라 갈래로 판정하는 것과 같은 이유다(머리말).
 *
 * 🔴 모르면 <b>안 옮긴다.</b> 값이 없을 때 "에픽이 아니다" 로 넘기면, 언젠가 Jira 가 이 칸을
 *    안 주는 날 검사가 조용히 사라지고 <b>그 사실을 아무도 모른다.</b> 반대로 막아 두면
 *    건너뛴 수가 로그에 쌓여 사람이 알아챈다.
 */
export function skipByIssueType(issuetype) {
  const level = issuetype?.hierarchyLevel
  if (typeof level !== 'number') return true
  return level >= 1
}

const auth = 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64')

async function jira(path, init = {}) {
  const res = await fetch(`${BASE}/rest/api/3${path}`, {
    ...init,
    headers: {
      Authorization: auth,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`)
  return text ? JSON.parse(text) : null
}

async function main() {
  const want = targetCategory(BRANCH)
  const keys = keysInRange(RANGE)

  console.log('')
  console.log(`브랜치 : ${BRANCH || '(없음)'}`)
  console.log(`구간   : ${RANGE || '(없음)'}`)
  console.log(`카드   : ${keys.length ? keys.join(', ') : '(없음)'}`)
  console.log(`옮길 곳: ${want === 'done' ? '완료' : want === 'indeterminate' ? '진행 중' : '(해당 없음)'}`)
  console.log('')

  if (!want) {
    console.log('이 브랜치는 카드를 옮기지 않습니다 (dev · 파트 브랜치 · main 에서만 돕니다).')
    return
  }
  if (!keys.length) {
    console.log('옮길 카드가 없습니다. 커밋 메시지 맨 앞의 [' + PROJECT + '-###] 로 찾습니다.')
    return
  }

  if (!BASE || !EMAIL || !TOKEN) {
    // 조용히 성공한 척하지 않는다. 무엇을 하려 했는지 남기고 끝낸다.
    console.log('🔴 Jira 설정이 없어 카드를 옮기지 않았습니다. 위 카드는 손으로 옮겨야 합니다.')
    console.log('')
    console.log('   Settings → CI/CD → Variables 에 셋을 넣습니다:')
    console.log('     JIRA_BASE_URL   https://ssafy.atlassian.net')
    console.log('     JIRA_EMAIL      토큰을 만든 사람의 계정 메일')
    console.log('     JIRA_TOKEN      id.atlassian.com → Security → API tokens  (Masked)')
    console.log('')
    return
  }

  let moved = 0
  let skipped = 0
  let failed = 0

  for (const key of keys) {
    try {
      const issue = await jira(`/issue/${key}?fields=status,summary,issuetype`)
      const cat = issue.fields.status.statusCategory.key
      const now = issue.fields.status.name
      const type = issue.fields.issuetype

      if (skipByIssueType(type)) {
        // 🔴 에픽은 커밋 하나로 끝나지 않는다. 건너뛴 사실을 반드시 남긴다 —
        //    조용히 넘어가면 "왜 이 카드만 안 움직였나" 를 나중에 아무도 못 푼다.
        const label = type?.name ? `${type.name}(level ${type.hierarchyLevel})` : '타입을 알 수 없음'
        console.log(`  = ${key}  ${now} — ${label} 이라 건드리지 않습니다`)
        skipped++
        continue
      }

      if (RANK[cat] >= RANK[want]) {
        // 🔴 뒤로 가지 않는다. 이미 완료인 카드를 dev 머지가 되감으면 안 된다.
        console.log(`  = ${key}  ${now} — 이미 여기까지 왔습니다. 그대로 둡니다`)
        skipped++
        continue
      }

      const { transitions } = await jira(`/issue/${key}/transitions`)
      const t = transitions.find((x) => x.to?.statusCategory?.key === want)
      if (!t) {
        console.log(`  ! ${key}  ${now} — 갈 수 있는 전환이 없습니다 (워크플로 확인 필요)`)
        failed++
        continue
      }

      if (DRY) {
        console.log(`  ~ ${key}  ${now} → ${t.to.name}  (--dry-run 이라 안 바꿉니다)`)
        moved++
        continue
      }

      await jira(`/issue/${key}/transitions`, {
        method: 'POST',
        body: JSON.stringify({ transition: { id: t.id } }),
      })
      console.log(`  → ${key}  ${now} → ${t.to.name}`)
      moved++
    } catch (e) {
      console.log(`  x ${key}  옮기지 못했습니다: ${e.message}`)
      failed++
    }
  }

  console.log('')
  console.log(`옮김 ${moved} · 그대로 ${skipped} · 실패 ${failed}`)

  // 🔴 실패해도 이 잡은 팀의 머지를 막지 않는다 (.gitlab-ci.yml 의 allow_failure).
  //    Jira 가 죽은 날 팀이 멈출 이유가 없다. 이것은 게이트가 아니라 기록이다.
  //    다만 종료 코드로는 실패를 낸다 — 노란 표시가 떠야 사람이 알아챈다.
  if (failed) process.exit(1)
}

// 🔴 직접 실행할 때만 돈다 — S15P21E201-972.
//    위 두 함수를 검사에서 부르려고 export 했는데, .mjs 는 import 하는 것만으로 모듈
//    본체가 실행된다. 막지 않으면 **검사를 돌릴 때마다 진짜 Jira 카드가 움직인다.**
const invokedDirectly =
  process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])

if (invokedDirectly) {
  main().catch((e) => {
    console.error('치명:', e.message)
    process.exit(1)
  })
}
