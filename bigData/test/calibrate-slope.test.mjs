/**
 * 경사 기준선 보정 — 문턱에 붙은 기준선을 고르지 않는가
 *
 * 🔴 왜 이 시험이 필요한가. 2026-09-29 재실측에서 60m 가 거짓 양성 0.9% 로 옛 문턱(1%)을
 *    겨우 넘어 권장됐다. 옛 실측에서 같은 60m 는 2% 였다 — 원본이 갱신될 때마다 판정이
 *    흔들린다는 뜻이다. 문턱을 0.5% 로 두어 그 실측표에서 100m 가 나오는지 박아 둔다.
 *
 * 고도 파일 없이 돈다 — 측정표를 손으로 준다.
 *
 *   node --test test/calibrate-slope.test.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pickBaseline, FLAT_FP_MAX } from '../process/calibrate-slope.mjs'
import { BASELINE_M } from '../process/slope.mjs'

/** 2026-09-29 실측표 (_calibration.json 의 rows). */
const MEASURED_2026_09_29 = [
  { baselineM: 30, flatFalsePositive: 0.0245, hillyOver8: 0.6503 },
  { baselineM: 60, flatFalsePositive: 0.009, hillyOver8: 0.6327 },
  { baselineM: 100, flatFalsePositive: 0.0021, hillyOver8: 0.6168 },
  { baselineM: 150, flatFalsePositive: 0.0003, hillyOver8: 0.6048 },
  { baselineM: 200, flatFalsePositive: 0, hillyOver8: 0.5966 },
]

describe('pickBaseline', () => {
  it('문턱은 0.5% 다 — 1% 로 되돌리면 60m 가 다시 뽑힌다', () => {
    assert.equal(FLAT_FP_MAX, 0.005)
  })

  it('2026-09-29 실측표에서 100m 를 고른다 — 60m(0.9%) 는 문턱에 붙어 있어 안 고른다', () => {
    assert.equal(pickBaseline(MEASURED_2026_09_29).baselineM, 100)
  })

  it('고른 값이 경사 계산의 기준선과 같다', () => {
    assert.equal(pickBaseline(MEASURED_2026_09_29).baselineM, BASELINE_M)
  })

  it('문턱과 같은 값은 통과한다 (이하)', () => {
    assert.equal(pickBaseline([{ baselineM: 60, flatFalsePositive: 0.005 }]).baselineM, 60)
  })

  it('표 순서와 무관하게 가장 짧은 것을 고른다', () => {
    assert.equal(pickBaseline([...MEASURED_2026_09_29].reverse()).baselineM, 100)
  })

  it('어느 기준선도 잡음을 못 죽이면 null — 값을 지어내지 않는다', () => {
    assert.equal(pickBaseline([{ baselineM: 30, flatFalsePositive: 0.02 }, { baselineM: 200, flatFalsePositive: 0.006 }]), null)
  })
})
