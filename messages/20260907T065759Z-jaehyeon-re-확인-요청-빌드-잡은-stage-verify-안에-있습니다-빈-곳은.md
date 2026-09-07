from: jaehyeon
fromEmail: masdf13@naver.com
to: yeaseung-lee
at: 2026-09-07T06:57:59.231Z
subject: Re: [확인 요청] 빌드 잡은 stage: verify 안에 있습니다 — 빈 곳은 back/main·main 쪽입니다

늦게 답합니다. `-680` 은 이미 이어가신 것으로 보이는데(`backend:dependency-scan` 이 `back/dev` 에 들어와 있습니다), 원래 물어보신 것에 실측으로 답을 남겨 둡니다.

## 빌드 잡은 있습니다 — 단계 이름에 가려져 있었습니다

`stages: [verify, release]` 만 보시면 빌드 단계가 없어 보이는 게 맞습니다. 그런데 `backend:build` 는 **`stage: verify` 안에** 들어 있습니다. 단계 이름이 `build` 가 아니라 `verify` 라서 그렇습니다. 단계 목록이 아니라 잡 이름을 봐야 합니다.

브랜치별로 실제로 있는 것을 세어 봤습니다.

| 브랜치 | 빌드·테스트 잡 |
|---|---|
| `back/dev` | `backend:build` (`./gradlew build` + 건너뛴 테스트 0건 검사) · `backend:dependency-scan` |
| `front/dev` | `frontend:build` · `frontend:smoke` · `frontend:dependency-scan` |
| `back/main` | 없음 |
| `main` | 없음 |
| `bigData/dev` | 없음 (`verify:bigdata` 만) |

`backend:build` 가 도는 조건은 `merge_request_event` 이면서 `backend/**` 가 바뀐 경우입니다. 브랜치에 push 만 하면 안 돕니다. 그래서 파이프라인 목록을 push 쪽에서 보시면 axMap 잡만 보입니다 — 아마 그걸 보신 게 아닐까 싶습니다.

## 걱정하신 구간은 실재합니다. 다만 지금이 아니라 위쪽입니다

"이대로면 머지되는 코드가 빌드조차 안 되는 걸 아무도 못 잡는다" — 지금 백엔드 MR 은 전부 `back/dev` 로 가고, 그건 `backend:build` 를 지납니다. 그 구간은 막혀 있습니다.

빈 곳은 사다리 위쪽입니다. `back/main` 과 `main` 의 설정에는 빌드 잡이 아예 없어서, `back/main → main` 승격 MR 은 빌드를 한 번도 안 합니다. 확인해 보니 **`back/main` 을 대상으로 머지된 MR 이 아직 하나도 없습니다** — 백엔드는 `back/dev` 위로 올라간 적이 없어서 이 구멍이 아직 안 물린 겁니다. 첫 승격을 할 때 물립니다.

## 오늘 장애가 여기에 걸립니다 — 다른 종류의 빈 곳입니다

제 마이그레이션 번호 충돌로 운영이 죽었던 건(`!294`) `backend:build` 를 **초록으로 통과했습니다.** 잡이 없어서가 아닙니다. CI 는 매번 빈 DB 를 만들고 마이그레이션을 처음부터 적용하는데, 번호 순서 충돌은 **이미 더 큰 번호가 적용된 DB** 에서만 드러납니다. 그러니 빌드 잡을 어디에 더 걸어도 이 종류는 안 잡힙니다.

그래서 잡 하나를 제안드립니다. MR 이 새로 추가한 마이그레이션 파일의 번호가 **대상 브랜치에 이미 있는 최대 번호보다 작으면** 거기서 멈추는 검사입니다. DB 도 필요 없고 파일 이름만 비교하면 됩니다. 제가 만들까요, 아니면 CI 쪽은 이예승 님이 보시는 게 맞을까요? 배포 구조 쪽 제안(`docker stop` 을 새 컨테이너가 건강해진 뒤로 미루는 것)도 아직 답을 못 받았는데, 두 건 다 이예승 님 몫이면 제가 티켓만 만들어 두겠습니다.
