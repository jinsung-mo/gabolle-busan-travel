/**
 * 구간 경사 — 짧은 길은 경사를 모른다고 말하는가
 *
 * 🔴 왜 이 시험이 필요한가. 기준선(경사를 재는 두 점 사이 거리)은 100m 로 실측해 정했다 —
 *    30m 로 재면 고도 오차 ±5m 가 평지의 6% 를 "8% 이상" 으로 만든다. 그런데 60m 미만 길은
 *    창이 하나도 안 나와서, 예전 코드는 처음·끝 점의 고도 차로 채웠다. 바로 그 잡음이다.
 *    숫자는 그럴듯하게 나오므로 빨간불이 안 켜진다. 그래서 시험으로 박는다.
 *
 * 고도 파일(DEM 타일) 없이 돈다 — 고도를 손으로 준다.
 *
 *   node --test test/slope.test.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { waySlopeStats, resample, MIN_SLOPE_RUN_M, BASELINE_M } from '../process/slope.mjs'

/** 정북으로 뻗은 곧은 길 하나 (위도 1도 ≈ 111,195m). */
const straight = (metres) => [
  { lat: 35.1, lon: 129.0 },
  { lat: 35.1 + metres / 111195, lon: 129.0 },
]

/** 고르게 오르는 길 — 점마다 s × 기울기. */
const rising = (pts, grade) => pts.map((p) => p.s * grade)

describe('짧은 길은 경사를 모른다', () => {
  it('기준선의 60% 가 문턱이다', () => {
    assert.equal(MIN_SLOPE_RUN_M, BASELINE_M * 0.6)
  })

  it('40m 길 — 경사도 누적 오르내림도 null, slopeTooShort', () => {
    const { pts, length } = resample(straight(40))
    assert.ok(Math.abs(length - 40) < 0.5, `길이 ${length}`)
    // 🔴 끝에서 5m 튀는 고도 — 예전 코드는 이것을 12.5% 경사로 냈다
    const elev = pts.map((p, i) => (i === pts.length - 1 ? 5 : 0))
    const r = waySlopeStats(pts, elev)
    assert.equal(r.slopeTooShort, true)
    assert.equal(r.p50Slope, null)
    assert.equal(r.p90Slope, null)
    assert.equal(r.maxSlope, null)
    assert.equal(r.ascent, null, '누적 오르내림도 같은 잡음이다')
    assert.equal(r.descent, null)
  })

  it('59m 도 모른다, 60m 부터 잰다', () => {
    const a = resample(straight(59))
    assert.equal(waySlopeStats(a.pts, rising(a.pts, 0.05)).slopeTooShort, true)
    const b = resample(straight(61))
    assert.equal(waySlopeStats(b.pts, rising(b.pts, 0.05)).slopeTooShort, false)
  })
})

describe('긴 길은 잰다', () => {
  it('150m · 5% 오르막 — 숫자가 나오고 5% 다', () => {
    const { pts } = resample(straight(150))
    const r = waySlopeStats(pts, rising(pts, 0.05))
    assert.equal(r.slopeTooShort, false)
    assert.equal(typeof r.p50Slope, 'number')
    assert.ok(Math.abs(r.p50Slope - 0.05) < 1e-6, `p50 ${r.p50Slope}`)
    assert.ok(Math.abs(r.p90Slope - 0.05) < 1e-6, `p90 ${r.p90Slope}`)
    assert.ok(Math.abs(r.ascent - 7.5) < 0.1, `ascent ${r.ascent}`)
    assert.equal(r.descent, 0)
  })

  it('평지면 0 — 모름(null)과 평지(0)는 다른 값이다', () => {
    const { pts } = resample(straight(150))
    const r = waySlopeStats(pts, pts.map(() => 3))
    assert.equal(r.p50Slope, 0)
    assert.notEqual(r.p50Slope, null)
  })
})
