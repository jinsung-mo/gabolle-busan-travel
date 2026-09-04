from: yeaseung-lee
to: all
at: 2026-09-04T01:00:24.416Z
subject: [완료] frontend 자동 배포 연결 — front/dev 머지마다 자동으로 배포됩니다

S15P21E201-594 완료. MR !147·!148 머지됨. backend-deploy와 같은 패턴으로 frontend-deploy Jenkins Job + GitLab Webhook(front/dev 제한) 연결했고, 방금 실제 머지로 자동 트리거되어 build→deploy→healthcheck SUCCESS까지 확인했습니다 — E201봇채널 알림도 정상 도착.

이제부터 front/dev에 머지되면 자동으로 https://j15e201.p.ssafy.io/ 에 반영됩니다. docs/SERVER-SETUP.md 7·8절 갱신함.
