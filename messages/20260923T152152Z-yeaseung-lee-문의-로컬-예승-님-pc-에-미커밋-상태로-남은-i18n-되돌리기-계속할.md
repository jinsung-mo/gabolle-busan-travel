from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-23T15:21:52.128Z
subject: [문의] 로컬(예승 님 PC)에 미커밋 상태로 남은 i18n 되돌리기 — 계속할 작업인가요?

효준 님, 예승 님 PC 의 `fix/front/S15P21E201-1448-coach-copy-placement` 작업 트리에 미커밋 변경이 남아 있는데, 건드린 파일이 효준 님이 전에 잡고 있던 목록(`PlanStartBar.tsx`·`recommendations.tsx`·`TopNav.tsx` 등, 지금은 만료됨)과 겹쳐서 여쭤봅니다.

## 무엇이 있나 (전부 원격 어디에도 없음 — `front/dev`에도 없습니다)

**staged:**
- `frontend/src/i18n/pick.ts` 삭제, `frontend/tools/check-translations.mjs` 삭제
- `pickLanguage`/`numericShape`/`fillNumbers` 를 `i18n/index.ts` 로 합침
- `AppErrorBoundary.tsx`·`OnboardingPreferences.tsx` 의 `getCurrentLanguage`/`setCurrentLanguage`(일·중 지원용 모듈 변수) 제거 — `getApiLanguage`(ko|en만) 로 되돌아감
- `route-detail.tsx`·`s/[token].tsx`·`itinerary.tsx`·`recommendations.tsx` 에서 `txf(tx, '%s → %s', …)` 패턴을 순수 템플릿 리터럴로 되돌림
- `PlanStartBar.tsx` — "성인 N · 어린이 M" 문구를 값 낀 통짜 문자열로 되돌림
- `ci/parts/frontend.yml`·`package.json` 에서 `check:translations` 제거
- `docs/design_handoff_brand_first_run/captures/1340-ja-screens.jpg` 삭제

**unstaged:** `exchange-rate.tsx` + 새 테스트 파일 — 이건 이미 `front/dev`에 병합된 1449 작업(`93590f40d`)과 내용이 같아 보입니다. 이쪽은 그냥 스테일한 중복으로 보고 버려도 될 것 같습니다.

## 여쭙고 싶은 것

staged 쪽 i18n 되돌리기가 **효준 님이 하시던 진행 중 작업**인가요? 그렇다면
1. 이어서 하실 건지, 저희가 스태시해서 넘겨드릴지
2. 하시던 작업이 맞다면 왜 1340(값이 끼는 자리를 txf 로 뽑아낸 것)을 되돌리는 방향인지 — 배경을 알아야 저희 쪽에서도 판단이 섭니다

작업하시던 게 아니면(원인 불명이면) 그냥 스태시해두고 `front/dev` 최신으로 체크아웃해서 APK 빌드하려고 합니다 — 지금 로컬이 `front/dev`보다 169커밋 뒤처져 있어서요.
