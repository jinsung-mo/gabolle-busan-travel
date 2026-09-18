#!/usr/bin/env node
/**
 * 커밋 맨 앞 대괄호 키가 **실재하는 카드**이고, 그 카드가 **이 브랜치의 파트**인지 본다.
 *
 * 커밋 맨 앞 `[S15P21E201-1188]` 로 Jira 카드가 자동으로 움직인다
 * ({@link ./jira-transition.mjs}). 번호가 틀리면 **남의 카드가 움직이고**, 머지된
 * 뒤에는 되돌릴 수 없다. 2026-09-17 밤에 그 사고가 **넷** 났고 **넷 다 사람이 눈으로
 * 찾았다.** 기계가 안 보는 자리였다.
 *
 * ── 무엇을 보나 — 둘뿐이다 ──────────────────────────────────────────────────
 *
 *   ① 그 키의 카드가 **있는가**
 *   ② 카드 제목의 **파트 표시**(`[Back]`·`[Front]`·`[Data]` …)가 브랜치의 파트와 맞는가
 *
 * ②만으로 어젯밤 사고 둘이 잡힌다 — 프론트 MR 이 백엔드 카드를 가리킨 것,
 * 백엔드 MR 이 프론트 카드를 가리킨 것.
 *
 * 🔴 **「담당자가 나인가」는 일부러 안 본다.** 남의 카드에 정당하게 커밋하는 경우가
 *    있다(이어받기·대신 고치기). 막으면 사람이 **검사를 피하려고 카드를 옮긴다.**
 *    그게 번호 하나 틀린 것보다 나쁘다.
 *
 * 🔴 **커밋 훅이 아니라 CI 잡이다.** 훅은 인터넷 없이도 돌아야 한다.
 *    **Jira 가 죽은 날 아무도 커밋을 못 하는 것이, 번호 하나 틀린 것보다 나쁘다.**
 *
 * ── 🔴 「못 잡겠다」와 「틀렸다」를 가른다 ───────────────────────────────────
 *
 * 카드 제목의 파트 표시는 실제로 지저분하다. 최근 100건을 세어 보니 `Front`·`Back`·
 * `Data` 말고도 `BE`·`FE`(대괄호 하나짜리)·`Infra`·`Common`·`Docs`·`BigData`·`ML`·
 * `City3D`·`Design` 이 섞여 있다. 어휘를 완전히 적을 방법이 없다.
 *
 * 그래서 **모르는 표시로는 막지 않는다.** 아는 어휘와 **분명히 어긋날 때만** 막는다.
 *
 *   종료 코드 0  맞다
 *   종료 코드 1  **못 잡겠다** — 토큰 없음 · Jira 안 열림 · 모르는 어휘 · 브랜치 모양이 다름
 *   종료 코드 2  **틀렸다** — 카드가 없거나, 파트가 분명히 어긋난다
 *
 * `.gitlab-ci.yml` 이 `allow_failure: exit_codes: [1]` 로 둘을 다르게 다룬다.
 * 1 은 노랑(머지 안 막음), 2 는 빨강(머지 막음).
 *
 * **이 성질 덕에 어휘 목록이 완전하지 않아도 안전하다.** 목록에 없는 표시가 나오면
 * 막는 대신 「못 잡겠다」로 남긴다 — 그래야 사람이 검사를 미워하지 않는다.
 *
 * ── 쓰는 법 ─────────────────────────────────────────────────────────────────
 *
 *   node ci/jira-key-check.mjs                                  # CI 가 이렇게 부른다
 *   node ci/jira-key-check.mjs --branch feat/back/S15P21E201-1188-x --range a..b
 *
 * 필요한 CI 변수 — `jira` 잡과 **같은 것을 쓴다.** 새로 만들 것 없다.
 *   JIRA_BASE_URL   https://ssafy.atlassian.net
 *   JIRA_EMAIL      토큰을 만든 사람의 계정 메일
 *   JIRA_TOKEN      id.atlassian.com → Security → API tokens (Masked 로 둔다)
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const EXIT = { OK: 0, UNKNOWN: 1, MISMATCH: 2 }

/**
 * 카드 제목의 파트 표시 → 브랜치의 파트.
 *
 * 🔴 **여기 없는 표시는 「모른다」이지 「틀렸다」가 아니다.** 늘려도 되지만, 늘리지
 * 않아도 안전하다 — 모르는 것은 노랑으로 끝난다.
 *
 * `Infra`·`Common`·`Docs`·`Design` 은 **일부러 안 넣었다.** 그 카드들은 어느 파트
 * 브랜치에서 작업해도 이상하지 않다. 넣으면 정당한 작업이 빨개진다.
 */
export const PART_BY_TITLE_TAG = {
  FRONT: 'front',
  FE: 'front',
  BACK: 'back',
  BE: 'back',
  DATA: 'bigdata',
  BIGDATA: 'bigdata',
}

/** 브랜치 이름의 파트 칸이 가리키는 것. 대소문자를 가리지 않는다. */
export const BRANCH_PART_ALIASES = {
  front: 'front',
  back: 'back',
  bigdata: 'bigdata',
}

/**
 * 커밋 제목 맨 앞의 대괄호 키.
 *
 * 🔴 **맨 앞만 본다.** 본문이나 중간의 참조까지 긁으면 남의 카드를 건드린다 —
 * `jira-transition` 이 실제로 그 결함을 겪었다(S15P21E201-972).
 */
export function keyFromSubject(subject, project = 'S15P21E201') {
  const m = /^\[(.+?)\]/.exec((subject || '').trim())
  if (!m) return null
  const key = m[1].trim()
  return new RegExp(`^${project}-\\d+$`).test(key) ? key : null
}

/**
 * 브랜치 이름에서 파트를 뽑는다 — `<접두사>/<파트>/<키>-<슬러그>` 의 가운데 칸.
 *
 * 🔴 파트 브랜치(`back/dev`)나 모양이 다른 이름은 {@code null} 이다. **검사할 파트가
 * 없는 것이지 틀린 것이 아니다.**
 */
export function partFromBranch(branch) {
  const parts = (branch || '').split('/')
  if (parts.length < 3) return null
  return BRANCH_PART_ALIASES[parts[1].toLowerCase()] ?? null
}

/**
 * 카드 제목 맨 앞의 대괄호들에서 파트 표시를 찾는다.
 *
 * `[Fix][Back] …` 는 둘째가, `[FE] …` 는 하나뿐인 것이 파트다. 그래서 **아는 어휘에
 * 걸리는 첫 번째**를 고른다 — 자리(첫째냐 둘째냐)로 고르면 `[FE]` 를 놓친다.
 *
 * @returns {{part: string|null, tags: string[]}} 아는 어휘가 없으면 {@code part} 는 null
 */
export function partFromTitle(title) {
  const tags = []
  let rest = (title || '').trim()
  let m
  while ((m = /^\[([^\]]{1,20})\]\s*/.exec(rest))) {
    tags.push(m[1].trim())
    rest = rest.slice(m[0].length)
  }
  for (const tag of tags) {
    const part = PART_BY_TITLE_TAG[tag.toUpperCase()]
    if (part) return { part, tags }
  }
  return { part: null, tags }
}

/**
 * 카드 하나에 대한 판정. **바깥을 안 부르는 순수 함수라 검사가 쉽다.**
 *
 * @param key 커밋이 가리킨 카드
 * @param title 그 카드의 제목. 카드가 없으면 {@code null}
 * @param branchPart {@link partFromBranch} 의 결과
 * @returns {{verdict: 'ok'|'unknown'|'mismatch', message: string}}
 */
export function judge(key, title, branchPart) {
  if (title === null || title === undefined) {
    return {
      verdict: 'mismatch',
      message: `${key} 카드가 Jira 에 없습니다. 번호를 잘못 적었거나 카드가 지워졌습니다.\n`
        + '    이 번호로 머지하면 아무 카드도 안 움직이거나, 나중에 그 번호로 만들어진\n'
        + '    남의 카드가 움직입니다. 커밋 제목의 번호를 고치십시오.',
    }
  }
  const { part, tags } = partFromTitle(title)
  if (!branchPart) {
    return { verdict: 'unknown', message: `${key} — 브랜치에서 파트를 못 읽어 대조를 건너뜁니다.` }
  }
  if (!part) {
    return {
      verdict: 'unknown',
      message: `${key} 「${title}」 — 제목의 파트 표시${tags.length ? `(${tags.join('·')})` : '가 없어'}로는 `
        + '어느 파트인지 못 정합니다. 대조를 건너뜁니다.',
    }
  }
  if (part !== branchPart) {
    return {
      verdict: 'mismatch',
      message: `${key} 는 「${title}」 카드인데 제목이 [${tags.join('][')}] 입니다.\n`
        + `    이 브랜치의 파트는 '${branchPart}' 이고 카드는 '${part}' 입니다.\n`
        + '    🔴 번호가 맞습니까? 맞다면 카드 제목의 파트 표시를 고치고, 아니면 커밋 제목의 번호를 고치십시오.\n'
        + '    (남의 카드를 가리킨 채 머지하면 그 카드가 자동으로 움직이고 되돌릴 수 없습니다.)',
    }
  }
  return { verdict: 'ok', message: `${key} 「${title}」 — ${branchPart} 로 맞습니다.` }
}

/** 여러 카드의 판정을 합친다. 하나라도 틀리면 틀린 것이고, 아니면 모르는 것이 남는다. */
export function summarize(results) {
  if (results.some((r) => r.verdict === 'mismatch')) return EXIT.MISMATCH
  if (results.some((r) => r.verdict === 'unknown')) return EXIT.UNKNOWN
  return EXIT.OK
}

// ── 여기서부터는 바깥을 부른다 ───────────────────────────────────────────────

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf('--' + name)
  return i >= 0 ? args[i + 1] : null
}

const BASE = (process.env.JIRA_BASE_URL || '').replace(/\/+$/, '')
const EMAIL = process.env.JIRA_EMAIL || ''
const TOKEN = process.env.JIRA_TOKEN || ''
const PROJECT = process.env.JIRA_PROJECT_KEY || 'S15P21E201'

/** 검사할 커밋 구간. MR 이면 갈림점부터 지금까지. */
function defaultRange() {
  const base = process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA
  const head = process.env.CI_COMMIT_SHA || 'HEAD'
  if (base) return `${base}..${head}`
  if (process.env.CI_COMMIT_BEFORE_SHA && !/^0+$/.test(process.env.CI_COMMIT_BEFORE_SHA)) {
    return `${process.env.CI_COMMIT_BEFORE_SHA}..${head}`
  }
  return `${head}~1..${head}`
}

function subjectsIn(range) {
  const out = execFileSync('git', ['log', '--no-merges', '--format=%s', range], { encoding: 'utf8' })
  return out.split('\n').map((s) => s.trim()).filter(Boolean)
}

async function fetchTitle(key) {
  const res = await fetch(`${BASE}/rest/api/3/issue/${key}?fields=summary`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64'),
      Accept: 'application/json',
    },
  })
  if (res.status === 404) return { title: null }
  if (!res.ok) throw new Error(`Jira ${res.status} ${res.statusText}`)
  const body = await res.json()
  return { title: body?.fields?.summary ?? null }
}

async function main() {
  const branch = flag('branch') || process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME
    || process.env.CI_COMMIT_BRANCH || ''
  const range = flag('range') || defaultRange()
  const branchPart = partFromBranch(branch)

  console.log(`브랜치 ${branch || '(모름)'} · 파트 ${branchPart || '(못 읽음)'} · 구간 ${range}`)

  if (!BASE || !EMAIL || !TOKEN) {
    // 🔴 조용히 통과시키지 않는다. 안 본 것을 아무도 모르는 상태가 제일 나쁘다.
    console.log('🟡 JIRA_BASE_URL · JIRA_EMAIL · JIRA_TOKEN 이 없어 카드를 못 봅니다. 검사를 건너뜁니다.')
    process.exit(EXIT.UNKNOWN)
  }

  let subjects
  try {
    subjects = subjectsIn(range)
  }
  catch (e) {
    console.log(`🟡 커밋 구간을 못 읽습니다 (${range}). GIT_DEPTH: 0 이 필요할 수 있습니다. ${e.message}`)
    process.exit(EXIT.UNKNOWN)
  }

  const keys = [...new Set(subjects.map((s) => keyFromSubject(s, PROJECT)).filter(Boolean))]
  const withoutKey = subjects.filter((s) => !keyFromSubject(s, PROJECT))
  if (withoutKey.length) {
    console.log(`🟡 맨 앞에 [${PROJECT}-번호] 가 없는 커밋 ${withoutKey.length}개 — 이 잡은 그 커밋을 못 봅니다.`)
    for (const s of withoutKey.slice(0, 5)) console.log(`    ${s}`)
  }
  if (!keys.length) {
    console.log('🟡 검사할 카드 번호가 없습니다.')
    process.exit(EXIT.UNKNOWN)
  }

  const results = []
  for (const key of keys) {
    let title
    try {
      ({ title } = await fetchTitle(key))
    }
    catch (e) {
      // 🔴 Jira 가 안 열리는 것은 번호가 틀린 것과 다르다. 막지 않는다.
      console.log(`🟡 ${key} — Jira 를 못 불렀습니다: ${e.message}`)
      results.push({ verdict: 'unknown', message: '' })
      continue
    }
    const r = judge(key, title, branchPart)
    console.log(`${{ ok: '🟢', unknown: '🟡', mismatch: '🔴' }[r.verdict]} ${r.message}`)
    results.push(r)
  }

  const code = summarize(results)
  if (code === EXIT.MISMATCH) console.log('\n🔴 번호가 가리키는 카드가 이 브랜치와 안 맞습니다. 위 안내를 보십시오.')
  else if (code === EXIT.UNKNOWN) console.log('\n🟡 일부를 못 봤습니다. 머지는 막지 않습니다.')
  else console.log('\n🟢 커밋의 카드 번호가 전부 이 브랜치의 파트와 맞습니다.')
  process.exit(code)
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  main().catch((e) => {
    console.error('🟡 검사를 마치지 못했습니다:', e?.stack || e)
    process.exit(EXIT.UNKNOWN)
  })
}
