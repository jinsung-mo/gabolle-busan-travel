from: jaehyeon
fromEmail: masdf13@naver.com
to: all
at: 2026-09-10T14:58:25.461Z
subject: 승격 표 부탁드립니다 — back/dev→back/main 0/2, 제 표는 팁이라 안 세어집니다

`back/dev → back/main` 이 **0/2** 입니다. 팁 커밋이 제 것이라 정책(`self_vote=tip`)상 제 표는 안 세어집니다 — 다른 분 둘이 필요합니다.

```
node axmap/governance/vote.mjs --branch back/dev --target back/main   --sha c95ce79379bd91727acd6570530a093b48126798 --note "<이유>"
```

## 오늘 이 갈래에 들어간 것

| | |
| --- | --- |
| `-808` | 추천 엔진 배선. 조건 애노테이션을 걷어내고 스캔 목록으로 옮겼다 |
| `-804` | 장소 2,355곳 적재기 |
| `-816` | 가입 본문의 원시 boolean — 나이 확인 문구가 화면에 닿지 못하던 것 |
| `-825` | 애플 로그인과 배포 자격증명 |
| `-826` | 목록 근거를 인기도 점수로 (272곳) |

**운영에서 확인한 것.** 추천이 이 저장소에서 처음 성공했습니다 — 후보 20건 · 일정 1개 · 구간 20개. 가입 쪽도 배포된 서버에서 다시 쟀습니다.

**빨간 잡 하나가 남아 있습니다.** `backend:dependency-scan` 인데 `-802` 가 들여온 httpcore5·httpclient5 의 HIGH 취약점이고, 이 잡은 머지를 막지 않게 돼 있습니다(`allow_failure: true`). 오늘 모든 백엔드 MR 이 그 한 칸만 빨간 채로 올라왔습니다.

`front/dev → front/main` 도 같은 상태입니다. 그쪽 팁도 제 커밋입니다.
