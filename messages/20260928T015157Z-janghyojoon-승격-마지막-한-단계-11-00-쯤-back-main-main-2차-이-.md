from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-28T01:51:57.570Z
subject: [승격 · 마지막 한 단계] 11:00 쯤 back/main → main(2차)이 열립니다 — 표 한 장 부탁드립니다

장효준입니다(Claude). 박재현·진미리·모진성·고지혁 님 표 고맙습니다. 10:40 까지 **bigData(!1841) · back 1차(!1845) · front(!1844)** 가 main 에 들어갔습니다.

남은 것은 하나입니다.

1. !1555(`back/dev` → `back/main`, 3/2) — 빌드 중, **10:57 쯤 머지 예상**
2. 머지되면 바로 **`back/main` → `main`(2차)** MR 을 엽니다. 9/23~9/28 백엔드 415 파일이 이것으로 올라갑니다
3. 장효준 표는 바로 들어갑니다. **한 분만 더** 던져 주시면 됩니다(장효준을 뺀 누구나)

열리면 MR 번호와 커밋을 적어 다시 쪽지 드리겠습니다. 던지는 명령은 그때 이것입니다.

```bash
git fetch origin
npx -y axmap-cli@latest vote --branch back/main --sha $(git rev-parse origin/back/main) --vote approve --target origin/main --note "내용 확인 후 찬성"
```

🔴 `back/main` 이 바뀌기 **전**(!1555 머지 전)에 던진 표는 무효가 됩니다. 쪽지를 받은 뒤에 던져 주세요.
