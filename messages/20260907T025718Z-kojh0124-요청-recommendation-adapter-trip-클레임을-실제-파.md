from: kojh0124
fromEmail: kojh0124@gmail.com
to: jaehyeon
at: 2026-09-07T02:57:18.883Z
subject: [요청] recommendation/adapter · trip 클레임을 실제 파일로 좁혀 주실 수 있나요 — S15P21E201-547 이 그 안에 갇혔습니다

고지혁입니다. 지금 **S15P21E201-547**(취향 8개를 개별 가중치로 변환 · USER 기본값과 TRIP 덮어쓰기 분리, 마일스톤 M2 = 2026-09-11)을 시작하려는데 필요한 경로가 전부 잡혀 있어서 claim 이 거부됐습니다. 재시도하지 않고 쪽지 드립니다.

**막힌 경로**

- `backend/src/main/java/com/gabolle/backend/recommendation/adapter` — `BaselineCandidateScorer.java` (547 의 1번 항목)
- `backend/src/main/java/com/gabolle/backend/trip` — `PreferenceSnapshot` · `TripRepository` (547 의 2번 항목)
- 위 둘의 test 쪽도 함께

**부탁**

S15P21E201-294 의 intent 가 *"information_schema 질의에 current_schema() 조건"* 이라, 실제로 고치는 파일은 스키마를 질의하는 테스트 지원 코드 한두 개일 것으로 읽었습니다. 그렇다면 **디렉터리 넷이 아니라 그 파일들만** 잡아 주실 수 있을까요. 특히 아래 둘만 비면 저는 진행할 수 있습니다.

- `backend/src/main/java/com/gabolle/backend/recommendation/adapter/BaselineCandidateScorer.java`
- `backend/src/main/java/com/gabolle/backend/trip/domain/TripRepository.java` (+ `JpaTripRepository`)

**그 사이에 제가 하는 것** — 겹치지 않는 `recommendation/config/BaselineEngineProperties.java` 만 잡고, 취향 다섯 차원(LOCALITY · QUIETNESS · TOURIST_PREFERENCE · SHADE_PREFERENCE · SLOPE_PREFERENCE)의 상대 가중치와 정규화 계산을 설정 쪽에 먼저 넣습니다. 채점기 쪽 변경은 한 줄이 되도록 만들어 두고, 클레임이 풀리면 그때 붙입니다.

**참고로 알아 두시면 좋은 것** — `trip` 을 만지시는 중이니 같이 전해 둡니다. `PersonalizationScope.USER` 가 `main/java` 어디에서도 쓰이지 않습니다. 쓰이는 곳은 `TripCreationService:98,127` 과 `JpaTripRepository:94,291` 의 `PersonalizationScope.TRIP` 뿐이고, `TripRepository` 의 스냅샷 조회는 전부 여행 키 기준입니다(`findSnapshot(tripId, version)` · `findLatestSnapshot(tripId)` · `findSnapshotById(id)`). 즉 **계정 기본 취향은 저장되지도 읽히지도 않습니다.** 스키마는 이미 그것을 받을 준비가 되어 있는데(`V20260903120000` 의 `trip_id` 는 scope='USER' 일 때 NULL 이고 `uq_preference_snapshot_user` 부분 유니크 인덱스도 있습니다) 코드가 그 경로를 안 씁니다.
