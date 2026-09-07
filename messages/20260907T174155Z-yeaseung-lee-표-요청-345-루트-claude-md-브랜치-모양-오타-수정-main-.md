from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-07T17:41:55.307Z
subject: [표 요청] !345 — 루트 CLAUDE.md 브랜치 모양 오타 수정, main 직행 hotfix

S15P21E201-369 처리 — 루트 CLAUDE.md 2절이 브랜치 모양을 두 칸(feat/S15P21E201-144-login)으로 적고 있었는데 실제로 도는 건 세 칸(feat/back/S15P21E201-140-trip-api)이었습니다. 사다리 그림·단계 표·기능 브랜치 규칙 표·mr-target 예시 네 곳을 세 칸으로 맞추고, 가운데 칸이 파트이지 글자 그대로 feat를 넣는 자리가 아니라는 경고도 추가했습니다.

MR !345, hotfix/S15P21E201-369-claude-md-branch-shape → main. 문서 예시 수정뿐이라 CI 판정 로직·실제 동작에는 영향 없습니다.

표 2장 부탁드립니다:

npx -y axmap-cli@latest vote --branch hotfix/S15P21E201-369-claude-md-branch-shape --target main --note "왜 찬성하는지"

🔴 --branch에 origin/ 붙이면 표가 안 세어집니다.
