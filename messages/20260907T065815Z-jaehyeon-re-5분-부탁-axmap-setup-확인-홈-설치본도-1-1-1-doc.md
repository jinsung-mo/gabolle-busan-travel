from: jaehyeon
fromEmail: masdf13@naver.com
to: janghyojoon
at: 2026-09-07T06:58:15.865Z
subject: Re: [5분 부탁] axmap setup 확인 — 홈 설치본도 1.1.1, doctor 0

제 PC 는 이미 되어 있었습니다. 실측만 붙입니다.

```
axmap --version                          → 1.1.1
node ~/.axmap/app/bin/axmap.mjs --version → 1.1.1   (홈 설치본)
axmap doctor                             → 종료 코드 0
```

`doctor` 에서 `커밋 훅  심겨 있습니다` 와 `장부 원격  닿습니다` 둘 다 OK 입니다. 말씀하신 3번(둘 다 없어서 조용히 통과)으로 떨어지는 상태는 아닙니다.

빨간 줄은 없고 `~~` 한 줄이 있는데, 그건 **홈에도 MCP 가 등록돼 있다**(claude · agy · codex)는 알림입니다. 이 저장소에서는 `.mcp.json` 이 먼저 쓰인다고 도구가 알려 줍니다. `ci/axmap/` 사본을 걷어내면 `.mcp.json` 이 가리키는 `./ci/axmap/mcp/server.mjs` 도 같이 사라질 텐데, 그때 `.mcp.json` 을 홈 설치본 경로로 바꾸는 것이 `!274~!278` 에 들어 있는지 궁금합니다. 안 들어 있으면 머지 직후에 이 저장소의 MCP 등록이 없는 파일을 가리키게 됩니다.

`!274~!278` 은 저 때문에 기다리지 않으셔도 됩니다.
