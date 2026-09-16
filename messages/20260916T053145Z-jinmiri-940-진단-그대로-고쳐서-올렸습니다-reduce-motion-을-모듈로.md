from: jinmiri
fromEmail: wlsalfl321@naver.com
to: yeaseung-lee
at: 2026-09-16T05:31:45.863Z
subject: [!940] 진단 그대로 고쳐서 올렸습니다 — reduce-motion 을 모듈로 올렸고 43스위트 264테스트 전부 초록입니다

A/B 로 재 주셔서 원인이 바로 잡혔습니다. 제안하신 방향 그대로 적용했습니다.

## 무엇을 바꿨나 — `4e5c7ac0`

`Button` 안의 `useState` + `useEffect` 를 걷어내고, reduce-motion 을 **모듈 수준에서 한 번만** 묻습니다.

```tsx
let reducedMotion = false;
void Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.())
  .then((value) => { reducedMotion = Boolean(value); })
  .catch(() => { /* 조회할 수 없는 환경이면 애니메이션을 그대로 둔다 */ });
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => { reducedMotion = Boolean(value); });
```

말씀하신 대로 이 값은 **누르는 순간에만 읽으므로 바뀌어도 다시 그릴 필요가 없습니다.** 그래서 상태가 아니라 모듈 변수가 맞습니다. 버튼에서 `useState`·`useEffect` 가 사라졌으니 마운트 수만큼 쌓이던 비동기 `setState` 도 같이 사라집니다.

두 가지를 제안에서 조금 바꿨습니다.

- `Promise.resolve(...)` 로 감쌌습니다. `isReduceMotionEnabled?.()` 가 없는 환경에서 `undefined.then` 이 되지 않게 하려는 것입니다
- `.catch()` 를 붙였습니다. 테스트가 끝난 뒤 떠다니는 거부(unhandled rejection)가 다른 스위트에 묻어 들어가지 않게 하려는 것입니다

## 검증

| | |
|---|---|
| `npx jest --ci` | 43 스위트 · 264 테스트 **전부 통과** (exit 0) |
| `npx tsc --noEmit` | 통과 (exit 0) |

그 테스트만 A/B 로 다시 재 봤습니다. 제 PC 는 예승님 기계보다 빨라서 배수가 작게 나옵니다 — **422ms → 358ms**. 절대값이 작아 배수로는 안 보이지만, 없애려던 것(마운트마다 붙는 비동기 상태 갱신)은 구조적으로 사라졌습니다. 2코어 CI 에서 실제로 어떻게 나오는지는 파이프라인에서 보겠습니다.

## 애니메이션 시간은 안 건드렸습니다

`90ms`·`150ms` 그대로입니다. **그건 UX 를 건드리는 것이라 먼저 손대지 않는 게 맞다**는 말씀에 동의합니다. 이번 수정만으로 CI 가 초록이면 그 값은 유지하겠습니다.

`useNativeDriver: true` 도 그대로 뒀습니다. 말씀대로 jest 에서는 JS 쪽으로 떨어지는데, 이번 수정 뒤에도 남는 비용이 보이면 그때 같이 보시죠.

브랜치를 직접 안 고치고 쪽지로 알려주신 것 감사합니다 — 덕분에 어디를 봐야 하는지 찾는 시간이 0이었습니다.
