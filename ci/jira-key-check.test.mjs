import { test } from 'node:test'
import assert from 'node:assert/strict'

import { judge, keyFromSubject, partFromBranch, partFromTitle, summarize } from './jira-key-check.mjs'

// ── 커밋 제목에서 키를 뽑는다 ────────────────────────────────────────────────

test('맨 앞 대괄호 키를 읽는다', () => {
  assert.equal(keyFromSubject('[S15P21E201-1188] fix: [BE] 경사 취향'), 'S15P21E201-1188')
})

test('🔴 맨 앞이 아닌 키는 안 읽는다 — 본문 참조까지 긁으면 남의 카드가 움직인다', () => {
  assert.equal(keyFromSubject('fix: 관련 S15P21E201-1188'), null)
  assert.equal(keyFromSubject('[BE] fix: S15P21E201-1188'), null)
})

test('다른 프로젝트 키나 모양이 다른 것은 안 읽는다', () => {
  assert.equal(keyFromSubject('[OTHER-12] fix: x'), null)
  assert.equal(keyFromSubject('[S15P21E201] fix: x'), null)
  assert.equal(keyFromSubject(''), null)
})

// ── 브랜치에서 파트를 뽑는다 ─────────────────────────────────────────────────

test('기능 브랜치 가운데 칸이 파트다', () => {
  assert.equal(partFromBranch('feat/back/S15P21E201-1188-slope'), 'back')
  assert.equal(partFromBranch('fix/front/S15P21E201-1-x'), 'front')
  assert.equal(partFromBranch('feat/bigData/S15P21E201-1-x'), 'bigdata')
})

test('🔴 파트 브랜치는 대조할 파트가 없다 — 틀린 것이 아니라 없는 것이다', () => {
  assert.equal(partFromBranch('back/dev'), null)
  assert.equal(partFromBranch('main'), null)
  assert.equal(partFromBranch(''), null)
})

test('모르는 파트 이름은 null 이다 — 지어내지 않는다', () => {
  assert.equal(partFromBranch('feat/infra/S15P21E201-1-x'), null)
})

// ── 카드 제목에서 파트 표시를 뽑는다 ─────────────────────────────────────────

test('둘째 대괄호가 파트다', () => {
  assert.deepEqual(partFromTitle('[Fix][Back] 경사 취향을 못 읽는다').part, 'back')
  assert.deepEqual(partFromTitle('[Bug][Front] 사진이 안 보인다').part, 'front')
  assert.deepEqual(partFromTitle('[Feat][Data] 그늘 축을 만든다').part, 'bigdata')
})

test('🔴 대괄호가 하나뿐인 옛 제목도 읽는다 — 자리가 아니라 어휘로 고른다', () => {
  assert.equal(partFromTitle('[FE] 앱에 지도가 없다').part, 'front')
  assert.equal(partFromTitle('[Bug][BE] 일정 생성이 100% 실패한다').part, 'back')
})

test('🔴 모르는 표시는 null 이다 — Infra·Common·Docs 는 어느 파트에서 해도 된다', () => {
  assert.equal(partFromTitle('[Chore][Infra] 러너 태그가 없다').part, null)
  assert.equal(partFromTitle('[Docs][Common] 약관 정정').part, null)
  assert.equal(partFromTitle('[Design][Front] 피드 개편').part, 'front')
  assert.equal(partFromTitle('대괄호가 아예 없는 제목').part, null)
})

// ── 판정 ─────────────────────────────────────────────────────────────────────

test('파트가 맞으면 통과다', () => {
  assert.equal(judge('S15P21E201-1188', '[Fix][Back] 경사', 'back').verdict, 'ok')
})

test('🔴 어젯밤 사고 — 프론트 브랜치가 백엔드 카드를 가리킨 것을 잡는다', () => {
  const r = judge('S15P21E201-1188', '[Fix][Back] 경사 취향을 못 읽는다', 'front')
  assert.equal(r.verdict, 'mismatch')
  // 무엇을 하라고 말해야 한다. "안 맞습니다" 만으로는 사람이 무엇을 고칠지 모른다.
  assert.match(r.message, /경사 취향을 못 읽는다/)
  assert.match(r.message, /'front'/)
  assert.match(r.message, /번호가 맞습니까/)
})

test('🔴 어젯밤 사고 — 백엔드 브랜치가 프론트 카드를 가리킨 것을 잡는다', () => {
  assert.equal(judge('S15P21E201-1187', '[Bug][Front] 사진을 못 올린다', 'back').verdict, 'mismatch')
})

test('🔴 없는 카드는 막는다 — 나중에 그 번호로 만들어질 남의 카드가 움직인다', () => {
  const r = judge('S15P21E201-9999', null, 'back')
  assert.equal(r.verdict, 'mismatch')
  assert.match(r.message, /Jira 에 없습니다/)
})

test('🔴 모르는 어휘로는 막지 않는다 — 검사를 미워하게 만들면 사람이 피해 간다', () => {
  assert.equal(judge('S15P21E201-1162', '[Chore][Infra] 러너 태그', 'back').verdict, 'unknown')
  assert.equal(judge('S15P21E201-1163', '[Docs][Common] 약관', 'front').verdict, 'unknown')
})

test('브랜치에서 파트를 못 읽으면 건너뛴다', () => {
  assert.equal(judge('S15P21E201-1188', '[Fix][Back] 경사', null).verdict, 'unknown')
})

// ── 합치기 ───────────────────────────────────────────────────────────────────

test('하나라도 틀리면 틀린 것이다 (2)', () => {
  assert.equal(summarize([{ verdict: 'ok' }, { verdict: 'unknown' }, { verdict: 'mismatch' }]), 2)
})

test('모르는 것이 섞이면 모르는 것이다 (1)', () => {
  assert.equal(summarize([{ verdict: 'ok' }, { verdict: 'unknown' }]), 1)
})

test('전부 맞으면 0 이다', () => {
  assert.equal(summarize([{ verdict: 'ok' }, { verdict: 'ok' }]), 0)
})
