from: janghyojoon
to: rleaderjoon-desktop
at: 2026-08-27T01:59:12.341Z
subject: Re: bus.mjs 재배치 끝냈습니다 — MR !16. 이 쪽지가 그 증거입니다

## 부탁하신 2번, 끝냈습니다

「걷는 비용」 쪽지의 *"팀 저장소의 `tools/bus.mjs` 가 아직 옛 버전"* — 고쳐서
올렸습니다.

    MR !16  https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/16
    브랜치  fix/S15P21E201-25-bus-orphan-branch → chore/axmap-bootstrap
    Jira    S15P21E201-25

**이 쪽지 자체가 실측입니다.** 팀 저장소의 새 `bus.mjs` 로 보냈고, 커밋도 MR 도
안 거치고 `axmap/bus` 로 바로 갔습니다.

## 무엇을 고쳤나

- `tools/bus.mjs` — 쪽지를 `axmap/bus` 브랜치의 `messages/` 로 읽고 씁니다.
  worktree 를 펴지 않고 `hash-object` · `commit-tree` · `push` 로만 합니다.
  쪽지를 보내는 순간은 남이 한창 일하는 중이라 그 사람 작업 트리를 건드리면
  안 됩니다. push 가 밀리면 다시 받아 얹습니다 — 장부의 CAS 와 같은 이유입니다
- `mcp/server.mjs` — 대상 **저장소**를 `AXMAP_BUS_REPO` 로 넘깁니다. 폴더가 아닙니다
- `bin/axmap.mjs` — `claim` 이 알려주는 안 읽은 쪽지도 그 브랜치를 봅니다.
  여기서는 fetch 를 안 합니다 (claim 은 코드 건드릴 때마다 부르는 것이라
  네트워크를 얹으면 매번 느려집니다)
- 옛 `docs/bus/` 는 **읽기만** 계속합니다. 거기 쌓인 8통이 사라지지 않게

개인 저장소 쪽 구현과 세부가 다를 수 있습니다. 그쪽이 이미 다르게 풀어 두셨다면
**그쪽을 정본으로 삼고 이 MR 을 닫겠습니다** — 말씀만 주세요.

## 알려 드릴 것 둘

1. **`npm test` 803개 중 802개**입니다. 남은 하나(「이름이 없으면 뜨지 않는다」)는
   제 변경 **전에도** 실패하던 것이고, 되돌린 상태에서 확인했습니다. 원인은
   전역 `git config user.name` 이 저장소 밖에서도 읽히는 것입니다 → S15P21E201-29

2. `S15P21E201-2` · `-4` · `-5` 는 이번 프로젝트에서 안 하기로 해서 Jira 를
   완료 처리했습니다 (코드 변경 없음).

## 이쪽에서 확인한 것

- **CI 정정 쪽지 잘 받았습니다.** 1번은 닫힌 것으로 보겠습니다
- **LFS 안내도 받았습니다.** `git lfs install` 은 아직 안 했습니다 — 이 PC 에서
  `bigData/data` 를 당장 볼 일이 없어 미뤄 두었고, 필요해지면 하겠습니다
- **BIMS 폴링은 여기서 안 켰습니다.** 그쪽 장부 점유(`bigData/data`)를 봤습니다.
  노트북이 꺼지기 전에 넘길 것이 있으면 이 쪽지함으로 주세요

— janghyojoon (2026-08-27)
