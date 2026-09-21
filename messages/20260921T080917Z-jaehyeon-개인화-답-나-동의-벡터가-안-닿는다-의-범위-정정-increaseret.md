from: jaehyeon
fromEmail: masdf13@naver.com
to: kojh0124
at: 2026-09-21T08:09:17.535Z
subject: [개인화 답] (나) 동의 · 「벡터가 안 닿는다」의 범위 정정 · increaseRetryCount 확인

(나) 동의합니다. 효준 님 확정에 이견 없고 1406 과 묶는 순서도 좋습니다.

## 한 가지만 범위를 좁혀 두는 게 좋겠습니다

코드에서 본 것은 이렇습니다. `applyTasteVectorComponent` 가 보는 것은 `dimension == CATEGORY` **이면서** `evidence != SURVEY` 인 행뿐입니다. 그런데 설문 답 자체는 `applyTagComponent(candidate, …, "CATEGORY", …)` 가 이미 채점하고 있습니다(`BaselineCandidateScorer:128`, ATMOSPHERE 131, FOOD_PREFERENCE 134).

그래서 「취향 벡터가 추천 점수에 한 번도 닿은 적이 없다」는 제목이 넓게 읽힙니다. 정확히는 **행동이 들어간 벡터 항이 한 번도 안 닿았다** 입니다. 님이 1406 주석에 적어 두신 구분이 그것이고요.

이게 (나) 의 설계에 그대로 걸립니다. `FOOD_PREFERENCE`·`LOCALITY`·`QUIETNESS` 를 이 항이 읽게 하면 `applyTagComponent` 와 같은 답을 두 번 세게 되니, 1406(SURVEY 제외)이 선택이 아니라 전제가 됩니다. 한 MR 로 묶으신 게 맞습니다.

## increaseRetryCount — 버그로 보지 않습니다

호출처 0 은 맞습니다(`RecommendationJob.java:404`). 다만 **그 값으로 분기하는 코드가 없습니다.** `getRetryCount()` 를 읽는 유일한 자리가 `RecommendationService.java:630` 의 이벤트 payload `retry_count` 한 칸입니다.

그리고 `RecommendationJobWorker.java:84` 에 「여기서 자동으로 다시 계산하지는 않는다」고 적혀 있어 자동 재시도 경로 자체가 없고, 실패는 `markFailed` 로 끝납니다. 셀 대상이 없는 계수기라 틀린 판단을 만드는 자리는 아니고, 재시도 분석이 영원히 0 이라는 것만 사실입니다. 재시도를 실제로 넣을 때 같이 붙이는 쪽을 권합니다.

미호출 목록을 「지울 후보」가 아니라 「프론트와 백엔드가 어긋난 자리」로 돌리신 것과, 추출기 한계를 스스로 드러내신 것 잘 봤습니다.
