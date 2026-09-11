from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-11T01:55:28.583Z
subject: [MR !588] 검토 부탁드립니다 — TourAPI 수집기가 한도에 걸려도 받은 것을 잃지 않게 (파이프라인 초록)

**`fix/bigData/S15P21E201-331-tourapi-resume` → `bigData/dev`**
https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/588

| | |
|---|---|
| 파이프라인 | 🟢 **success** |
| 충돌 | 없음 |
| 바뀐 파일 | `bigData/collect/tourapi.mjs` **하나** |

## 왜 급한가 — 이게 머지돼야 다음 수집이 안전합니다

오늘 TourAPI 상세 **330건을 받아 놓고 일일 한도에 걸렸는데 한 건도 안 남았습니다.** 모아 뒀다가 맨 끝에 한 번 저장하는 구조라, 그 "맨 끝" 에 닿기 전에 끊긴 것입니다.

**지금 이 상태로 누가 다시 돌리면 그 사람의 하루 할당량도 똑같이 날아갑니다.** 재현 님께 수집을 부탁드린 상태라 더 그렇습니다.

## 고친 것 둘 (+ 하나)

| | 무엇 | 왜 |
|---|---|---|
| 1 | **받는 족족 파일에 덧붙인다** | 끊겨도 남습니다. NDJSON 은 한 줄이 한 응답이라 덧붙이기가 안전합니다 |
| 2 | **`--resume`** | *"무엇을 물었나"* 를 열쇠로 캐시를 만듭니다. 같은 질문이면 **네트워크를 안 탑니다** |
| 3 | **종료 코드 3 = 일일 한도** | 2(사람이 고쳐야 함)와 가릅니다. 안 가르면 **CI 가 한도 초과에 재시도를 돌려 다음 날 할당량까지 태웁니다** |

한도는 **HTTP 429** 로도 오고 **HTTP 200 에 본문으로만** 오기도 해서 둘 다 봅니다. 문구는 바뀔 수 있어도 `returnReasonCode` **22** 는 규격 값이라 그쪽도 같이 봅니다.

## 🔴 리뷰하실 때 봐 주셨으면 하는 곳

**비동기 구간에서 `process.exit()` 를 안 부르는 부분**입니다. 요청이 떠 있는 채로 부르면 Windows 의 Node 가 죽습니다 —

```
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 94
→ 종료 코드 127
```

그러면 애써 갈라 놓은 3·2 가 **통째로 무의미해집니다.** 고치다 실제로 걸려서, 던져서 빠져나온 뒤 `process.exitCode` 만 적게 바꿨습니다. **다른 수집기에도 같은 함정이 있습니다.**

## 실측 (한도가 걸린 상태에서 그대로 돌렸습니다)

```
node collect/tourapi.mjs            → 종료 3 · 목록 656곳 11줄이 파일에 남음
node collect/tourapi.mjs --resume   → 종료 3 · 11줄 재사용, 목록 호출 0회
node collect/tourapi.mjs --dry-run  → 종료 0
Assertion 오류                       → 0건
```

## 곁들여 — 알아 두실 것 둘

1. **한도는 오퍼레이션마다 따로 걸립니다.** 오늘 목록(`areaBasedList2`)은 멀쩡했고 상세(`detailIntro2`)만 막혔습니다
2. 🔴 **수집기 머리말의 "일일 한도 10,000" 이 실측과 안 맞습니다.** 340회쯤에서 막혔습니다. 문서가 낡았는지, 개발계정 한도가 작은지, 오늘 이미 썼는지 **확인 못 했습니다.** 이 MR 에서는 안 건드렸습니다

무장애 수집기(`tourapi-barrier-free.mjs`)에 같은 흠이 있어서 **별도 MR 로 이어서 올립니다.**

— 장효준
