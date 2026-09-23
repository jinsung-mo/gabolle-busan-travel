import { test } from 'node:test'
import assert from 'node:assert/strict'

import { check, dockerRunBlocks, joinShellCommand, strayBackslashes } from './jenkinsfile-contract.mjs'

const BS = String.fromCharCode(92)

// 🔴 이 시험들이 흉내 내는 것은 «실제로 일어난 일» 이다 — 2026-09-22, S15P21E201-561.
//    지어낸 사례가 아니라 그날 운영을 멈춘 두 모양을 줄여 놓은 것이다.

const HEALTHY = [
  "                        sh '''",
  '                            docker run -d --name backend ' + BS,
  '                            -e GABOLLE_DB_URL="$GABOLLE_DB_URL" ' + BS,
  '                            -e GABOLLE_JWT_SECRET="$GABOLLE_JWT_SECRET" ' + BS,
  '                            -e GABOLLE_KMA_SERVICE_KEY="$GABOLLE_KMA_SERVICE_KEY" ' + BS,
  '                            -e GABOLLE_TRANSIT_SERVICE_KEY="$GABOLLE_TRANSIT_SERVICE_KEY" ' + BS,
  '                            -e GABOLLE_EXCHANGE_RATE_AUTH_KEY="$GABOLLE_EXCHANGE_RATE_AUTH_KEY" ' + BS,
  '                            -e GABOLLE_INTERNAL_API_TOKEN="$GABOLLE_INTERNAL_API_TOKEN" ' + BS,
  '                            -e GABOLLE_KAFKA_BOOTSTRAP_SERVERS="kafka:9092" ' + BS,
  '                            local-route-backend:candidate',
  "                        '''",
].join('\n')

test('성한 파일은 통과한다', () => {
  assert.deepEqual(check(HEALTHY), [])
})

// ── ① 셸 주석이 docker run 을 삼킨다 ────────────────────────────────────────

test('🔴 docker run 한가운데 주석이 있으면 잡는다 — 이미지 이름까지 사라진다', () => {
  const broken = HEALTHY.replace(
    '                            -e GABOLLE_INTERNAL_API_TOKEN="$GABOLLE_INTERNAL_API_TOKEN" ' + BS,
    '                            # 카프카 설명이 여기 들어갔다\n'
      + '                            -e GABOLLE_INTERNAL_API_TOKEN="$GABOLLE_INTERNAL_API_TOKEN" ' + BS)
  const problems = check(broken)
  assert.ok(problems.some((p) => p.what.includes('이미지 이름으로 끝나지 않습니다')),
    '이미지가 사라진 것을 잡아야 한다')
  assert.ok(problems.some((p) => p.what.includes('셸 주석이 있습니다')),
    '주석이 명령 안에 있는 것도 따로 말해야 한다')
})

test('🔴 주석에 삼켜진 환경변수를 하나하나 말한다 — 「무엇이 조용히 꺼지는가」가 핵심이다', () => {
  const broken = HEALTHY.replace(
    '                            -e GABOLLE_TRANSIT_SERVICE_KEY="$GABOLLE_TRANSIT_SERVICE_KEY" ' + BS,
    '                            # 여기서 끊긴다\n'
      + '                            -e GABOLLE_TRANSIT_SERVICE_KEY="$GABOLLE_TRANSIT_SERVICE_KEY" ' + BS)
  const missing = check(broken).filter((p) => p.what.includes('없습니다')).map((p) => p.what)
  assert.ok(missing.some((m) => m.includes('GABOLLE_TRANSIT_SERVICE_KEY')))
  assert.ok(missing.some((m) => m.includes('GABOLLE_INTERNAL_API_TOKEN')))
  assert.ok(missing.some((m) => m.includes('GABOLLE_KAFKA_BOOTSTRAP_SERVERS')))
})

test('셸이 붙이는 방식을 그대로 흉내 낸다 — 주석을 만나면 거기서 끊는다', () => {
  assert.equal(joinShellCommand(['docker run ' + BS, '-e A=1 ' + BS, 'image:tag']),
    'docker run -e A=1 image:tag')
  assert.equal(joinShellCommand(['docker run ' + BS, '# 설명', '-e A=1 ' + BS, 'image:tag']),
    'docker run')
})

// ── ② 주석의 역슬래시가 Groovy 파싱을 깨뜨린다 ──────────────────────────────

test("🔴 sh ''' ''' 안 주석의 역슬래시를 잡는다 — 파일 전체가 파싱 불가가 된다", () => {
  const broken = HEALTHY.replace(
    '                            docker run -d --name backend ' + BS,
    '                            # 줄 이음(' + BS + ')이 다음 줄을 붙인다\n'
      + '                            docker run -d --name backend ' + BS)
  const problems = check(broken)
  assert.ok(problems.some((p) => p.what.includes('줄 끝이 아닌 역슬래시')),
    'Groovy 이스케이프가 되는 역슬래시를 잡아야 한다')
})

test('줄 «끝»의 역슬래시는 정상이다 — 그것까지 잡으면 파일 전체가 빨개진다', () => {
  assert.deepEqual(strayBackslashes(HEALTHY), [])
})

test("sh ''' ''' 밖의 역슬래시는 보지 않는다 — Groovy 주석·문자열은 이 규칙과 무관하다", () => {
  const outside = '// 개인키의 \n 표기도 괜찮다\n' + HEALTHY
  assert.deepEqual(strayBackslashes(outside).filter((s) => s.text.startsWith('//')), [])
})

// ── 검사가 «꺼지는» 것을 막는다 ─────────────────────────────────────────────

test('🔴 docker run 을 하나도 못 찾으면 통과가 아니다 — 블록 0개는 검사가 꺼진 것이다', () => {
  assert.equal(dockerRunBlocks("sh '''\n  echo hi\n'''").length, 0)
})

test('블록을 «이미지 이름»으로 끝낸다 — 역슬래시로 찾으면 첫 주석에서 멈춘다', () => {
  const broken = HEALTHY.replace(
    '                            -e GABOLLE_JWT_SECRET="$GABOLLE_JWT_SECRET" ' + BS,
    '                            # 끊는 주석\n'
      + '                            -e GABOLLE_JWT_SECRET="$GABOLLE_JWT_SECRET" ' + BS)
  const [block] = dockerRunBlocks(broken)
  assert.match(block.lines[block.lines.length - 1], /local-route-backend:/)
})
