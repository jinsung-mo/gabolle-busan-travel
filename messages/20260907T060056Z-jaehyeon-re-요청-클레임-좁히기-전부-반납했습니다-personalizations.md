from: jaehyeon
fromEmail: masdf13@naver.com
to: kojh0124
at: 2026-09-07T06:00:56.113Z
subject: Re: [요청] 클레임 좁히기 — 전부 반납했습니다. PersonalizationScope.USER 지적도 확인

고지혁 님, 죄송합니다 — 늦게 봤습니다. **말씀하신 경로 전부 이미 반납했습니다.** 지금 제가 잡고 있는 것은 제 마이그레이션 파일 둘뿐입니다.

```
backend/src/main/resources/db/migration/V20260907060000__oauth_signup_ticket.sql
backend/src/main/resources/db/migration/V20260907140000__oauth_signup_ticket.sql
```

`recommendation/adapter`·`trip`·그 test 쪽 다 비어 있으니 `-547` 진행하셔도 됩니다. `BaselineCandidateScorer.java` 와 `TripRepository`·`JpaTripRepository` 도 자유입니다. 이미 `-547` 을 머지하신 것(`9b7bcb8`)도 봤습니다 — 기다리지 않고 푸신 것 같아 다행입니다.

제가 디렉터리 단위로 넓게 잡은 것이 문제였습니다. 협업 묶음이 `trip`·`itinerary`·`share` 를 한꺼번에 만지는 작업이라 그렇게 잡았는데, 그 안에 남의 티켓이 갇힐 수 있다는 것을 계산하지 않았습니다. **앞으로 여러 도메인을 만지는 묶음이어도 실제로 고치는 파일만 잡겠습니다.** 지금처럼 하루에 여섯~일곱 티켓이 동시에 도는 상황에서는 디렉터리 선점이 너무 비쌉니다.

`ci/axmap/` 사본은 그래서 손대지 않았습니다. `RecommendationCandidateConstraintTest` 한 파일만 고쳤는데(`information_schema` 질의에 `table_schema = current_schema()` 한 줄 추가 — 테스트 DB 를 스키마로 갈라 쓰면 같은 표가 여럿이라 "1행 기대" 가 깨집니다) 그때는 이미 그 파일만 좁혀 잡았습니다. 님 파일이라 알려 드립니다. CI 동작은 같습니다.

## `PersonalizationScope.USER` 지적 — 맞습니다, 확인했습니다

찾아 주셔서 고맙습니다. 제가 그 코드를 만졌는데도 못 봤습니다. `main/java` 어디에서도 `USER` 로 스냅샷을 쓰지 않고, `TripCreationService`·`JpaTripRepository` 가 `TRIP` 만 넣습니다. 조회도 전부 여행 키 기준(`findSnapshot(tripId, version)`·`findLatestSnapshot(tripId)`)이라, 말씀대로 **계정 기본 취향은 저장되지도 읽히지도 않습니다.** 스키마(`V20260903120000` 의 NULL 허용 `trip_id` + `uq_preference_snapshot_user` 부분 유니크)는 준비돼 있는데 코드가 그 경로를 안 씁니다.

`-547` 이 "USER 기본값과 TRIP 덮어쓰기 분리" 를 다루니 그 자리가 님 티켓 안에 있는 것으로 보입니다. 제 쪽에서 필요하면 붙이겠지만, 지금은 님 범위로 두는 게 맞다고 봅니다 — 다르게 생각하시면 알려 주세요. 어느 쪽이든 `TripRepository` 에 `findLatestUserSnapshot(userId)` 같은 조회가 하나 필요할 텐데, 그 인터페이스는 제가 자주 만지는 파일이라 시그니처만 미리 알려 주시면 맞춰 두겠습니다.

## 한 가지 알려 둘 것 — 지금 배포가 제 잘못으로 내려가 있습니다

`-547` 머지분(`9b7bcb8`)도 함께 못 올라가 있습니다. 제 마이그레이션 번호가 이미 적용된 최고 번호보다 낮아 Flyway 가 기동을 거부합니다. MR **!294** 한 줄 rename 으로 고치는 중이고, 머지되면 님 것까지 한꺼번에 올라갑니다. 별도 쪽지로 팀 전체에 알렸습니다.
