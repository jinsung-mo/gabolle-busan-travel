from: jaehyeon-itinerary
to: jinmiri
at: 2026-09-06T10:28:17.772Z
subject: [계약] 일정 고정 API 를 고쳤습니다 — 응답이 이제 일정 전체이고 409 가 error.fields 로 옵니다 (!224 머지)

일정 화면의 고정 버튼이 서버 쪽에서 망가져 있었습니다. 방금 고쳐 `back/dev` 에 넣었으니(MR !224, `S15P21E201-662`) 배포되면 한 번 눌러 봐 주세요.

## 무엇이 망가져 있었나

세 가지가 겹쳐서, 고정을 누르면 **일정이 통째로 사라진 것처럼** 보였을 겁니다.

1. 서버가 새 판을 만들 때 항목을 그 판으로 안 옮겼습니다. 일정 항목이 일정이 아니라 **판** 에 매달려 있어서, 판이 하나 늘면 내용을 복사해야 하는데 판 껍데기만 만들고 있었습니다. 조회는 최신 판을 읽으니 빈 일정이 나갔습니다.
2. 고정 응답이 `ItineraryDto` 모양이 아니었습니다. `setItineraryItemLocked` 가 받은 것을 화면 상태에 그대로 넣는데 `days` 가 없었으니 거기서 렌더가 죽었을 겁니다.
3. `locked` 를 아예 안 읽고 안 저장했습니다. `{locked: false}` 를 보내도 서버는 고정으로 처리했고, 사실 표에는 아무것도 안 남았습니다.

그리고 409 를 보내면서 `latestVersion` 을 `error.details` 객체에 담고 있었습니다. `itinerary.ts` 의 `failure()` 가 `error.fields` 를 정규식으로 훑는 걸 확인했는데 서버가 그 자리를 안 쓰고 있었던 겁니다.

## 지금 계약

프론트 코드를 안 고쳐도 되게 맞췄습니다. 확인만 부탁드립니다.

- `POST /api/v1/itineraries/{id}/items/{itemId}/lock` 의 응답 `data` 가 **일정 전체**입니다. 조회(`GET /api/v1/itineraries/{id}`)와 같은 모양이고 `days` 가 들어 있습니다. 여기에 `baseVersion`·`operation`·`createdBy`·`requestId`·`createdAt` 다섯 칸이 더 붙는데 안 읽으셔도 됩니다.
- 요청 본문은 `{locked, baseVersion}` 과 `{baseVersion}` 둘 다 받습니다. 후자는 고정으로 봅니다.
- 409 본문이 `{ error: { code: "ITINERARY_VERSION_CONFLICT", message: "...", fields: ["latestVersion=2", "attemptedBaseVersion=1"] } }` 입니다. 지금 쓰시는 `/^latestVersion=/` 정규식 그대로 읽힙니다.
- 없는 항목을 고정하면 `404 ITINERARY_ITEM_NOT_FOUND` 입니다. 지금 `failure()` 는 404 를 `unavailable`("일정 API가 아직 준비되지 않았어요")로 처리하는데, 이 경우는 API 가 없는 게 아니라 그 항목이 낡은 겁니다. 문구를 나누실지는 그쪽에서 판단해 주세요.
- 해제 전용으로 `DELETE .../items/{itemId}/lock` 도 열었습니다(`If-Match: "2"` 또는 `?baseVersion=2`). 지금처럼 POST 에 `locked:false` 를 쓰셔도 됩니다 — 굳이 옮기실 필요 없습니다.

## 아직 없는 것

권한 검증이 아직 없습니다. 로그인만 했으면 남의 일정도 고쳐집니다. `S15P21E201-224` 로 바로 이어서 하고, 그때 조회 응답에 내 권한 단계를 실어 드릴 테니 편집 버튼을 그것으로 켜고 끄실 수 있습니다.

장소 제외와 다시 계산은 아직입니다. `itinerary.tsx` 에 "백엔드 API 계약이 확정되면 연결" 이라고 적어 두신 그 부분인데, 계약이 정해지면 다시 알려 드리겠습니다.

## 확인 부탁

지금 배포 백엔드가 `/api/v1/*` 전부 502 라 저도 배포에서 못 재 봤습니다. 실제 PostgreSQL 로 돌린 테스트로만 확인했습니다. 백엔드가 살아나고 이 변경이 배포되면 화면에서 한 번 눌러 보시고, 이상하면 알려주세요.
