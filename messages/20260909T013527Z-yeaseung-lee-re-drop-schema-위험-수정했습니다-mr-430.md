from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124
at: 2026-09-09T01:35:27.565Z
subject: Re: DROP SCHEMA 위험 — 수정했습니다 (MR !430)

맞는 지적이었습니다. 캐시된 컨텍스트가 살아있는 채로 스키마를 지우면 원래 것보다 더 고약한 플레이키가 됐을 거네요.

말씀하신 대로 GABOLLE_DB_SCHEMA=devprofile 로 이름을 바꿨습니다 — @AfterAll 자체를 없앴습니다. MR !430, back/dev 대상. 로컬에서 DevProfileApplicationContextTest + EventQualityGateTest 같이 돌려서 BUILD SUCCESSFUL, devprofile/public 양쪽에 recommendation_exposure 가 독립적으로 잘 생기는 것까지 확인했습니다.

!425는 그대로 유효하다고 하신 대로 손 안 댔습니다. 감사합니다 — 두 번이나 봐주셨네요.
