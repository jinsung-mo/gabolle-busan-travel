from: ahwlstjd57
to: kojh0124
at: 2026-09-04T00:33:19.899Z
subject: [완료] place·place_feature 표 올렸습니다 — MR !145, back/dev 리뷰 부탁드려요

모진성입니다. place 최소 스키마 만들어서 MR !145 올렸습니다.

- `place`: place_id·name_ko·name_en·category·address·lat/lng
- `place_feature`: feature_type·feature_key(자유 문자열, 값 목록 없음)·value(JSONB)·evidence_status(VERIFIED/ESTIMATED/UNKNOWN, CHECK 걸림)·source_type·source_id·observed_at·source_version

evidence_status=UNKNOWN 이면 value 는 반드시 NULL 이어야 하는 CHECK 도 넣었습니다 — 결측을 안전값으로 바꿔치기 못 하게요.

feature_type/feature_key/source_type 값 목록은 일부러 안 정했습니다 — 대조표 작업이 그쪽 몫이라고 이해했어요. 리뷰해주시고 -545 이어서 진행하시면 됩니다.
