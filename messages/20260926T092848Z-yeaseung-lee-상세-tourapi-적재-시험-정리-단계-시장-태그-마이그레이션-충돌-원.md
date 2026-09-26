from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: rleaderjoon@gmail.com
at: 2026-09-26T09:28:48.551Z
subject: [상세] TourAPI 적재 시험 정리 단계 ↔ 시장 태그 마이그레이션 충돌 — 원인·영향·고칠 방법 (앞 쪽지 보충)

효준님, 앞서 보낸 쪽지를 보충합니다. 다시 확인해 보니 처음 적은 것보다 사정이 조금 더 있어서 자세히 적습니다. 이 쪽지가 앞 쪽지를 대신합니다.

## 1. 한 줄 요약
두 적재 시험의 정리 단계가 **「TOURAPI 행을 통째로 지운다」**는 전제로 되어 있습니다. 9/18 시장 태그 마이그레이션이 그 전제를 깨서, 정리 단계가 외래키(다른 표가 이 행을 가리키고 있다는 연결)에 막힙니다. **운영 데이터와 앱에는 영향이 없습니다.** 시험 코드만의 문제입니다.

## 2. 어떤 시험이 깨지나
| 시험 | 작성 | 깨지는 시험 이름 |
|---|---|---|
| `place/TourApiPlaceLoaderIntegrationTest` | 효준님 (9/15, S15P21E201-146) | 🔴 Type1(공공누리 제1유형)만 photo_url 에 들어간다 |
| `place/loader/SubwayExitLoaderTest` | ahwlstjd57 (9/16, S15P21E201-479) | 이미 있는 장소에 지하철 출구를 붙인다 / 장소가 없으면 넘긴 수로 세어진다 |

오류 전문(2026-09-26, 로컬 Postgres):
```
StatementCallback; SQL [DELETE FROM place WHERE source_type = 'TOURAPI'];
ERROR: update or delete on table "place" violates foreign key constraint
"fk_place_feature_place" on table "place_feature"
세부 정보: Key (place_id)=(556b027d-e3c9-4417-a60b-001608608003) is still referenced from table "place_feature"
```
`556b027d-…-001608608003`은 **거제시장**입니다.

## 3. 왜 막히나 — 순서대로
1. 두 시험의 `@BeforeEach`·`@AfterEach` 정리 단계는 다음 두 줄입니다.
   ```sql
   DELETE FROM place_feature WHERE source_type = 'TOURAPI';
   DELETE FROM place WHERE source_type = 'TOURAPI';
   ```
2. **9/16 `V20260916240000__curated_city_markets.sql`**(S15P21E201-1004)이 「도시 탐험」 시장 등 **76곳을 `source_type = 'TOURAPI'`** 로 넣었습니다. 거제시장도 여기 들어 있습니다.
3. **9/18 `V20260918160000__market_cuisine_tag.sql`**(S15P21E201-1246)이 그중 시장 51곳에 `CUISINE_TAG / MARKET` 태그를 붙였습니다. 이 태그의 출처는 **`source_type = 'MANUAL'`**(사람이 확인한 VERIFIED)입니다.
4. 그래서 정리 첫 줄은 이 태그를 지우지 않습니다(출처가 TOURAPI가 아니라서). 둘째 줄에서 장소를 지우려 하면 **남아 있는 MANUAL 태그가 그 장소를 가리키고 있어** 외래키에 막힙니다.

## 4. 왜 CI는 통과하나 — 🔴 운일 수 있습니다
CI도 마이그레이션이 전부 적용된 DB에서 돌기 때문에 원래는 똑같이 깨져야 합니다. 통과하는 것은 **시험 순서 덕분**으로 보입니다. `dataquality/PlaceDataQualityServiceTest`가 `TRUNCATE place CASCADE`로 장소 표를 통째로 비우는데, 이것이 먼저 돌면 시장 행과 태그가 사라져 두 시험이 통과합니다. 순서가 바뀌면 CI에서도 깨질 수 있습니다. 로컬에서는 DB를 오래 써서 마이그레이션 데이터가 남아 있으니 항상 깨집니다.

## 5. 부작용이 하나 더 있습니다
정리 단계는 막히지 않을 때도 **팀 마이그레이션이 넣은 TOURAPI 정본 행 전부**를 지웁니다. 해안 산책로·도시 탐험 76곳·바다·자연 장소 등이 시험 DB에서 사라집니다. 그러면 뒤에 도는 다른 시험이 그 데이터를 믿고 있다가 순서에 따라 흔들립니다. 오늘 제가 명소 26곳 시험을 짤 때 비슷한 일을 겪었습니다(`TRUNCATE` 때문).

## 6. 고칠 방법 (제안)
두 시험 모두 **자기가 넣은 행만** 지우고 읽게 바꿉니다. 다른 적재 시험들이 이미 쓰는 방식입니다(`PlacePhotoLoaderIntegrationTest`는 `source_id LIKE PREFIX%`, `SamePlaceLoadIntegrationTest`는 `'t-1620-%'`).
- 시험이 쓰는 contentid: `SubwayExitLoaderTest`는 `5290001`·`999999`, `TourApiPlaceLoaderIntegrationTest`는 `1`·`2`·`3`
- 이것을 **`test-…` 접두어를 붙인 고유 값**으로 바꾸고, 정리는 `WHERE source_type = 'TOURAPI' AND source_id LIKE 'test-…%'`로 좁힙니다. 태그도 같은 조건으로 지웁니다
- `TourApiPlaceLoaderIntegrationTest`의 결과 읽기(`SELECT … FROM place WHERE source_type = 'TOURAPI'`)도 같은 조건으로 좁힙니다. 안 그러면 마이그레이션 행 76곳이 결과에 섞입니다
- **마이그레이션 두 개와 시장 데이터는 건드리지 않습니다.**

## 7. 여쭤볼 것
1. 두 시험이 TOURAPI 행 **전체**를 지워야 하는 이유가 있었나요? 예를 들어 적재기가 「TOURAPI 행 전체」를 대상으로 도는 기능을 시험하는 경우입니다. 그렇다면 방향을 바꾸겠습니다.
2. 효준님이 직접 고치시겠어요, 아니면 이쪽에서 고칠까요? 답이 없으면 이쪽에서 위 방법으로 고쳐 `back/dev`에 MR을 올리고, 머지 전에 한 번 더 알려 드리겠습니다.

급한 건은 아닙니다. 운영에 영향이 없고, 지금 CI도 초록입니다.
