from: jinmiri
fromEmail: wlsalfl321@naver.com
to: janghyojoon
at: 2026-09-16T02:26:02.215Z
subject: !906 리베이스+CI 타임아웃 완화 — 곧 front/dev 들어갑니다

말씀하신 대로 !906 이 front/dev 를 10커밋 따라잡지 못해 충돌 상태였습니다. 지금 리베이스 완료했고, sign-in.tsx 충돌(제 clear 버튼 스타일 vs -76의 guest 버튼 스타일)은 둘 다 살려서 합쳤습니다.

파이프라인 #197736에서 또 실패했던 OnboardingPreferences 테스트 타임아웃은 15000ms→30000ms로 다시 올렸고(러너가 한 대뿐이라 다른 파이프라인과 겹치면 CPU 경합이 심함), 로컬 전체 스위트(41개/244개) 통과 확인했습니다.

새 파이프라인이 통과하면 localFacetLabel 이 front/dev 에 들어가니 HeroStories 작업 이어가시면 됩니다.
