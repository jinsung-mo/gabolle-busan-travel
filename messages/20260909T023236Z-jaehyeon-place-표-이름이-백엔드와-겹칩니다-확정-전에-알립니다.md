from: jaehyeon
fromEmail: masdf13@naver.com
to: janghyojoon
at: 2026-09-09T02:32:36.602Z
subject: place 표 이름이 백엔드와 겹칩니다 — 확정 전에 알립니다

조사 규모가 대단합니다. 확정 전이라고 하셔서 지금 알립니다 — **설계하신 `place` 표가 백엔드가 이미 쓰는 표와 이름이 같습니다.**

## 지금 서비스에 있는 표

`backend/src/main/resources/db/migration/V20260904000000__place_and_place_feature.sql` 로 운영 PostgreSQL 에 이미 올라가 있습니다. 지금 0행이지만 표는 있고, 추천 후보 조회가 이 표를 봅니다.

```
place            place_id · name_ko · name_en · category · address · lat · lng · created_at
place_feature    place_id 를 가리키며 특징 하나에 한 줄
                 feature_type · feature_key · value(JSONB)
                 evidence_status · source_type · source_id · observed_at · source_version
```

## 무엇이 부딪히나

**같은 데이터베이스면 이름이 정면으로 충돌합니다.** 마이그레이션이 `CREATE TABLE place` 를 다시 하려다 죽거나, 반대로 그쪽이 먼저 만들면 백엔드 마이그레이션이 죽습니다.

**다른 데이터베이스라도 문제가 남습니다.** 나중에 둘을 잇는 사람이 `place` 라는 이름을 보고 같은 것으로 착각합니다. 실제로 두 표는 담는 것이 다릅니다 — 그쪽은 좌표·인허가일·버틴 햇수, 이쪽은 서비스가 화면에 뿌리는 최소 정보입니다.

셋 중 하나로 정하면 될 것 같습니다. **(1)** 분석용 표에 접두사를 붙이거나 스키마를 나눈다. **(2)** 백엔드 표를 그대로 쓰고 거기에 채운다. **(3)** 이름은 두되 아예 다른 데이터베이스라는 것을 문서에 못 박는다. 저는 (1)이 제일 싸다고 봅니다.

## 그리고 `place_feature` 를 보실 만합니다

`place_truth` 와 `why_type` 으로 만들려는 것이, 이미 있는 `place_feature` 의 모양과 겹칩니다. 그 표는 **특징 하나에 한 줄**이고 출처·관측 시각·자료 판까지 같이 적게 돼 있습니다. 정답지 소속과 "왜 가는지" 를 여기에 얹으면 추천 채점기가 **따로 잇는 코드 없이 바로 읽습니다.**

한 가지만 미리 알려 드립니다. 안전·접근성 계열 값(알레르기·식단·휠체어·계단)은 **추정으로 채우는 것을 데이터베이스가 막고 있습니다**(`ck_place_feature_safety_never_estimated`). 업종 이름이나 웹 문장에서 뽑은 값은 그 칸에 못 들어갑니다.

## 확인해 주실 것 하나

`bigData/research/data/results/` 를 `feat/bigData/S15P21E201-331-tourapi-hours` 에만 두셨다고 하셨는데, **사본이 없다면 그 자체가 위험**입니다. 브랜치는 실수로도 지워지고, 되살리려면 지운 사람의 로컬에 기록이 남아 있어야 합니다. MR 을 곧 여신다니 그걸로 해결되겠지만, 그전까지는 어디든 사본을 하나 더 두시는 편이 좋겠습니다.
