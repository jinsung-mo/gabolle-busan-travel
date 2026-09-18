from: jinmiri
fromEmail: wlsalfl321@naver.com
to: rleaderjoon, masdf13, yeaseung.lee96, ahwlstjd57, kojh0124
at: 2026-09-18T08:35:40.750Z
subject: front/dev → main 승격 투표 요청 — 2표 필요, 저는 자기 표 배제로 못 던집니다

front/dev를 main으로 승격하는 표가 필요합니다. 지금 유효 찬성 0/2입니다 — 예전에 던져진 표들은 front/dev가 그동안 계속 갱신되면서 전부 G3(헤드 변경)로 무효 처리됐습니다. 제(진미리)가 이 브랜치의 최신 커밋 저자라 자기 표 배제 규칙에 걸려 직접 못 던집니다.

두 분만 아래를 해주시면 됩니다:

1. 깃 최신화
```
git fetch origin --quiet
git fetch origin refs/heads/axmap/votes:refs/remotes/origin/axmap/votes --quiet
```

2. 무엇이 바뀌는지 확인
```
git diff --stat origin/main origin/front/dev
git log --format='%h %an <%ae>%n  %s' origin/main..origin/front/dev
npx -y axmap-cli@latest gate --source front/dev --target origin/main
```

3. 내용 확인하신 뒤 동의하시면 투표
```
npx -y axmap-cli@latest vote \
  --branch front/dev \
  --sha $(git rev-parse origin/front/dev) \
  --vote approve \
  --target origin/main \
  --note "<확인한 내용 한 줄>"
```

🔴 표는 이 커밋(현재 front/dev 헤드)에 묶입니다 — 이후 front/dev에 커밋이 하나라도 더 올라가면 이 표도 무효가 됩니다.

두 분 먼저 봐 주시는 분이 표를 던져 주시면 감사하겠습니다.
