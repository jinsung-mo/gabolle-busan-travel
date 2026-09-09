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

/** 이번에 들어온 커밋 메시지에서 카드 번호를 뽑는다. 중복은 없앤다. */
function keysInRange(range) {
  const ZERO = '0000000000000000000000000000000000000000'
  if (!range || range.includes(ZERO)) {
    console.log(`구간이 없거나 빈 sha 가 있습니다 (${range || '(없음)'}) — 첫 push 로 보고 건너뜁니다.`)
    return []
  }
  let out = ''
  try {
    out = execFileSync('git', ['log', '--format=%s%n%b', range], { encoding: 'utf8' })
  } catch (e) {
    // 🔴 못 읽은 것을 "카드 0개" 로 내지 않는다. 그러면 조용히 아무것도 안 한다.
    console.error(`구간을 읽지 못했습니다 (${range}): ${e.message}`)
    process.exit(1)
  }
  const re = new RegExp(PROJECT + '-(\\d+)', 'g')
  return [...new Set((out.match(re) || []))]
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
      const issue = await jira(`/issue/${key}?fields=status,summary`)
      const cat = issue.fields.status.statusCategory.key
      const now = issue.fields.status.name

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

main().catch((e) => {
  console.error('치명:', e.message)
  process.exit(1)
})
