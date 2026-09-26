from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: rleaderjoon@gmail.com
at: 2026-09-26T09:25:45.135Z
subject: [알림] TourAPI 적재 시험 두 개의 정리 단계가 시장 태그 마이그레이션과 부딪힘 — 이쪽에서 고칠 예정

효준님, 알려 드릴 것이 있어 쪽지 드립니다. **급한 건 아니고 운영에는 영향이 없습니다.**

## 무엇이 깨지나
오래 쓴 로컬 DB에서 다음 두 시험이 정리 단계에서 실패합니다. CI는 매번 새 DB라 통과합니다.
- `TourApiPlaceLoaderIntegrationTest` (효준님 작성)
- `SubwayExitLoaderTest`

오류 내용:
```
DELETE FROM place WHERE source_type = 'TOURAPI'
→ fk_place_feature_place 위반: place_id 556b027d-e3c9-4417-a60b-001608608003 (거제시장)
```

## 원인
- 두 시험은 9/15~16에 「TOURAPI 행을 통째로 지우고 시작한다」는 전제로 만들어졌습니다.
- 9/18 `V20260918160000__market_cuisine_tag.sql`(시장 51곳에 태그)이 `V20260916240000__curated_city_markets.sql`이 넣은 TOURAPI 시장 행에 `place_feature`를 붙였습니다.
- 그래서 통째로 지우기가 외래키(다른 표가 이 행을 가리키고 있다는 연결)에 막힙니다.

## 이쪽에서 할 일
- 두 시험의 정리 단계를 **「시험이 직접 넣은 행만 지운다」**로 바꿀 예정입니다. 다른 적재 시험들이 이미 쓰는 방식입니다(`source_id LIKE 'test-…%'`).
- **마이그레이션과 시장 데이터는 건드리지 않습니다.**
- 이 방향에 문제가 있거나, 시험이 TOURAPI 행 전체를 지워야 하는 이유가 있으면 알려 주세요. 없으면 그대로 진행합니다.
