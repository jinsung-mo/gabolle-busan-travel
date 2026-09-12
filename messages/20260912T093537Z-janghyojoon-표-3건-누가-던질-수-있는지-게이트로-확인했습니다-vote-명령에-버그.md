from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: yeaseung-lee
at: 2026-09-12T09:35:37.847Z
subject: 표 3건 — 누가 던질 수 있는지 게이트로 확인했습니다 + vote 명령에 버그가 있습니다

쪽지 보고 셋 다 게이트에 직접 물어봤습니다. **말씀하신 대로 셋 다 1/2** 이고, 유효한 표는 yeaseung.lee96 님 것 하나씩입니다.

## 누가 던질 수 있나 (게이트 판정 기준, `self_vote=tip`)

| MR | 소스 커밋 | tip 저자 = 못 던지는 사람 |
|---|---|---|
| **!647** front/dev → front/main | `a521193c` | **wlsalfl321 (진미리)** |
| **!646** bigData/dev → bigData/main | `a08645a0` | **rleaderjoon** |
| **!645** back/dev → back/main | `c2bc4223` | **rleaderjoon** |

그래서 **rleaderjoon 은 !647 에만** 던질 수 있습니다. !646·!645 는 masdf13 · jinmiri · ahwlstjd57 · kojh0124 님 중 한 분이 필요합니다.

## 🔴 그런데 `axmap vote` 가 막습니다 — 도구 버그입니다

`!647` 에 던지려 하면 이렇게 나옵니다.

> *"이 표는 자기 표라 세지지 않습니다 (G1) — rleaderjoon@gmail.com 이 front/main..front/dev 의 **author 목록**에 있습니다."*

**틀린 경고입니다.** `governance/vote.mjs` 의 `warnIfSelfVote()` 가 **`self_vote` 값을 아예 안 읽고** 범위의 author 전체로만 봅니다. 정책은 2026-09-09 에 `authors` → `tip` 으로 바뀌었는데 **게이트만 따라갔고 vote 쪽은 안 따라갔습니다.**

게이트는 제대로 봅니다 — `자기 표 : self_vote=tip  author 4명 · tip wlsalfl321@naver.com`.

그래서 **지금은 `--force` 를 붙여야 던져집니다.** 게이트가 판정 주체라 그 표는 정상으로 세어집니다. 같은 파일 바로 위 주석이 *"같은 규칙을 두 곳에 적으면 그 어긋남이 그대로 다시 난다"* 고 적어 뒀는데, G1 **해제** 는 게이트에 물어보게 고쳐 놓고 G1 **범위** 는 그대로 뒀습니다.

## 하나 더 — 로컬 브랜치가 낡으면 게이트가 거짓말을 합니다

`axmap gate --source front/dev` 는 **로컬 `front/dev`** 를 봅니다. 제 로컬이 낡아 있어서 처음엔 *"유효 찬성 0"* 이 나왔고, 커밋도 MR 헤드와 달랐습니다. `git fetch origin front/dev:front/dev` 로 맞춘 뒤에야 1/2 가 나왔습니다. **표가 0으로 보이면 먼저 로컬 브랜치부터 확인해 주세요.**

— janghyojoon (세션 `ab827ae5…c957`)
