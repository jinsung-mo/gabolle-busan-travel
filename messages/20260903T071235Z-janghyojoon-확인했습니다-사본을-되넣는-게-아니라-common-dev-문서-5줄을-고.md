from: janghyojoon
to: ahwlstjd57
at: 2026-09-03T07:12:35.606Z
subject: 확인했습니다 — 사본을 되넣는 게 아니라 common/dev 문서 5줄을 고칩니다 (내일). /ax-watch 는 지금 시작하셔도 됩니다

장효준입니다. 쪽지 잘 받았습니다. 실측해서 확인했고, **결론이 조금 다릅니다.**

## 1. `common/dev` 에 `ci/axmap/` 이 없는 건 빠진 게 아닙니다

**일부러 걷어낸 것**입니다.

```
common/dev  setup.sh  2026-09-01
[S15P21E201-526] chore: [Common] 사본을 걷어내고 axMap 을 npm 으로 받는다
```

그 브랜치의 `setup.sh` 는 이미 이렇게 돕니다.

```bash
npx -y axmap-cli@latest init
npx -y axmap-cli@latest hook install
npx -y axmap-cli@latest doctor
```

`main` 의 `setup.sh` 는 2026-08-26 자로 아직 `node ci/axmap/bin/axmap.mjs` 를 부릅니다. 즉 **`common/dev` 가 6일 더 새것**이고, 맞춰야 할 쪽은 오히려 `main` 입니다. 사본을 되넣으면 방향이 거꾸로 갑니다.

## 2. 그런데 헛보신 게 아닙니다 — 문서가 안 따라갔습니다

`common/dev` 의 이사가 **절반만** 끝나 있습니다. 실행되는 것(`setup.sh`)은 npm 으로 갔는데 **문서는 아직 사본을 치라고 합니다.**

`common/dev` 의 `docs/HANDOVER.md` **269~271 · 641 줄**, 「검증 — 끝내기 전에 전부 통과해야 한다」 블록입니다.

```bash
node ci/verify-vendor.mjs             # ← 그 파일이 없다
node ci/axmap/bin/axmap.mjs doctor    # ← 그 폴더가 없다
node ci/axmap/tools/mr-target.mjs …   # ← 없다
node ci/axmap/governance/gate.mjs     # ← 없다
```

설명이 아니라 **사람이 그대로 치는 체크리스트**인데 네 줄이 전부 안 됩니다. `docs/CI.md` 403줄에도 한 줄 남아 있습니다. 그 브랜치에서 `setup.sh` 는 잘 돌아 다 된 줄 알았다가 문서대로 검증하려면 아무것도 안 되니, **거기서 막히신 게 맞습니다.** 알려주셔서 감사합니다.

## 3. 내일 고치겠습니다

**`common/dev` 의 문서 다섯 줄을 npx 형태로 바꿉니다.**

| 파일 | 줄 |
|---|---|
| `docs/HANDOVER.md` | 269 · 270 · 271 · 641 |
| `docs/CI.md` | 403 |

`ci/axmap/` 사본을 되넣지는 않습니다.

## 4. 🔴 그래서 `/ax-watch` 는 **지금 시작하셔도 됩니다**

기다리실 필요 없습니다. 내일 고칠 것은 **문서뿐**이고 도구는 이미 npm 으로 돕니다. 슬래시 명령 안에서 이렇게 부르시면 `common/dev` 에서 그대로 동작합니다.

```bash
npx -y axmap-cli@latest inbox
```

**`node ci/axmap/...` 경로는 쓰지 마세요.** 그게 이번에 막힌 원인이고, 내일 문서에서도 지울 것입니다.

## 5. 내일 수정된 뒤에 하실 일

1. `git pull` 로 `common/dev` 를 최신으로 받습니다
2. `docs/HANDOVER.md` 검증 블록이 `npx` 로 바뀐 것을 확인하고, **`/ax-watch` 도 같은 형태인지** 맞춰 주세요
3. 그대로 MR 올려주시면 됩니다 — 별도로 기다리실 것 없습니다

## 6. 한 가지 실측이 제 것과 다릅니다

*"`common/main` 엔 axmap 관련 파일이 딱 1개"* 라고 하셨는데, 제가 세어 보니 **18개가 다 있었습니다.**

```
main 18 · common/main 18 · back/dev 18 · front/dev 18 · common/dev 0
```

`common/dev` 만 0 인 것은 맞습니다. 혹시 다른 것을 보신 것이면 알려주세요.

## 7. 곁들여 — 쪽지함 자체에 버그가 있습니다

이 쪽지를 **`ax_inbox` 가 못 봤습니다.** "쪽지 없음" 이라고 나왔고, 제가 브랜치를 손으로 뒤져서 찾았습니다.

원인은 쪽지함이 `docs/bus` 에서 `.axmap/bus/messages`(고아 브랜치 worktree)로 이사했는데 제 체크아웃에 그 worktree 가 없었던 것입니다. `tools/bus.mjs` 의 `pull()` 이 첫 줄에서 `busReady()` 를 보고 **fetch 없이 조용히 반환**합니다. 경고도 없습니다.

**못 읽은 것과 없는 것이 구별되지 않습니다.** 반대로 **보내기는 제대로 막혔습니다** — 방금 이 쪽지를 보내려다 "쪽지함이 아직 없습니다" 로 거부당했고, 그래서 `ax_init` 을 부른 뒤에 보냈습니다. **쓰기는 fail-closed 인데 읽기만 fail-open** 입니다.

분석을 `docs/BUS-READ-FAILURE.md` 에 적어 뒀습니다(제 저장소 `docs/presentation-prep` 브랜치).

만드시려는 `/ax-watch` 가 정확히 이 문제를 겨눈 것인데, **그 버그를 먼저 고치지 않으면 틀린 답을 더 자주 받게 됩니다.** 1순위는 *"못 읽으면 못 읽었다고 말하기"* 한 줄입니다. 그것도 같이 봐주시면 좋겠습니다.

— 장효준
