import { test } from 'node:test'
import assert from 'node:assert/strict'

import { appHrefs, compare, readSource, serverHrefs } from './assistant-href-contract.mjs'

// ── 서버(자바)에서 주소를 뽑는다 ─────────────────────────────────────────────

test('한 줄짜리 Set.of 를 읽는다', () => {
  const src = 'static final Set<String> ALLOWED_HREFS = Set.of("/plan", "/trips");'
  assert.deepEqual(serverHrefs(src), ['/plan', '/trips'])
})

test('🔴 여러 줄에 걸친 Set.of 를 끝까지 읽는다 — 실제 선언이 두 줄이다', () => {
  // 놓치면 둘째 줄의 주소가 "앱에만 있는 여분" 으로 잘못 보고돼 검사가 조용히 통과한다.
  const src = [
    'static final Set<String> ALLOWED_HREFS = Set.of("/plan", "/trips", "/field/translate", "/field/transit",',
    '        "/field/exchange-rate");',
  ].join('\n')
  assert.deepEqual(serverHrefs(src), [
    '/plan', '/trips', '/field/translate', '/field/transit', '/field/exchange-rate',
  ])
})

test('선언을 못 찾으면 null 이다 — 빈 목록으로 넘기지 않는다', () => {
  // 빈 목록이면 "서버가 내주는 것이 없다" 가 되어 무엇이든 통과한다. 그게 제일 나쁘다.
  assert.equal(serverHrefs('class GeminiAssistantAdapter {}'), null)
})

// ── 앱(타입스크립트)에서 주소를 뽑는다 ───────────────────────────────────────

test('타입 표시가 붙은 선언을 읽는다', () => {
  const src = [
    "export const ALLOWED_NAVIGATE_HREFS: readonly AssistantNavigatePath[] = [",
    "  '/plan',",
    "  '/plan/basic',",
    "  '/trips',",
    '];',
  ].join('\n')
  assert.deepEqual(appHrefs(src), ['/plan', '/plan/basic', '/trips'])
})

test('🔴 배열 닫는 괄호에서 멈춘다 — 뒤에 같은 이름이 또 나와도 안 긁는다', () => {
  const src = [
    "export const ALLOWED_NAVIGATE_HREFS = ['/plan'];",
    'export function isAllowedNavigateHref(v) {',
    "  return (ALLOWED_NAVIGATE_HREFS).includes('/여기는긁으면안된다')",
    '}',
  ].join('\n')
  assert.deepEqual(appHrefs(src), ['/plan'])
})

// ── 대조 ────────────────────────────────────────────────────────────────────

test('서버 주소를 앱이 전부 알면 통과', () => {
  const r = compare(['/plan', '/trips'], ['/plan', '/trips'])
  assert.equal(r.verdict, 'ok')
  assert.deepEqual(r.missing, [])
})

test('🔴 서버가 여섯 번째를 추가하고 앱이 모르면 빨개진다 — 이 검사의 존재 이유', () => {
  // S15P21E201-1273 이 정확히 이 모양으로 사용자에게 「없는 기능」이 됐다.
  const server = ['/plan', '/trips', '/field/translate', '/field/transit', '/field/exchange-rate', '/field/weather']
  const app = ['/plan', '/plan/basic', '/trips', '/field/translate', '/field/transit', '/field/exchange-rate']
  const r = compare(server, app)
  assert.equal(r.verdict, 'mismatch')
  assert.deepEqual(r.missing, ['/field/weather'])
})

test('앱이 더 갖고 있는 것은 막지 않는다 — 주소를 옮기는 동안의 호환용이다', () => {
  const r = compare(['/plan'], ['/plan', '/plan/basic'])
  assert.equal(r.verdict, 'ok')
  assert.deepEqual(r.extra, ['/plan/basic'])
})

// ── 파일을 어디서 읽는가 ────────────────────────────────────────────────────

test('working tree 에 있으면 그것을 쓴다 — 이 MR 이 바꾼 값을 봐야 한다', () => {
  const fs = { existsSync: () => true, readFileSync: () => 'LOCAL' }
  const r = readSource('a/b.java', 'origin/back/dev', { fs, git: () => 'FROM_REF' })
  assert.equal(r.source, 'LOCAL')
  assert.match(r.from, /working tree/)
})

test('working tree 에 없으면 ref 에서 받아 온다', () => {
  const fs = { existsSync: () => false, readFileSync: () => 'LOCAL' }
  const r = readSource('a/b.java', 'origin/back/dev', { fs, git: () => 'FROM_REF' })
  assert.equal(r.source, 'FROM_REF')
  assert.equal(r.from, 'origin/back/dev:a/b.java')
})

test('🔴 git show 가 실패하면 null 이다 — 빈 문자열로 넘기면 검사가 꺼진 줄 모른다', () => {
  const fs = { existsSync: () => false, readFileSync: () => '' }
  const r = readSource('a/b.java', 'origin/back/dev', { fs, git: () => null })
  assert.equal(r.source, null)
})
