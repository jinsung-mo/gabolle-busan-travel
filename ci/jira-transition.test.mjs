import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { keysFromSubject, skipByIssueType } from './jira-transition.mjs'

/**
 * S15P21E201-972 — 남의 티켓·에픽이 완료로 날아가던 것을 막았는지 잰다.
 *
 * 🔴 이 검사가 없으면 되돌아가도 아무도 모른다. 결함이 **조용했기** 때문이다 —
 * 잡은 초록으로 끝나고 카드만 틀리게 움직였다. 사람이 머지 이력과 Jira 를 전수 대조하다
 * 발견했고(2026-09-15), 그 비용을 다시 치르지 않으려고 여기에 고정한다.
 */

/**
 * 🔴 실측 재료 — 본문 참조만으로 걸렸던 14건 (티켓 -972 본문).
 *
 * 이 중 `S15P21E201-452` 는 **그날 막 착수한 티켓**이었다. 본문에 이름이 언급됐다는
 * 이유만으로 "머지됨" 으로 잡혀서, 그대로 옮겼다면 **시작도 안 한 일이 완료로 찍혔을
 * 것**이다. 이 목록이 이 검사의 존재 이유다.
 */
const REFERENCED_IN_BODY_ONLY = [
  195, 250, 452, 506, 544, 560, 675, 702, 716, 841, 566, 710, 753, 956,
].map((n) => `S15P21E201-${n}`)

test('제목 맨 앞의 키만 그 커밋이 한 일로 센다', () => {
  assert.deepEqual(
    keysFromSubject('[S15P21E201-944] feat: [BE] 재시도가 안전해진다'),
    ['S15P21E201-944'],
  )
})

test('🔴 제목 안에 있어도 맨 앞이 아니면 안 센다 — 그건 참조다', () => {
  // 본문은 아예 안 읽지만, 제목에 섞여 들어오는 참조도 같은 이유로 막아야 한다.
  assert.deepEqual(keysFromSubject('docs: S15P21E201-452 와 같은 패턴을 적는다'), [])
  assert.deepEqual(keysFromSubject('fix: 상위 스토리는 S15P21E201-195 다'), [])
})

test('🔴 본문에만 언급됐던 14건은 그 참조 문장으로는 하나도 안 걸린다', () => {
  for (const key of REFERENCED_IN_BODY_ONLY) {
    const asReference = `chore: 이 자리는 ${key} 의 일이다`
    assert.deepEqual(
      keysFromSubject(asReference),
      [],
      `${key} 가 참조 문장에서 걸렸다 — 남의 카드를 옮기게 된다`,
    )
  }
})

test('머지 커밋은 들어온 브랜치에서 키를 찾는다', () => {
  assert.deepEqual(
    keysFromSubject("Merge branch 'feat/back/S15P21E201-1001-trip-recommendation-jobs' into 'back/dev'"),
    ['S15P21E201-1001'],
  )
})

test('🔴 머지 커밋의 대상 브랜치에서는 키를 찾지 않는다', () => {
  // 대상 쪽에 키가 들어 있어도 그건 "어디로 갔나" 이지 "무엇을 했나" 가 아니다.
  assert.deepEqual(
    keysFromSubject("Merge branch 'hotfix/x' into 'feat/back/S15P21E201-999-wrong'"),
    [],
  )
})

test('키가 없는 제목은 빈 배열', () => {
  assert.deepEqual(keysFromSubject('chore: 그냥 정리'), [])
  assert.deepEqual(keysFromSubject(''), [])
  assert.deepEqual(keysFromSubject(undefined), [])
})

// ── 타입으로 거르기 ──────────────────────────────────────────────────────────

test('🔴 에픽은 건너뛴다 — 커밋 하나로 끝나는 물건이 아니다', () => {
  // 2026-09-15 실측 — S15P21E201-41(출시 준비 에픽)의 실제 응답 모양이다.
  assert.equal(skipByIssueType({ name: '에픽', hierarchyLevel: 1 }), true)
})

test('작업은 옮긴다', () => {
  // 같은 날 실측 — S15P21E201-1001 의 실제 응답 모양이다.
  assert.equal(skipByIssueType({ name: '작업', hierarchyLevel: 0 }), false)
})

test('🔴 타입 이름이 한글로 와도 판정이 흔들리지 않는다', () => {
  // 티켓은 영문 이름(Epic)으로 거르라고 적었지만, 이슈를 직접 읽으면 화면 언어를 따라
  // 한글로 온다. 이름으로 비교했다면 한 번도 안 걸려 에픽이 그대로 날아갔을 것이다.
  assert.equal(skipByIssueType({ name: 'Epic', hierarchyLevel: 1 }), true)
  assert.equal(skipByIssueType({ name: 'Task', hierarchyLevel: 0 }), false)
})

test('🔴 타입을 모르면 안 옮긴다 — 모르는 채로 옮기는 것이 더 나쁘다', () => {
  assert.equal(skipByIssueType(undefined), true)
  assert.equal(skipByIssueType({}), true)
  assert.equal(skipByIssueType({ name: '에픽' }), true)
})
