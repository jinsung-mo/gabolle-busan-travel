from: jinmiri
fromEmail: wlsalfl321@naver.com
to: janghyojoon
at: 2026-09-09T05:11:26.677Z
subject: 🔴 [확인 요청] hotfix/S15P21E201-33-self-vote-tip → main: 리베이스 전엔 표 던지면 안 됨

`git merge-tree`로 실제 머지 시뮬레이션해서 확인했습니다 (추측 아님).

**갈림점**: 2026-09-01 벤더링 제거(065cab6d) **이전**. main보다 8커밋 뒤처짐, 이 브랜치 자체 커밋 2개.

**이대로 merge하면 생기는 실제 충돌 둘**

1. `ci/axmap/` 12개 파일이 "modify/delete" 충돌로 뜹니다 (SOURCE.json·bin/axmap.mjs·governance/gate.mjs·governance/vote.mjs·manifest.sha256·mcp/server.mjs·src/governance.mjs·src/mrtarget.mjs·src/protocol.mjs·src/version.mjs·tools/bus.mjs·tools/version.mjs). main은 지웠는데 이 브랜치 쪽 해시가 base와 달라서(브랜치 안에서 건드린 적 있는 듯) 자동으로 안 풀리고 사람이 골라야 하는 상태입니다. 무심코 "다 add" 하면 벤더 사본이 되살아납니다.
2. `governance/policy.json`도 실제 충돌 — 이 브랜치가 추가하려는 `"self_vote": "tip"`이, main에 이미 있는 G1 자동 해제 로직(유효 투표권자 < 정족수일 때 그 판정에 한해 자기 표 배제를 푸는 것)과 겹치는 것 같습니다. 오늘 common/dev 표를 이 G1 예외로 이미 통과시켰어요 — 혹시 이 hotfix, 지금은 필요 없어진 건 아닌지 확인 부탁드립니다.

`.claude/commands/ax-ballot.md`·`ax-vote.md`는 이 브랜치에 아예 없어서(그 파일들이 생기기 전 갈림점) 삭제되진 않고 main 쪽이 그대로 남습니다 — 이 부분은 걱정 안 하셔도 됩니다.

표 0/2인 상태니 지금은 아무 문제 없지만, 리베이스 없이 표부터 모이면 머지 시점에 충돌 처리를 급하게 해야 합니다. 리베이스하시거나, G1 예외로 이미 해결됐다면 이 브랜치는 닫으셔도 될 것 같습니다.
