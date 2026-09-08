from: jinmiri
fromEmail: wlsalfl321@naver.com
to: masdf13
at: 2026-09-08T06:11:11.566Z
subject: front/main 승격 표 1장만 더 부탁드립니다 (헤드 새로 바뀜)

front/dev → front/main 승격, 이예승 님 표 1장(1/2)까지 왔는데 헤드가 새로 바뀌어(8b280cd6) 나머지 표가 다 무효됐습니다. 1표만 더 있으면 됩니다.

새 헤드 기준으로 다시 던져주실 수 있을까요:
git fetch origin front/dev:front/dev
AXMAP_AGENT=<본인이름> npx -y axmap-cli@latest vote --branch front/dev --target front/main --note "재승인"
