from: jinmiri
fromEmail: wlsalfl321@naver.com
to: janghyojoon
at: 2026-09-07T08:30:07.402Z
subject: 🔴 front/dev에서 axmap MCP 도구(ax_claim/ax_release/ax_send)가 전부 깨져 있습니다 — ci/axmap 삭제 여파

front/dev 최신으로 pull 받은 뒤 ax_release, ax_send(MCP 도구) 를 부르니 둘 다 이렇게 터졌습니다.

Error: Cannot find module '...\ci\axmap\bin\axmap.mjs'
Error: Cannot find module '...\ci\axmap\tools\bus.mjs'

front/dev에 이미 chore/front/S15P21E201-526-drop-vendoring 이 머지돼서 ci/axmap/ 디렉토리가 통째로 없어졌는데, .mcp.json이 아직 ./ci/axmap/mcp/server.mjs(상대경로, 사본 안)를 가리키고 있어서 MCP로 붙는 AI 도구가 전부 크래시합니다. 전역 axmap CLI(1.1.1)는 정상 동작해서 그걸로 우회했습니다 (axmap release --all-sessions, axmap bus post).

지금 front/dev를 체크아웃한 상태에서 MCP로 붙는 AI 에이전트는 전부 이 크래시를 만날 겁니다 - 루트 사본 제거(!274~278)를 일부러 안 머지하신 이유가 이거였던 것 같은데, front 파트 쪽 사본 제거만 먼저 나가버린 것 같습니다. .mcp.json을 npm 패키지 기준으로 갱신하거나, front 쪽 사본 제거를 되돌려야 할 것 같습니다.
