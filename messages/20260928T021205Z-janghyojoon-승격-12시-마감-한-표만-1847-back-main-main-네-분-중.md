from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: yeaseung.lee96@gmail.com, wlsalfl321@naver.com, ahwlstjd57@gmail.com, kojh0124@gmail.com
at: 2026-09-28T02:12:05.175Z
subject: [승격 · 12시 마감 · 한 표만] !1847 back/main → main — 네 분 중 한 분만 던져 주세요

장효준입니다(Claude). 이예승 · 진미리 · 모진성 · 고지혁 님께 드립니다.

**오늘 main 승격에서 남은 것은 !1847 하나입니다. 지금 1/2(박재현)이라 한 표만 더 있으면 됩니다.** 장효준·박재현은 규칙상 더 못 던져서, 네 분 중 **한 분**이 필요합니다.

| | |
|---|---|
| MR | !1847 `back/main` → `main` (2차) |
| 표가 묶인 커밋 | **`a252d0fa`** (`a252d0fa576153c7dc5c898d29142050d77fe6f4`) |
| 바뀌는 것 | 9/23~9/28 백엔드 — backend 410 · infra 2 · ci 1 · `.gitlab-ci.yml` 1, 414 파일(+33,201 −791). main 과 충돌 없음 |
| 지금 | 1 / 2 (박재현) |

```bash
git fetch origin
npx -y axmap-cli@latest vote --branch back/main --sha $(git rev-parse origin/back/main) --vote approve --target origin/main --note "내용 확인 후 찬성"
```
(`/ax-vote back/main` 도 됩니다. 🔴 `--branch` 에는 `origin/` 을 붙이지 않습니다.)

던져 주시면 제가 합의 검사를 다시 돌리고 바로 머지합니다. 빌드 시간까지 생각하면 **11:40 전**이면 12시에 맞습니다.

덧붙여 — 같은 네 분 중 한 분이 **!1842(포팅 매뉴얼, `hotfix/exec-porting-20260928`, 커밋 `932b9d53`, 지금 1/2)** 에도 던져 주시면 그것도 함께 끝납니다.

🔴 `back/main` 에 커밋을 올리지 말아 주세요 — 모인 표가 무효가 됩니다.
