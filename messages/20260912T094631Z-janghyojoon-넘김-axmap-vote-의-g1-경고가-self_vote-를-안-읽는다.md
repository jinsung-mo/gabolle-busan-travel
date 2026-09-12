from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: janghyojoon
at: 2026-09-12T09:46:31.247Z
subject: [넘김] axmap vote 의 G1 경고가 self_vote 를 안 읽는다 — governance/vote.mjs:393

**axmap 저장소** 일입니다 (`C:/Users/rlead/Desktop/git/axmap`). S15P21E201 쪽은 안 건드립니다. 제가 안 잡고 있으니 바로 가져가셔도 됩니다.

## 무엇이 틀렸나

`axmap vote` 가 **던질 수 있는 사람을 못 던지게 막습니다.**

```
$ npx axmap-cli@latest vote --branch front/dev --target front/main --vote approve
이 표는 자기 표라 세지지 않습니다 (G1 — 자기가 쓴 코드에 자기가 찬성할 수 없습니다).
  rleaderjoon@gmail.com 이(가) front/main..front/dev 의 author 목록에 있습니다.
```

**틀렸습니다.** 같은 상황에서 게이트는 이렇게 말합니다.

```
$ npx axmap-cli@latest gate --source front/dev --target front/main
  자기 표 : self_vote=tip   author 4명 · tip wlsalfl321@naver.com
```

`self_vote` 는 **2026-09-09 에 `authors` → `tip`** 으로 바뀌었습니다(policy.json 의 `//self_vote` 주석). **게이트만 따라갔고 vote 쪽은 안 따라갔습니다.**

## 어디

`governance/vote.mjs:393` `warnIfSelfVote()`

```js
function warnIfSelfVote(branch, targetName, email, force, policyFlag) {
  const range = selfVoteRange(branch, targetName)
  const r = git(['log', '--format=%aE', ...range.args])
  ...
  const authors = new Set(r.out.split('\n')...)
  if (!authors.has(email.toLowerCase())) return      // ← 여기. 범위의 author 전부로만 본다
```

**`self_vote` 값을 한 번도 안 읽습니다.** 정책이 `tip` 이어도 `authors` 로 판정합니다.

## 쓸 수 있는 것이 이미 있습니다

`src/governance.mjs` 에 둘 다 있습니다 — 새로 짜지 마세요.

- `selfVoteMode(policy)` (`:151`)
- `excludedAuthors(mode, authorEmails, tipAuthorEmail)` (`:174`)

게이트가 `:959`·`:972` 에서 그대로 쓰고 있습니다. **같은 함수를 vote 쪽에서도 부르면 됩니다.**

🔴 **조건을 다시 세지 마세요.** 바로 아래 `g1WaiverFor()` 의 주석이 그 이유를 이미 적어 뒀습니다 — *"같은 규칙을 두 곳에 적으면 그 어긋남이 그대로 다시 난다."* **G1 해제**는 게이트에 물어보게 고쳐 놓고 **G1 범위**만 안 고친 것이 이번 일입니다.

## 확인하는 법 (실제로 막혔던 경우)

| | |
|---|---|
| 소스 | `front/dev` `a521193c` |
| 타깃 | `front/main` (정책 `self_vote: "tip"`) |
| tip 저자 | `wlsalfl321@naver.com` |
| 막힌 사람 | `rleaderjoon@gmail.com` — 범위 안에 커밋은 있지만 **tip 저자가 아님** |

고친 뒤에는 이 조합에서 **경고 없이 그냥 써져야** 합니다. 지금은 `--force` 를 붙여야 하고, 붙이면 게이트가 정상으로 셉니다(실측: `유효 찬성 2 / 필요 2`, 종료 코드 0).

## 하나 더 — 같이 보시면 좋습니다

`axmap gate --source <브랜치>` 는 **로컬 브랜치**를 봅니다. 로컬이 낡아 있으면 MR 헤드와 다른 커밋을 판정하고 *"유효 찬성 0"* 을 냅니다. 저도 여기 한참 속았습니다.

경고 한 줄이면 충분할 것 같습니다 — *"로컬 `front/dev` 가 `origin/front/dev` 와 다릅니다"*.

— janghyojoon (세션 `ab827ae5…c957`)
