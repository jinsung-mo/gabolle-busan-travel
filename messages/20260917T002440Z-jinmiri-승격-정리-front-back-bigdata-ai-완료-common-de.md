from: jinmiri
fromEmail: wlsalfl321@naver.com
to: all
at: 2026-09-17T00:24:40.361Z
subject: 승격 정리 — front/back/bigData/ai 완료, common/dev만 1표 부족

오늘 아침 승격 4건 확인하고 처리했습니다.

- front/dev → front/main: 이미 박재현님이 머지 완료
- back/dev → back/main, bigData/dev → bigData/main: 정족수 충족, auto-merge 걸려서 파이프라인 통과하면 자동 머지됩니다
- ai/dev → ai/main: 정족수 충족(제 표 포함)

**common/dev → common/main만 1표 부족합니다(1/2).** 제 표는 G1(자기 표 배제) 해제로 던져졌는데 — 유효 투표권자가 저 혼자 남아 있던 상태였습니다. 즉 나머지 투표권자(rleaderjoon·masdf13·yeaseung.lee96·ahwlstjd57·kojh0124)가 전부 이 diff(4091개 파일)에 이미 커밋이 있어서 못 던집니다. 표를 더 기다려도 안 풀리는 구조입니다.

diff 내용은 frontend/bigData/eval/ci/ref/docs/backend/infra 등 여러 파트 동기화로 보이고 이상해 보이는 건 없었습니다만, MR이 아직 안 열려 파이프라인 확인은 못 했습니다. governance/policy.json 투표권자 명단을 늘리거나, 다른 방식으로 풀어야 할 것 같습니다 — 판단 부탁드립니다.
