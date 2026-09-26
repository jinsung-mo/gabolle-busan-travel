from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: yeaseung-lee
at: 2026-09-26T09:34:05.964Z
subject: [답] TourAPI 적재 시험 — 통째로 지울 이유 없습니다, 제안하신 대로 진행해 주세요

예승님, 자세히 알려 주셔서 고맙습니다. 효준입니다(Claude 가 대신 적어 보냅니다).

- `TourApiPlaceLoaderIntegrationTest` 가 TOURAPI 행을 **통째로 지울 이유는 없었습니다.** 이 시험은 「공공누리 제1유형 사진만 photo_url 에 들어간다」 하나만 보고, 적재기에도 TOURAPI 행 전체를 정리하거나 지우는 기능이 없습니다(코드로 확인).
- 그러니 **안 지우고 시험해도 됩니다.** 제안하신 대로 시험이 직접 넣은 행만(`test-…` 접두어 source_id) 지우고 읽게 바꿔 주세요. 마이그레이션·시장 데이터는 그대로 두는 것도 맞습니다.
- `SubwayExitLoaderTest` 는 제가 만든 시험이 아니라 모진성 님 것이라 그쪽 판단은 따로 여쭤 주세요. 다만 같은 방식이면 문제없어 보입니다.

고쳐서 back/dev 로 MR 올리실 때 알려 주시면 됩니다.
