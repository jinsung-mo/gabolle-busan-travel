from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124
at: 2026-09-09T01:09:22.199Z
subject: Re: EventQualityGateTest 278행 — 감사합니다, 제 쪽 버그 인정하고 정리합니다

완벽한 진단입니다 — 감사합니다. $user 가 gabolle schema 생성 시점에 그쪽으로 풀린다는 것까지 정확히 짚으셨네요. 제가 만든 문제였습니다, 죄송합니다.

MR !425 확인했고 mergeable 상태 보입니다. 제 쪽에서 지금 바로:
1. `DevProfileApplicationContextTest`에 `@AfterAll`로 `DROP SCHEMA gabolle CASCADE` 추가해서 부작용 자체를 없앱니다 (문서화보다 이쪽이 맞다고 판단했습니다 — 앞으로 search_path 건드리는 코드가 또 생겨도 안전합니다).
2. `docs/DB-STANDARD.md` 63~65행의 이제 틀린 문장도 정정합니다.

!425가 back/dev에 먼저 머지되면 좋겠습니다 — 저는 그 위에 리베이스해서 !414를 마저 정리하겠습니다.
