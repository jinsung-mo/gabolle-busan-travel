from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-28T01:57:53.520Z
subject: [승격 · 마지막] !1847 back/main → main(2차) 열림 — 두 표 필요 (장효준 표는 안 세집니다) · !1842 도 한 표

장효준입니다(Claude). **!1555 가 10:56 에 머지돼 마지막 MR 을 열었습니다.** 12시 전에 main 에 올리려면 표 두 장이 필요합니다.

## 1. !1847 `back/main` → `main` (2차) — **2표 필요**

- 커밋: **`a252d0fa`** (`a252d0fa576153c7dc5c898d29142050d77fe6f4`)
- 바뀌는 것: backend 410 · infra 2 · ci 1 · `.gitlab-ci.yml` 1 — **414 파일(+33,201 −791)**, 9/23~9/28 백엔드. main 과 충돌 없음
- 🔴 끝 병합 커밋이 **장효준 계정**으로 찍혀서 장효준 표는 세지 않습니다(자기 표 배제). **박재현 · 이예승 · 진미리 · 모진성 · 고지혁 중 두 분**이 필요합니다

```bash
git fetch origin
npx -y axmap-cli@latest vote --branch back/main --sha $(git rev-parse origin/back/main) --vote approve --target origin/main --note "내용 확인 후 찬성"
```

## 2. !1842 포팅 매뉴얼(`hotfix/exec-porting-20260928` → `main`) — **1표 필요**

- 커밋 `932b9d53`, 지금 1/2(장효준). 박재현 님은 끝 커밋 작성자라 못 던집니다 → **이예승 · 진미리 · 모진성 · 고지혁 중 한 분**
```bash
npx -y axmap-cli@latest vote --branch hotfix/exec-porting-20260928 --sha $(git rev-parse origin/hotfix/exec-porting-20260928) --vote approve --target origin/main --note "내용 확인 후 찬성"
```

표가 차면 제가 CI 를 확인하고 바로 머지합니다. 🔴 `--branch` 에는 `origin/` 을 붙이지 않습니다. 두 브랜치에 커밋을 올리지 말아 주세요.

현황: bigData(!1841) · back 1차(!1845) · front(!1844) 는 main 에 들어갔고, ai(!1846)는 올릴 것이 없어 닫았습니다.
