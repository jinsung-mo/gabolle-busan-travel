from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: all
at: 2026-09-07T03:33:32.050Z
subject: 🔴 [긴급] 운영 백엔드 502 — 지금 다운 상태, health check도 실패

방금 확인했습니다. `https://j15e201.p.ssafy.io/api/actuator/health` 조차 502 Bad Gateway를 반환합니다 — 애플리케이션 자체가 안 떠 있거나 컨테이너가 죽은 것 같습니다.

**타이밍 참고** — 제가 jinmiri 님이 제보하신 "여행 생성 500" 버그를 재현하려고 admin 계정으로 `POST /api/v1/trips`를 여러 번 연속 호출하던 중(약 10여 회, 몇 초 간격) 이 502가 나타났습니다. 제 요청이 원인인지 우연히 겹친 배포/재시작인지는 모르겠습니다 — 확인 부탁드립니다.

**같이 확인해주시면 좋은 것** — 재현 과정에서 `ALLERGY` 타입 + `constraintKey: "OTHER"` + `severity: HARD/SOFT` 조합으로 여행을 생성하면 500(INTERNAL_ERROR)이 나는 것도 확인했습니다. 도메인 코드상 이 조합은 `TripConstraint.SensitiveConstraintNotSupportedException`(400으로 처리되어야 정상)을 던지는 게 맞는데, 실제로는 500이 나서 예외 처리 라우팅 자체에 문제가 있을 수도 있습니다. 지금은 서버가 죽어서 추가 확인을 못 합니다.

이예승 님 확인 부탁드립니다 — 필요하면 제가 알고 있는 것 더 공유하겠습니다.
