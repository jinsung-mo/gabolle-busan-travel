from: jaehyeon
to: all
at: 2026-09-06T13:48:18.134Z
subject: [BE] 일정 편집 API 넷 머지 — 제외·하루 재계산·되돌리기·판 목록 (MR !229 · !230)

박재현입니다. 오늘 밤 `back/dev`에 일정 편집 API 넷이 들어갔습니다. 앱이 붙일 때 필요한 것만 적습니다. 자세한 근거는 MR !229·!230 본문에 있습니다.

## 경로 넷

| 무엇 | 경로 | 본문 | 응답 |
| --- | --- | --- | --- |
| 장소 빼기 (ITN-08) | `POST /api/v1/itineraries/{id}/items/{itemId}/remove` | `{ "baseVersion": 3, "operationalReason": "선택" }` | 202 + `data.jobId` |
| 하루 다시 계산 (ITN-09) | `POST /api/v1/itineraries/{id}/recalculate` | `{ "baseVersion": 3, "dayIndex": 0 }` 또는 `{ "baseVersion": 3, "fromItemId": "<item.id>" }` | 202 + `data.jobId` |
| 되돌리기 | `POST /api/v1/itineraries/{id}/revert` | `{ "baseVersion": 3 }` (선택 `"toVersion": 1`) | 201, 고정 응답과 같은 모양(일정 전체 + 판 정보). 끝에 `revertedFromVersion` |
| 판 목록 (ITN-02) | `GET /api/v1/itineraries/{id}/versions` | | 200, 최신 판부터 `[{version, baseVersion, operation, createdBy, createdAt, requestId, warningCodes, revertedFromVersion}]` |

## 앱이 알아야 할 것

- 넷 다 `baseVersion`이 필수입니다. 지금 화면에 있는 `version`을 그대로 보내면 됩니다. 낡으면 409이고 `error.fields`에 `latestVersion=N`이 옵니다 — 고정과 같은 모양이라 지금 있는 충돌 배너 코드가 그대로 읽습니다.
- 빼기·다시 계산은 비동기입니다. `GET /api/v1/jobs/{jobId}`를 폴링해서 `SUCCEEDED`면 `itineraryVersion`에 새 판 번호가 오고, 그 판을 `GET /api/v1/itineraries/{id}`로 다시 읽으면 됩니다. `FAILED`이고 `failure.code`가 `ITINERARY_VERSION_CONFLICT`면 "계산하는 사이 다른 편집이 들어갔다"는 뜻이라 최신 일정을 다시 불러와 다시 요청하면 됩니다. 서버가 자동으로 합치지 않습니다.
- 뺀 뒤 넣을 후보가 없으면 그 자리를 비운 채 성공합니다. 그 사실은 판 경고 `RECALC_NO_CANDIDATE`로 남는데, **지금은 `GET /versions`의 `warningCodes`에만 보이고 일정 상세 응답에는 아직 안 실립니다.** 다음 MR에서 상세 응답에도 넣겠습니다.
- 다시 계산하면 그 날 시각을 항목 수로 다시 나눕니다. 고정한 장소도 시각이 움직일 수 있고, 그때 `RECALC_TIMES_RESHUFFLED` 경고가 붙습니다. 고정은 "그 장소를 그대로 둔다"이고 시각 고정은 M2입니다.
- 되돌리기는 `toVersion` 없이 부르면 마지막 편집 직전으로 갑니다. 한 번 더 누르면 되돌리기 직전(= 다시 실행)으로 갑니다. 편집한 적 없는 일정에서 누르면 422 `ITINERARY_NOTHING_TO_REVERT`가 오고 판은 안 늘어납니다 — 버튼을 비활성화하려면 `GET /versions` 길이가 1인지 보면 됩니다.
- `/revert` 경로는 명세 3.5에 없어서 제가 정했습니다. 앱 쪽에서 다른 모양이 편하면 지금 말해 주세요. 붙기 전이 바꾸기 쉽습니다.

배포에는 자동으로 나갔고 백엔드는 정상 응답(401) 확인했습니다. 다만 `place` 표가 비어 있어 실제 추천 후보는 아직 0건입니다.
