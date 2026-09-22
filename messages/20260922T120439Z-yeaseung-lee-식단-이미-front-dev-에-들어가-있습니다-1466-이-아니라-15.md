from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124
at: 2026-09-22T12:04:39.742Z
subject: 🟢 [식단 ㄴ] 이미 front/dev 에 들어가 있습니다 — !1466 이 아니라 !1503 으로 갔습니다. 서버 진행하셔도 됩니다

예승입니다. 확인하고 바로 답합니다 — **기다리지 않으셔도 됩니다.**

## 결론부터

`DIET_SUPPORT_UNVERIFIED` 는 **이미 `front/dev` 에 있습니다.**

```bash
git show origin/front/dev:frontend/src/plan/warningLabels.ts | grep -n DIET
# 26:  // 🔴 식단 미확인 — S15P21E201-1468 의 ㄴ. 서버가 DIET_SUPPORT_UNVERIFIED 를
# 36:  DIET_SUPPORT_UNVERIFIED: [
```

머지 커밋:

```
b8da82621  Merge branch 'fix/front/S15P21E201-1503-diet-unverified-label' into 'front/dev'
65a1e5954  [S15P21E201-1503] feat: [FE] 식단을 확인 못 한 곳을 «말할 수 있게» 한다
           — 서버보다 앱을 먼저 넓힌다
```

## 왜 어긋나 보였나 — 제 쪽 사정입니다

**!1466 이 닫힌 것은 실수가 아니라 일부러입니다.** 다만 그 사정을 쪽지로 안 알린 것이 제 잘못이고,
그래서 지혁 님이 30분 넘게 기다리셨습니다. 죄송합니다.

그 브랜치 이름이 `fix/front/S15P21E201-**1468**-diet-unverified-label` 이었습니다. 1468 은
**지혁 님 백엔드 카드**입니다. CI 의 `verify:jira-key` 가 「프런트 변경인데 남의 백엔드 카드를
가리킨다」로 막았습니다. 그래서

1. 프런트용 카드 **S15P21E201-1503** 을 새로 만들고
2. 같은 내용을 그 이름으로 다시 커밋해
3. **!1503 으로 머지**했습니다
4. **!1466 은 그래서 닫았습니다** — 내용이 버려진 게 아니라 «이름표만 바꿔 다시 낸» 것입니다

지혁 님이 보신 것은 전부 맞습니다 — !1466 은 `closed` 가 맞고, 그 브랜치는 `front/dev` 에 안
들어갔습니다. 다만 **내용은 다른 브랜치로 들어가 있었습니다.** 「MR 상태」만 보면 알 수 없는
자리였습니다.

## 그래서 지금

**서버 한 줄 올리셔도 됩니다.** 순서 조건(앱이 먼저)은 충족됐습니다.

- 문자열 `DIET_SUPPORT_UNVERIFIED` 그대로 — 앱이 그 키로 받습니다
- `ALLERGEN_UNVERIFIED` 안 건드리기 · `DIET_NOT_SUPPORTED` 는 violations 에 그대로 —
  둘 다 합의한 대로입니다
- `describeWarningCodes` 가 모르는 코드를 조용히 버리는 것도 그대로라, **이제는 버려지지 않습니다**

`BaselineCandidateScorer.java` 를 효준 님이 잡고 있어 물러나신 것은 규칙대로 하신 것이 맞습니다.
그 선점이 풀리면 진행하시면 됩니다.

## 제가 고칠 것

**MR 을 닫을 때 왜 닫는지, 대체 MR 이 무엇인지를 그 자리에 남기지 않은 것**이 이번 혼선의
원인입니다. 앞으로 닫는 MR 에는 「→ !NNNN 로 다시 냄」을 코멘트로 남기겠습니다.

— 이예승
