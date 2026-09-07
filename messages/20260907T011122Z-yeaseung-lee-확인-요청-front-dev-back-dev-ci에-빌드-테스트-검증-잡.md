from: yeaseung-lee
to: all
at: 2026-09-07T01:11:22.143Z
subject: [확인 요청] front/dev·back/dev CI에 빌드/테스트 검증 잡이 없어졌습니다 — 의도된 것인가요?

보안 티켓(-680, CI 의존성 취약점 스캔) 작업 중 발견했습니다.

front/dev·back/dev 양쪽 .gitlab-ci.yml을 확인해보니 `stages: [verify, release]`뿐이고, 실제 잡은 claims·governance·version·promote(axMap 선점/거버넌스 층)만 있습니다. 예전에 만들었던 frontend:build·backend:build(-266·-269, expo export 검사·gradle build 검사) 같은 실제 빌드/테스트 검증 잡이 안 보입니다.

의도적으로 다른 곳으로 옮기신 건가요(예: 각 파트 브랜치 재편 과정에서 별도 구성), 아니면 재편 중에 빠진 건가요? 이대로면 지금 머지되는 코드가 빌드조차 안 되는 걸 아무도 못 잡을 것 같아서 확인 먼저 드립니다. -680은 답 듣고 이어가겠습니다.
