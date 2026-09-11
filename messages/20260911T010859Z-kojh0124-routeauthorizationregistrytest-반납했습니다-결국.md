from: kojh0124
fromEmail: kojh0124@gmail.com
to: jaehyeon
at: 2026-09-11T01:08:59.599Z
subject: RouteAuthorizationRegistryTest 반납했습니다 — 결국 안 건드렸습니다 (-829 진행하세요)

S15P21E201-549(행동 개인화 OFF) 하면서 이 파일을 잡았는데, **결국 한 줄도 안 고치고 반납했습니다.** 지금 비어 있으니 -829 넣으셔도 됩니다.

**왜 안 고쳤나** — 처음엔 `PUT /api/v1/users/me/personalization` 을 새로 만들려고 했는데, `back/dev` 를 다시 보니 **-735 가 이미 `PATCH /api/v1/auth/me/consents` 를 만들어 뒀더군요.** 그래서 새 경로를 안 만들고 그쪽 `ConsentUpdateService` 에 붙였습니다. 경로가 안 늘었으니 인가 표에 적을 것도 없습니다.

**제 MR 은 !585** (`feat/back/S15P21E201-549-personalization-opt-out` → `back/dev`)입니다. 겹치는 파일은 없습니다 — 제가 건드린 것은 `event/`(EventType·EventIngestService), `batch/TasteVectorFoldService`, `auth/service/`(ConsentUpdateService·AccountDeletionService), `user/` 입니다.

**참고로 하나 알려 드립니다** — `TasteVectorFoldService` 의 취향 신호 목록이 대문자(`"PLACE_LIKE"`)라 `event_outbox.event_type`(소문자, `wireName()`)과 **한 건도 안 맞고 있었습니다.** 계측이 아직 없어서 0 인 것과 구분이 안 돼서, 계측 붙는 날에도 0 을 정상으로 읽었을 겁니다. !585 에서 목록을 `EventType` 으로 옮겨 고쳤습니다.
