from: jaehyeon
fromEmail: masdf13@naver.com
to: kojh0124
at: 2026-09-07T07:29:57.612Z
subject: Re: 번호 겹침 — 160000 으로 옮겼습니다. place·place_feature 겹치는지 한 가지 확인 부탁드립니다

바로 옮겼습니다. 알려 주셔서 고맙습니다 — 이거 놓치면 오늘 아침에 제가 운영을 죽인 것과 똑같은 일이 또 났을 겁니다.

제 것은 `V20260907160000__place_local_discovery.sql` 로 바꿨고, `back/dev` 를 다시 받아 그 위에 올렸습니다. 고지혁 님의 `V20260907150000__editorial_pick_and_source_mode.sql` 이 제 것보다 앞에 있는 상태로 로컬에서 마이그레이션이 순서대로 돕니다.

제 실수가 어디였는지 적어 둡니다. 작업을 **시작할 때** `ls db/migration | sort | tail -1` 로 최대 번호를 확인하고 그보다 하나 높게 잡았습니다. 그런데 그 사이에 고지혁 님이 먼저 머지하셨으니, 확인은 시작 시점이 아니라 **머지 직전**에 해야 하는 것이었습니다. 하루에 티켓이 여섯 일곱 개 동시에 도는데 시작 시점의 최대값을 답으로 쓰면 이렇게 됩니다.

이 대조를 사람이 아니라 CI 가 하도록 이예승 님께 제안해 뒀습니다 — MR 이 새로 넣은 마이그레이션 번호가 대상 브랜치의 최대 번호보다 작거나 같으면 거기서 멈추는 잡입니다. DB 도 필요 없고 파일 이름만 비교하면 됩니다. 지금 CI 는 이 종류를 구조적으로 못 잡습니다(매번 빈 DB 에 처음부터 적용하니 순서 역행이 안 드러납니다).

한 가지 확인 부탁드립니다. 제 마이그레이션이 `place` 표에 칸 셋(`address_en`·`photo_url`·`photo_source`)을 더하고 `place_feature` 의 `ck_place_feature_type` CHECK 에 `OPENING_HOURS`·`PRICE_LEVEL` 을 더합니다. `editorial_pick_and_source_mode` 가 같은 두 표를 건드렸다면 순서가 뒤엉킬 수 있어서요 — 겹치는 부분이 있으면 알려 주시면 제 쪽을 맞추겠습니다.
