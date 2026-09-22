from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124, jinmiri, janghyojoon, masdf13
at: 2026-09-22T05:41:07.011Z
subject: 🔴 !1448(back/dev → back/main) 표 «두 장» 부탁드립니다 — 제가 꼭지 저자라 못 던집니다. 이게 !1332 를 푸는 마지막 고리입니다

`main` 으로 가는 길에서 **back 쪽 하나만 남았습니다.** 그리고 그 하나가 제 표로는 안 채워집니다.

```bash
axmap vote --branch back/dev --sha db2293463a6468482f52dae83a0e436e65e23653 --target back/main --note "..."
```

> **던지기 전에 이 둘을 먼저 하십시오** — 안 하면 게이트가 «빨개지지 않고 조용히 틀린 답»을 줍니다.
> ```bash
> git fetch origin back/dev:back/dev
> git -C .axmap/votes fetch origin axmap/votes && git -C .axmap/votes merge --ff-only FETCH_HEAD
> ```

## 왜 제 표가 안 되나

```
자기 표 : self_vote=tip   author 3명 · tip yeaseung.lee96@gmail.com
합의 미달 — 유효 찬성 0 / 필요 2
```

꼭지가 **제가 !1442 를 머지하며 생긴 병합 커밋**입니다. `self_vote=tip` 에 그대로 걸립니다.

🔴 **구조적인 문제로 보입니다.** 제가 `back/dev` 에 무엇을 머지하든 그 병합 커밋의 저자가 저라서,
**머지를 누른 사람은 다음 승격에서 자동으로 표를 잃습니다.** 오늘 이걸로 두 번 걸렸습니다
(`!1332` 도 같은 이유로 효준 님이 못 던지셨습니다). 지금 고치자는 건 아니고, 승격이 끝나면
`self_vote` 를 어떻게 둘지 한 번 이야기해 볼 만합니다.

## 무엇을 올리는 건가 — 커밋 11개, 세 사람

| | |
|---|---|
| **S15P21E201-1484** (제 것) | 푸시 알림 결함 셋 — `forget()` 이 `AFTER_COMMIT` 에서 커밋되지 않던 것, 작성자가 탈퇴로 `null` 이면 알림이 통째로 버려지던 것, `ActorNames` 의 빈 결과가 NPE 던 것. **지혁 님이 찾아 주신 둘 + 고치다 나온 하나** |
| **S15P21E201-1485** (지혁 님) | 하트가 장소당 두 번 세어지던 것 |
| **S15P21E201-561** (효준 님) | 아웃박스를 카프카로 실제 발행 + 소비 원장 마이그레이션 |
| **S15P21E201-1492** (제 것) | `assistant:href-contract` 가 낡은 사본을 읽어 승격을 막던 것 |

셋 다 CI 초록으로 `back/dev` 에 들어갔고, 각자 되돌리면 빨개지는 검사를 달고 있습니다.

## 🔴 이게 마지막 고리입니다

```
!1448 (표 2장) → back/main  →  !1332 재실행 → 초록 → main
```

**!1332 가 `assistant:href-contract` 로 막혀 있던 것이 이 묶음 안의 1492 로 고쳐집니다.**
진짜 `back/main` 을 체크아웃해서 확인했습니다 — 고침 전 `exit=2`, 고침 후 `exit=0`.
그래서 !1448 이 들어가야 !1332 가 풀립니다.

## 다른 승격 상태 (참고)

| MR | 상태 |
|---|---|
| !1449 `bigData/dev → bigData/main` | ✅ **머지 완료** (제 표로 2/2 채워 넣었습니다) |
| !1450 `front/dev → front/main` | 표 2/2 통과, CI 도는 중 |
| **!1448** `back/dev → back/main` | 🔴 **0/2 — 두 분 부탁드립니다** |
| !1332 `back/main → main` | !1448 대기 |
| !1331 `ai/main → main` | 충돌. 올릴 것이 `.gitlab-ci.yml` 35줄뿐인데 이미 `main` 에 있어 **닫는 것을 권합니다** (재현 님) |

지혁 님 — 1484 는 지혁 님이 찾아 주신 건이라, 고친 모양이 맞는지 봐 주시면 더 좋겠습니다.
MR !1445 에 자세히 적어 뒀습니다.
