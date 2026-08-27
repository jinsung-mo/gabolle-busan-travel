/**
 * axMap 프로토콜의 순수 로직.
 *
 * 이 파일에는 git도, 파일시스템도, 시계도 없다. 입력 -> 출력만 있다.
 * 겹침 판정은 이 시스템의 유일한 진실이므로 레포를 만들지 않고도 검증할 수 있어야 한다.
 * 부수효과(git, fs)는 전부 bin/axmap.mjs 에 있다.
 */

/** 경로를 비교 가능한 형태로 정규화한다. POSIX 구분자, 앞의 ./ 와 뒤의 / 제거. */
export function normalizePath(p) {
  return String(p)
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '')
}

/**
 * 두 경로가 겹치는가.
 *
 * 같은 경로거나, 한쪽이 다른 쪽의 조상 디렉터리이면 겹친 것으로 본다.
 *   src/auth        vs src/auth/login.ts  -> 겹침 (디렉터리 claim이 파일을 덮음)
 *   src/auth/login  vs src/auth/logout    -> 안 겹침
 *
 * 문자열 prefix 가 아니라 반드시 '/' 경계로 판정한다.
 * 그렇지 않으면 src/auth 가 src/authz 를 잡아먹는다.
 */
export function pathsOverlap(a, b) {
  const x = normalizePath(a)
  const y = normalizePath(b)
  if (x === y) return true
  return x.startsWith(y + '/') || y.startsWith(x + '/')
}

/** claim 이 만료되는 시각(ms). since + ttlMs. */
export function claimExpiresAt(claim) {
  return Date.parse(claim.since) + Number(claim.ttlMs)
}

export function isExpired(claim, now) {
  return claimExpiresAt(claim) <= now
}

/** 만료되지 않은 claim 만 남긴다. 죽은 에이전트의 유령 락을 자동으로 걷어내는 지점. */
export function activeClaims(claims, now) {
  return claims.filter((c) => !isExpired(c, now))
}

/**
 * 아직 효력이 있는 내 claim 을 찾는다. 만료되었으면 null 이다.
 *
 * 만료를 "레코드가 사라짐"이 아니라 "레코드는 남고 효력만 잃음"으로 정의했으므로,
 * 레코드의 존재를 효력으로 착각하면 안 된다.
 * 만료된 내 claim 의 paths 를 다음 claim 에 합치면, 그 사이 남이 정당하게 가져간
 * 경로가 검사 없이 부활한다. 락이 조용히 두 명에게 발급되는 최악의 실패다.
 */
export function myActiveClaim(claims, me, now) {
  return activeClaims(claims, now).find((c) => c.agent === me) ?? null
}

/**
 * 이 프로토콜의 심장.
 *
 * "내가 요청한 경로들이, 나 아닌 누군가가 지금 붙잡고 있는 경로와 겹치는가?"
 * 라는 질문에 직접 답한다. git 의 줄 단위 diff 가 대신 답해줄 수 없는 질문이다.
 *
 * @returns {{ok: boolean, blocks: Array}} blocks 는 막은 이유의 목록
 */
export function checkOverlap({ requested, claims, me, now }) {
  const want = requested.map(normalizePath)
  const blocks = []

  for (const c of activeClaims(claims, now)) {
    if (c.agent === me) continue // 내 claim 과는 겹쳐도 된다 (추가 claim)
    for (const w of want) {
      for (const held of (c.paths ?? []).map(normalizePath)) {
        if (pathsOverlap(w, held)) {
          blocks.push({
            requested: w,
            held,
            holder: c.agent,
            task: c.task ?? null,
            intent: c.intent ?? null,
            since: c.since,
            expiresAt: claimExpiresAt(c),
          })
        }
      }
    }
  }

  return { ok: blocks.length === 0, blocks }
}

// ---------------------------------------------------------------------------
// 상태 전이
//
// 프로토콜의 모든 판단은 여기 있다. bin/axmap.mjs 는 git 과 파일만 다룬다.
// 이렇게 나눠야 모델 검증기가 "실제로 제품이 쓰는 로직"을 그대로 돌릴 수 있다.
// 검증기가 같은 로직을 다시 구현하면, 검증하는 대상이 제품이 아니라 검증기가 된다.
// ---------------------------------------------------------------------------

function upsert(claims, record) {
  return [...claims.filter((c) => c.agent !== record.agent), record].sort((a, b) =>
    a.agent < b.agent ? -1 : a.agent > b.agent ? 1 : 0,
  )
}

/**
 * claim 취득. 관문 2 의 판정이 여기서 일어난다.
 * @returns {{ok:true, record, claims, hadExpired}|{ok:false, blocks}}
 */
export function applyClaim({ claims, me, requested, now, ttlMs, task = null, intent = null, actor = null }) {
  const want = [...new Set(requested.map(normalizePath))]

  const verdict = checkOverlap({ requested: want, claims, me, now })
  if (!verdict.ok) return { ok: false, blocks: verdict.blocks }

  // 반드시 "효력이 남은" 내 claim 하고만 합친다. 만료된 것과 합치면
  // 그 사이 남이 가져간 경로가 관문 2 를 거치지 않고 부활한다.
  const prev = myActiveClaim(claims, me, now)
  const hadExpired = !prev && claims.some((c) => c.agent === me)

  const record = {
    agent: me,
    task: task ?? prev?.task ?? null,
    intent: intent ?? prev?.intent ?? null,
    // 누가 잡았는지의 '종류'. 화면에서 사람·AI·백그라운드 에이전트를 색으로 나눈다.
    // 프로토콜 판정에는 쓰이지 않는다 — 표시용 정보다.
    actor: actor ?? prev?.actor ?? null,
    since: new Date(now).toISOString(),
    ttlMs,
    paths: [...new Set([...(prev?.paths ?? []).map(normalizePath), ...want])].sort(),
  }
  return { ok: true, record, claims: upsert(claims, record), hadExpired }
}

/**
 * 반납. drop 이 비어 있으면 전부 반납한다.
 * 만료된 레코드도 반납할 수 있다 (단순 정리이므로 관문 2 가 필요 없다).
 */
export function applyRelease({ claims, me, drop }) {
  const mine = claims.find((c) => c.agent === me)
  if (!mine) return { claims, record: null, unheld: [], hadNothing: true }

  const held = mine.paths.map(normalizePath)
  const want = [...new Set(drop.map(normalizePath))]
  const unheld = want.filter((p) => !held.includes(p))
  const remaining = want.length ? held.filter((p) => !want.includes(p)) : []

  if (!remaining.length) {
    return { claims: claims.filter((c) => c.agent !== me), record: null, unheld }
  }
  const record = { ...mine, paths: remaining }
  return { claims: upsert(claims, record), record, unheld }
}

/**
 * TTL 연장.
 * 만료된 claim 은 연장할 수 없다. renew 는 관문 2 를 거치지 않으므로,
 * 만료 이후를 허용하면 그 사이 남이 가져간 경로를 검사 없이 되찾게 된다.
 */
export function applyRenew({ claims, me, now, ttlMs }) {
  const mine = myActiveClaim(claims, me, now)
  if (!mine) return { ok: false, reason: 'expired-or-missing' }
  const record = { ...mine, since: new Date(now).toISOString(), ttlMs }
  return { ok: true, record, claims: upsert(claims, record) }
}

// ---------------------------------------------------------------------------
// 입력 검증
//
// 락 시스템에서 애매한 입력은 조용히 정규화하면 안 된다.
// 정규화는 서로 다른 두 입력을 같은 것으로 만들 수 있고, 그것이 곧 소유권 충돌이다.
// 판단이 서지 않으면 거부한다 (fail-closed).
// ---------------------------------------------------------------------------

/**
 * 에이전트 이름 검증.
 *
 * 이름은 그대로 파일명이 된다. 위험한 문자를 치환해서 통과시키면
 * "agent/a" 와 "agent_a" 가 같은 파일을 가리켜 서로의 claim 을 덮어쓴다.
 * 치환하지 않고 거부한다.
 */
export function agentNameError(name) {
  if (!name) return '에이전트 이름이 비어 있습니다.'
  if (name.length > 64) return `에이전트 이름이 너무 깁니다 (최대 64자): ${name}`

  // 파일 경로를 깨뜨리거나 다른 파일을 가리킬 수 있는 문자만 막는다.
  // 한글·일본어 같은 문자까지 막으면 한국 팀이 자기 이름을 못 쓴다.
  // 치환하지 않고 거부하는 원칙은 그대로다 — 치환이 곧 이름 충돌이기 때문이다.
  const bad = /[\\/:*?"<>|\u0000-\u001f]/.exec(name)
  if (bad) return `에이전트 이름에 쓸 수 없는 문자가 있습니다: ${JSON.stringify(bad[0])} (${name})`
  if (/^[.\s]|[.\s]$/.test(name)) return `에이전트 이름은 점이나 공백으로 시작·끝날 수 없습니다: ${name}`
  if (name === '.' || name === '..') return `에이전트 이름으로 쓸 수 없습니다: ${name}`
  return null
}

/** claim 경로 검증. 저장소 루트 기준 상대 경로만 허용한다. */
export function claimPathError(p) {
  const raw = String(p ?? '').trim()
  if (!raw) return '빈 경로는 claim 할 수 없습니다.'
  const n = normalizePath(raw)
  if (!n || n === '.') return `저장소 전체를 claim 할 수 없습니다: ${raw}`
  if (raw.startsWith('/') || /^[A-Za-z]:/.test(raw)) {
    return `절대 경로는 claim 할 수 없습니다: ${raw}\n저장소 루트 기준 상대 경로를 쓰세요.`
  }
  if (n.split('/').includes('..')) {
    return `저장소 밖을 가리키는 경로는 claim 할 수 없습니다: ${raw}`
  }
  return null
}

/** 어떤 파일이 내가 claim 한 경로들에 덮이는가. pre-commit 검사용. */
export function coversPath(claimPaths, file) {
  const f = normalizePath(file)
  return claimPaths.some((p) => {
    const c = normalizePath(p)
    return f === c || f.startsWith(c + '/')
  })
}

/** ms 를 "22분", "1시간 5분" 같은 사람이 읽는 문자열로. */
export function humanDuration(ms) {
  if (ms <= 0) return '만료됨'
  const totalMin = Math.round(ms / 60000)
  if (totalMin < 1) return `${Math.round(ms / 1000)}초`
  if (totalMin < 60) return `${totalMin}분`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m ? `${h}시간 ${m}분` : `${h}시간`
}

/**
 * 거부 사유를 사람과 AI 가 함께 읽을 수 있는 형태로 만든다.
 *
 * conflict marker 와의 결정적 차이가 여기다. marker 는 "두 버전이 있다"까지만
 * 말하고 무엇을 해야 하는지는 말하지 않는다. 여기서는 누가, 무엇을, 언제까지
 * 잡고 있는지를 말하므로 AI 가 스스로 다른 작업으로 방향을 틀 수 있다.
 */
export function formatBlocks(blocks, now) {
  const lines = ['claim 거부 - 다른 에이전트가 점유 중인 경로가 있습니다.', '']
  for (const b of blocks) {
    const remain = humanDuration(b.expiresAt - now)
    lines.push(`  x ${b.requested}`)
    if (b.held !== b.requested) lines.push(`      (${b.holder} 가 잡은 ${b.held} 에 포함됨)`)
    lines.push(`      점유자 : ${b.holder}${b.task ? ` (${b.task})` : ''}`)
    if (b.intent) lines.push(`      작업   : ${b.intent}`)
    lines.push(`      시작   : ${b.since}`)
    lines.push(`      TTL    : ${remain} 남음`)
    lines.push('')
  }
  lines.push('다음 중 하나를 하세요:')
  lines.push('  - 겹치지 않는 다른 경로로 작업을 시작한다')
  lines.push('  - axmap status 로 비어 있는 영역을 확인한다')
  lines.push('  - 점유자의 TTL 만료를 기다린다')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// 병합 합의 — 게이트는 거부권, 표는 판단 (SPEC 7-3)
//
// 작업 노드가 사라져도 저장소가 스스로 굴러가려면 "이 변경을 넣어도 되는가" 를
// 사람이 그 자리에 없어도 답할 수 있어야 한다. 그 판정이 여기 있다.
//
// 게이트(기계 검증)와 표(판단)를 한 다수결에 섞지 않는다. 섞으면 빨간 테스트를
// 2/3 으로 통과시킬 수 있게 된다. 이 저장소는 "판정은 언제나 종료 코드" 라고
// 정해 두었고(CLAUDE.md), 종료 코드는 협상 대상이 아니다.
//
// 여기도 순수하다. git 도 시계도 없다 — checkOverlap 과 같은 이유로,
// 과거를 재생해 사후 감사를 할 수 있어야 하기 때문이다(SPEC 7-2).
// ---------------------------------------------------------------------------

/**
 * 기본 정책.
 *
 * 정족수를 고정값 3 으로 두면 두 방향으로 틀린다 — 오탈자 하나에 에이전트 3대를
 * 깨워야 하고, 프로토콜 심장부를 고치는 데 1표면 충분해진다. 그래서 등급별이다.
 */
export const DEFAULT_MERGE_POLICY = {
  defaultNeed: 1,
  // 여러 등급에 걸치면 가장 높은 쪽을 따른다.
  // docs 는 0 이지만 docs/SPEC.md 는 3 이다 — 규격은 코드보다 먼저이므로.
  tiers: [
    {
      need: 3,
      paths: [
        'src/protocol.mjs',
        'src/invariants.mjs',
        'bin/axmap.mjs',
        'docs/SPEC.md',
        'docs/INVARIANTS.md',
      ],
    },
    { need: 0, paths: ['docs'] },
  ],
  // CLAUDE.md 의 검증 목록 그대로다. 여기서 새로 정하지 않는다.
  requiredGates: ['test', 'demo', 'demo:compare', 'demo:chaos', 'smoke', 'desktop:smoke'],
}

/**
 * 이 경로들을 고치려면 찬성표가 몇 개 필요한가.
 * 경로 판정은 claim 과 같은 coversPath 를 쓴다. 판정 규칙을 두 벌 두지 않는다.
 */
export function requiredApprovals(paths, policy = DEFAULT_MERGE_POLICY) {
  // 빈 제안은 등급을 알 수 없다. 0표로 조용히 통과시키지 않는다.
  if (!paths?.length) return policy.defaultNeed

  let need = 0
  for (const raw of paths) {
    const file = normalizePath(raw)
    const hit = policy.tiers.filter((t) => coversPath(t.paths, file))
    // 어느 등급에도 안 걸리는 새 파일이 0표가 되지 않게 기본값으로 떨어뜨린다.
    const n = hit.length ? Math.max(...hit.map((t) => t.need)) : policy.defaultNeed
    need = Math.max(need, n)
  }
  return need
}

/**
 * 표 레코드 검증.
 *
 * voter 는 그대로 파일명이 되므로 agent 와 **같은 규칙**으로 본다.
 * 규칙을 따로 만들면 "agent-a" 와 "agent/a" 가 표에서만 같은 파일이 된다.
 */
export function voteError(vote) {
  const nameErr = agentNameError(vote?.voter)
  if (nameErr) return `표의 투표자 이름이 올바르지 않습니다 - ${nameErr}`
  if (vote.verdict !== 'approve' && vote.verdict !== 'reject') {
    return `표의 판정은 approve 또는 reject 여야 합니다: ${JSON.stringify(vote.verdict ?? null)}`
  }
  // head 없는 표는 "어느 코드를 봤는지 모르는 표" 다. 그런 표는 셀 수 없다.
  if (!/^[0-9a-f]{7,40}$/.test(String(vote.head ?? ''))) {
    return `표에 이 표가 본 커밋(head)이 없습니다: ${JSON.stringify(vote.head ?? null)}`
  }
  return null
}

/**
 * 병합 판정. 게이트가 먼저고, 표는 그다음이다.
 *
 * @param {object}   p
 * @param {{id:string, agent:string, head:string, paths:string[]}} p.proposal
 * @param {Array<{voter:string, head:string, verdict:string, lens?:string, reason?:string}>} p.votes
 * @param {Object<string,{ok:boolean, detail?:string}>} p.gates 기계 검증 결과
 * @returns {{ok:boolean, need:number, approvals:string[], blocks:Array}}
 */
export function checkMerge({ proposal, votes = [], gates = {}, policy = DEFAULT_MERGE_POLICY }) {
  const blocks = []
  const need = requiredApprovals(proposal.paths, policy)

  // ── 층 1 · 게이트 ──────────────────────────────────────────────────
  // 빨강이면 표를 아예 세지 않고 나간다. 세기 시작하는 순간
  // "2 대 1 이면 되지 않나" 라는 질문이 생기고, 그 질문이 생기면 언젠가 통과한다.
  for (const name of policy.requiredGates) {
    const g = gates[name]
    // 안 돌린 검증과 통과한 검증을 같게 보면 게이트가 없는 것과 같다 (fail-closed).
    if (!g) blocks.push({ kind: 'missing-gate', gate: name })
    else if (!g.ok) blocks.push({ kind: 'gate', gate: name, detail: g.detail ?? null })
  }
  if (blocks.length) return { ok: false, need, approvals: [], blocks }

  // ── 층 2 · 표 ─────────────────────────────────────────────────────
  // head 가 다른 표는 다른 코드를 본 표다. 제안자가 지적을 고쳐 새 커밋을 올리면
  // 표가 통째로 리셋되는데, 이건 부작용이 아니라 의도다 — 고친 코드는 다시 봐야 한다.
  const current = votes.filter((v) => v.head === proposal.head)

  // 반대표 하나가 정족수를 이긴다. 발견은 다수결의 대상이 아니다.
  // 2 대 1 로 덮으면 "한 명이 찾아낸 진짜 문제" 와 "한 명이 틀린 것" 을 똑같이 버린다.
  // 나가는 길은 논쟁이 아니라 고치는 것이고, 고치면 head 가 바뀌어 반대표가 사라진다.
  for (const v of current.filter((v) => v.verdict === 'reject')) {
    blocks.push({ kind: 'reject', voter: v.voter, reason: v.reason ?? null })
  }

  const approvals = [
    ...new Set(
      current
        // 자기 표는 세지 않는다. 시빌의 가장 싼 형태이고 막는 비용이 한 줄이다.
        .filter((v) => v.verdict === 'approve' && v.voter !== proposal.agent)
        .map((v) => v.voter),
    ),
    // 중복은 "투표자당 파일 하나" 규칙상 생길 수 없지만, 세는 쪽은 보수적으로 둔다.
  ].sort()

  if (approvals.length < need) blocks.push({ kind: 'quorum', need, have: approvals.length })

  return { ok: blocks.length === 0, need, approvals, blocks }
}

/**
 * 병합 보류 사유를 사람과 AI 가 함께 읽는 형태로.
 *
 * formatBlocks 와 같은 원칙이다 — "막혔다"까지만 말하면 에이전트가 다음 행동을
 * 고를 수 없다. 무엇이 막았고 무엇을 하면 풀리는지를 함께 준다.
 */
export function formatMerge(result, proposal) {
  if (result.ok) {
    return (
      `병합 가능 - ${proposal.id}\n` +
      `  게이트 전부 초록, 찬성 ${result.approvals.length}/${result.need}` +
      (result.approvals.length ? ` (${result.approvals.join(', ')})` : '')
    )
  }

  const lines = [`병합 보류 - ${proposal.id}`, '']
  for (const b of result.blocks) {
    if (b.kind === 'missing-gate') {
      lines.push(`  x 게이트 ${b.gate} 를 돌리지 않았습니다`)
      lines.push('      안 돌린 것은 통과가 아닙니다. 돌리고 결과를 붙이세요.')
    } else if (b.kind === 'gate') {
      lines.push(`  x 게이트 ${b.gate} 빨강${b.detail ? ` - ${b.detail}` : ''}`)
      lines.push('      표로 덮을 수 없습니다. 고쳐야 합니다.')
    } else if (b.kind === 'reject') {
      lines.push(`  x ${b.voter} 반대${b.reason ? ` - ${b.reason}` : ''}`)
      lines.push('      고쳐서 새로 올리면 head 가 바뀌어 이 표는 사라집니다.')
    } else if (b.kind === 'quorum') {
      lines.push(`  x 찬성표 부족 ${b.have}/${b.need}`)
      lines.push('      표는 실시간이 아닙니다. 쌓일 때까지 기다려도 됩니다.')
    }
    lines.push('')
  }
  return lines.join('\n')
}
