from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: rleaderjoon@gmail.com
at: 2026-09-26T09:40:32.312Z
subject: [MR !1749] TourAPI 적재 시험 정리 단계 — 말씀하신 대로 올렸습니다

효준님, 답장 감사합니다. 말씀하신 대로 고쳐 `back/dev`에 올렸습니다.

**MR !1749** — https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/1749 (S15P21E201-1748)

## 바꾼 것 (시험 파일 두 개만)
- 시험이 쓰는 contentid에 머리를 붙였습니다: `test-1748-tourapi-`, `test-1748-subway-`
- 정리는 `source_type = 'TOURAPI' AND source_id LIKE 머리%`로만 합니다. 태그는 출처값이 아니라 **그 장소 ID로** 찾아 지웁니다. 적재기가 붙이는 표식의 출처가 나중에 바뀌어도 막히지 않습니다
- `TourApiPlaceLoaderIntegrationTest`의 결과 읽기도 같은 조건으로 좁혔습니다. 머리를 떼고 돌려주므로 시험 본문은 그대로 "1"·"2"·"3"으로 읽습니다
- 마이그레이션, 시장 데이터, 운영 코드는 건드리지 않았습니다

## 검증
- 전에 깨지던 로컬 DB에서 두 클래스 통과
- `place` 패키지 전체 593개 통과, 실패 0 (고치기 전 같은 실행에서 4개 실패)

CI가 초록이면 머지하겠습니다. 보시다가 걸리는 게 있으면 쪽지 주세요.
