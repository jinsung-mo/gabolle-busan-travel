#!/usr/bin/env node
/**
 * 정족수가 찬 MR 의 파이프라인을 다시 만든다.
 *
 * ── 왜 필요한가 (2026-09-01 에 실제로 막혔다) ────────────────────────────────
 *
 * MR !31 은 표 2장을 다 받아 게이트가 2/2 로 통과하는데도 머지가 안 됐다.
 * 원인은 **시간**이다 — 파이프라인은 09:43 에 돌았고 표는 14:07·14:32 에 들어왔다.
 * 표는 MR 밖(`axmap/votes` 브랜치)으로 오므로 GitLab 이 파이프라인을 다시 돌리지
 * 않고, 화면에는 **"0표" 로 판정한 다섯 시간 전 결과**가 빨갛게 남는다.
 *
 * 🔴 그리고 이 상황에서 제일 자연스러운 행동이 제일 비싼 실수다 — 파이프라인을
 *    다시 돌리려고 빈 커밋을 밀어 넣으면 **표가 전부 무효가 된다**(G3 — 표는 커밋
 *    하나에 묶여 있다). 두 사람에게 처음부터 다시 부탁해야 한다.
 *
 * ── 🔴 왜 "표 push 트리거" 가 아니라 스케줄인가 ─────────────────────────────
 *
 * `axmap/votes` 는 고아 브랜치라 `votes/` 아래 파일 몇 개뿐이고 `.gitlab-ci.yml`
 * 이 없다. GitLab 은 **push 된 브랜치에서 CI 설정을 읽으므로** 파이프라인이 아예
 * 안 만들어진다. 실측했다.
 *
 * 그 브랜치에 `.gitlab-ci.yml` 을 심으면 되기는 한다. **하지 않는다** — 표 브랜치는
 * MR 없이 push 되는 곳이다. 거기에 CI 설정을 두면 **누구든 리뷰 없이 CI 가 돌릴
 * 코드를 바꿀 수 있다.** 팀 규칙 3절("지켜야 할 것은 잡으로 만들고, 잡을 바꾸려면
 * MR 을 지나야 한다")과 정면으로 충돌한다. 즉시성 몇 분을 그것과 바꾸지 않는다.
 *
 * 대가는 지연 하나뿐이다. 스케줄 간격만큼 늦게 풀린다.
 *
 * ── 쓰는 법 ─────────────────────────────────────────────────────────────────
 *
 *   Settings → CI/CD → Schedules
 *     5분마다 (cron 다섯 칸: 슬래시5 · 별 · 별 · 별 · 별)  SCHEDULE_KIND = vote-recheck
 *
 *   node ci/vote-recheck.mjs            # 스케줄이 이렇게 부른다
 *   node ci/vote-recheck.mjs --dry-run  # 무엇을 할지만 보고 안 만든다
 *
 * 🔴 토큰이 없으면 조용히 건너뛰지 않는다. 무엇을 하려 했는지 찍고 종료 코드 0.
 */

import { spawnSync } from 'node:child_process'

const DRY = process.argv.includes('--dry-run')

const API = process.env.CI_API_V4_URL || 'https://lab.ssafy.com/api/v4'
const PROJECT = process.env.CI_PROJECT_ID || ''
const TOKEN = process.env.AXMAP_BOT_TOKEN || ''
const AXVER = process.env.AXMAP_VERSION || 'latest'

/** 정족수를 요구하는 자리. dev 로 가는 MR 에는 표를 안 건다 (governance 잡과 같다). */
const NEEDS_QUORUM = /(^|\/)(main|func)$/

/**
 * 🔴 브랜치 이름을 셸에 넘기기 전에 좁힌다.
 *
 * 이름은 GitLab API 가 준 것이고, 우리가 만든 값이 아니다. Windows 에서는 npx 를
 * 셸로 띄워야 해서 인자가 셸을 지나간다 — 거기에 이상한 글자가 있으면 명령이 된다.
 * git 이 실제로 허용하는 글자보다 좁지만, 이 저장소의 규칙(접두사/Jira키-이름)은
 * 전부 이 안에 든다.
 */
const SAFE_BRANCH = /^[A-Za-z0-9._\/-]+$/

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'PRIVATE-TOKEN': TOKEN, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`)
  return text ? JSON.parse(text) : null
}

const git = (args) => spawnSync('git', args, { encoding: 'utf8' })

/** 게이트를 돌려 종료 코드만 본다. 0 충족 · 2 미달 · 1 판정 불가 · 4 정책 깨짐. */
function gate(source, target) {
  const r = spawnSync(
    'npx',
    ['-y', `axmap-cli@${AXVER}`, 'gate', '--source', source, '--target', `origin/${target}`],
    { encoding: 'utf8', shell: process.platform === 'win32' },
  )
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }
}

async function main() {
  console.log('')
  if (!TOKEN || !PROJECT) {
    console.log('🔴 AXMAP_BOT_TOKEN 또는 CI_PROJECT_ID 가 없어 아무것도 안 했습니다.')
    console.log('')
    console.log('   이 잡은 정족수가 찬 MR 의 파이프라인을 다시 만듭니다.')
    console.log('   없으면 표를 다 받고도 사람이 MR 에서 Retry 를 눌러야 합니다.')
    console.log('')
    console.log('   🔴 토큰을 이미 넣었는데 이 줄이 보인다면 **Protected 여부**를 보십시오.')
    console.log('      Protected 로 두면 보호된 브랜치에서 도는 잡에만 값이 갑니다.')
    console.log('      이 스케줄이 도는 브랜치가 보호 브랜치가 아니면 값이 빈 채로 옵니다.')
    console.log('')
    return
  }

  // 게이트는 소스·타깃·표 세 갈래를 다 봐야 한다. CI 의 얕은 클론에는 없다.
  const fetched = git(['fetch', '--quiet', 'origin', '+refs/heads/*:refs/remotes/origin/*'])
  if (fetched.status !== 0) {
    console.error('브랜치를 받아오지 못했습니다:', fetched.stderr?.slice(0, 200))
    process.exit(1)
  }

  const mrs = await api(`/projects/${PROJECT}/merge_requests?state=opened&per_page=100`)
  console.log(`열린 MR ${mrs.length}건`)
  console.log('')

  let made = 0
  let skipped = 0

  for (const mr of mrs) {
    const tag = `!${mr.iid}  ${mr.source_branch} → ${mr.target_branch}`

    if (!NEEDS_QUORUM.test(mr.target_branch)) {
      continue // dev 로 가는 MR 은 표를 안 건다. 볼 이유가 없다
    }
    if (!SAFE_BRANCH.test(mr.source_branch) || !SAFE_BRANCH.test(mr.target_branch)) {
      console.log(`  ! ${tag} — 브랜치 이름에 예상 못 한 글자가 있어 건너뜁니다`)
      skipped++
      continue
    }

    const status = mr.head_pipeline?.status ?? '(없음)'
    if (status === 'success' || status === 'running' || status === 'pending' || status === 'created') {
      // 초록이면 막고 있는 것이 표가 아니고, 도는 중이면 지금 판정하고 있다.
      console.log(`  = ${tag} — 파이프라인 ${status}. 그대로 둡니다`)
      skipped++
      continue
    }

    const g = gate(mr.source_branch, mr.target_branch)
    if (g.code !== 0) {
      const why = g.code === 2 ? '표가 아직 모자랍니다' : `게이트 종료 코드 ${g.code}`
      console.log(`  = ${tag} — ${why}`)
      skipped++
      continue
    }

    if (DRY) {
      console.log(`  ~ ${tag} — 정족수 충족. 파이프라인을 만들 차례입니다 (--dry-run)`)
      made++
      continue
    }

    try {
      const p = await api(`/projects/${PROJECT}/merge_requests/${mr.iid}/pipelines`, { method: 'POST' })
      console.log(`  → ${tag} — 정족수 충족. 파이프라인 #${p.id} 를 새로 만들었습니다`)
      made++
    } catch (e) {
      console.log(`  x ${tag} — 파이프라인을 만들지 못했습니다: ${e.message}`)
      skipped++
    }
  }

  console.log('')
  console.log(`새로 만든 파이프라인 ${made} · 그대로 둔 것 ${skipped}`)
  console.log('')
  console.log('표는 커밋 하나에 묶여 있습니다. 여기서 커밋을 더 올리면 앞의 표가 무효가 됩니다.')
}

main().catch((e) => {
  console.error('치명:', e.message)
  process.exit(1)
})
