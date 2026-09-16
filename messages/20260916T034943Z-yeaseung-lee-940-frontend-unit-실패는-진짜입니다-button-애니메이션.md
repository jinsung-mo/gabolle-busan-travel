from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jinmiri
at: 2026-09-16T03:49:43.439Z
subject: [!940] frontend:unit 실패는 진짜입니다 — Button 애니메이션이 그 테스트를 3.9배 느리게 만듭니다

## `frontend:unit` 이 두 번 다 같은 자리에서 터집니다

`src/onboarding/__tests__/SpendProfileScreen.test.tsx` 의 **"keeps answers after a failed save and retries without repeating questions"** 가 `Exceeded timeout of 5000 ms` 로 실패합니다. 단언 실패가 아니라 **시간 초과**입니다.

처음엔 제가 러너 동시 실행 수를 2→3으로 올린 탓인 줄 알고 되돌렸는데, **되돌린 뒤 정상 속도(107초)에서도 같은 자리에서 실패**했습니다. 그래서 A/B 로 쟀습니다.

## A/B 실측 — 같은 기계, 같은 명령, 그 테스트만

| Button.tsx | 그 테스트 소요 |
|---|---|
| 변경 전(`HEAD~1`) | **190 ms** |
| !940 의 변경 | **739 ms** |

**약 3.9배**입니다. 제 PC 에서 739ms 면, 2코어로 묶인 CI 컨테이너에서 43개 스위트를 동시에 돌릴 때 5초를 넘깁니다. 로컬에서 단독 실행하면 통과하므로 **"내 컴퓨터에선 되는데" 가 나오는 종류**입니다.

## 무엇이 느리게 만드나

`Button` 이 **인스턴스마다** 이걸 합니다.

```tsx
const [reducedMotion, setReducedMotion] = useState(false);
useEffect(() => {
  void AccessibilityInfo.isReduceMotionEnabled?.().then((value) => { ... setReducedMotion(value) });
}, []);
```

버튼 하나마다 **비동기 네이티브 조회 + 그 결과로 `setState`** 가 붙습니다. 설문 화면은 질문을 넘기며 버튼을 계속 다시 그리므로, 마운트 수만큼 비동기 상태 갱신이 쌓이고 테스트는 그때마다 `act()` 로 플러시해야 합니다. 애니메이션 타이머(`90ms`·`150ms`)도 누름마다 더해집니다.

## 제안 — 기능은 그대로 두고 비용만 없앱니다

**reduce-motion 값을 컴포넌트 밖으로 올리세요.** 이건 기기 설정이라 버튼마다 물어볼 값이 아니라 앱에 하나만 있으면 됩니다.

```tsx
// 모듈 수준에서 한 번만 묻고, 바뀌면 이벤트로 갱신
let reducedMotionCache = false;
void AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reducedMotionCache = v; });
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => { reducedMotionCache = v; });
```

그러면 버튼에서 `useState`·`useEffect` 가 사라지고, 애니메이션 동작은 그대로입니다.

이것만으로 부족하면 그다음 후보는 애니메이션 시간(90/150ms)인데, **그건 UX 를 건드리는 것**이라 먼저 손대지 않는 게 맞다고 봅니다.

## 확인해 주셨으면 하는 것

`useNativeDriver: true` 를 이미 쓰고 계신데, jest 환경에서는 네이티브 드라이버가 없어 JS 쪽으로 떨어집니다. 위 수정 뒤에도 남는 비용이 있으면 그 부분을 같이 보겠습니다.

**!940 은 정당하게 빨간 것입니다** — 재시도로 넘길 문제가 아니라서 재시도만 하고 머지는 안 했습니다. 제가 브랜치를 직접 고치지 않은 것은 미리님 기능이라서입니다. 원하시면 제가 위 수정까지 올리겠습니다 — 말씀만 주세요.
