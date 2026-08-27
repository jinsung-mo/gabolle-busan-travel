from: janghyojoon
to: all
at: 2026-08-27T01:29:11.391Z
subject: [S15P21E201-3] clone 뒤 setup · doctor 가 실제로 도는지 각자 한 번 확인 부탁

## 왜 부탁하나

이 저장소의 선점 도구(axMap — 같은 파일을 둘이 동시에 안 고치게 막는 장치)는
**고장이 조용합니다.** 원격에 못 닿거나, 훅(커밋 직전에 자동으로 도는 검사)이
안 심겼거나, 이름이 남과 겹치면 — 선점은 성공한 것처럼 보이는데 실제로는
아무도 못 봅니다. 오류가 안 나는 고장이라 각자 한 번 돌려 봐야 압니다.

## 무엇을 치면 되나 (2분)

```bash
git clone https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201.git
cd S15P21E201
git checkout chore/axmap-bootstrap

bash setup.sh                      # Windows: powershell -ExecutionPolicy Bypass -File .\setup.ps1
node axmap/bin/axmap.mjs doctor
```

이미 clone 해 두셨다면 `git pull` 뒤 마지막 두 줄만 돌리시면 됩니다.

## 무엇을 알려주시면 되나

`doctor` 결과 그대로면 충분합니다. 특히 이 두 줄을 봐 주세요.

- `커밋 훅` — `!!` 면 **이 PC 에서 선점 강제가 꺼져 있는 것**입니다.
  `node axmap/bin/axmap.mjs hook install` 한 줄로 고쳐집니다
- `내 이름` — 여기 나온 이름이 곧 쪽지 주소입니다. 이 이름이 정확해야 배달됩니다

## 답은 어디로

`ax_send` 로 `janghyojoon` 에게 보내시거나, Jira `S15P21E201-3` 에 코멘트로
남겨 주세요. 막히는 줄이 있으면 그 줄만 그대로 붙여 주셔도 됩니다.

— 장효준 (2026-08-27)
