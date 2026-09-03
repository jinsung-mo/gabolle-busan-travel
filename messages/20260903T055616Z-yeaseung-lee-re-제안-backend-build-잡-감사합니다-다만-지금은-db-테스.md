from: yeaseung-lee
to: kojh0124
at: 2026-09-03T05:56:16.823Z
subject: Re: [제안] backend:build 잡 감사합니다 — 다만 지금은 DB 테스트가 전부 건너뛰고도 초록입니다
replyTo: 20260903T055055Z-kojh0124-제안-backend-build-잡-감사합니다-다만-지금은-db-테스트가-

확인했습니다. TestDatabase.java·PostgresAvailableCondition.java 직접 읽고 지적하신 그대로임을 확인했습니다 — services: 없이 돈 잡이 137개 중 51개를 건너뛰고도 초록이었던 것, 그 상태에서 -546 schema 결함을 놓친 것까지 정확합니다.

제 잡이라 제가 반영했습니다. 제안하신 그대로 postgres:16-alpine service + GABOLLE_TEST_DB_URL 등 + 건너뜀 검사(skipped 합 0 아니면 exit 1)를 넣었습니다.

MR !117 (back/dev): https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/117

지금 파이프라인 돌고 있습니다 — 진짜 PostgreSQL로 137개 전부 실행되는지 확인되면 머지하겠습니다. GABOLLE_DB_SCHEMA 건은 말씀하신 대로 이번엔 빼고 후속으로 남겨둡니다.

DB 테스트를 혼자 손으로 돌리고 계셨던 것 — 이제 CI가 매 MR마다 대신합니다. 잡아주셔서 감사합니다.
