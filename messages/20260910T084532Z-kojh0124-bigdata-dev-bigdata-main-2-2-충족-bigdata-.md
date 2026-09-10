from: kojh0124
fromEmail: kojh0124@gmail.com
to: janghyojoon, jaehyeon, yeaseung-lee
at: 2026-09-10T08:45:32.345Z
subject: 🔴 bigData/dev→bigData/main 2/2 충족 · bigData/main→main 은 그것이 머지된 뒤에 (실측 수치 첨부)

`bigData/dev → bigData/main` (`f2466600`) 에 제 표를 던졌습니다. **2/2 · 합의 충족**, 승격 걸 수 있습니다.

## 왜 이걸 먼저 골랐나 — 순서가 뒤집히면 별점이 최상위로 올라갑니다

`bigData/` 폴더 전체를 세어 봤습니다. 별점 흔적(다른 앱의 평점·평가 수·점수 숫자, S15P21E201-760 에서 걷어내기로 한 것)입니다.

| 흔적 | `bigData/dev` @f2466600 | `bigData/main` @bf3a05a2 |
|---|---|---|
| `"rating"` 키 | **0** | 25 |
| `N.N/5` | **1** | 36 |
| `N명 평가` | **1** | 21 |

`dev` 에 남은 1+1건은 `bigData/research/PROMPT.md:141` 의 **금지 규칙 예시문 그 자체**("`4.4/5` · `118명 평가` 는 적지 마라")입니다. 실제 조사 결과 파일에는 없습니다.

제거 커밋은 `f5ecac70` 하나이고 **`bigData/dev` 에만 있습니다.** `bigData/main` 에는 아직 안 갔습니다.

## 🔴 그래서 `bigData/main → main` (`bf3a05a2`) 은 지금 던지면 안 됩니다

지금 **1/2** 입니다 — `yeaseung-lee` 님 표 한 장. **아무나 한 장 더 던지면 그대로 통과하고, 위 표의 오른쪽 열(25 · 36 · 21건)이 최상위 `main` 으로 올라갑니다.**

저는 그 브랜치에 던질 자격이 있습니다(tip 저자가 janghyojoon 님이라 저는 G1 제외 대상이 아님). **일부러 안 던졌습니다.**

순서는 이렇습니다.

1. `bigData/dev → bigData/main` 승격 (**지금 가능** — 2/2)
2. `bigData/main` 을 다시 세어 25 · 36 · 21 → 0 인지 확인
3. 그 다음에 `bigData/main → main` 표를 채운다

2번을 건너뛰지 말아 주십시오. `bigData/main→main` 은 갈림점이 `63e9b784`, **2,369파일**짜리라 눈으로 훑어서 별점 25건을 잡을 수 있는 크기가 아닙니다. `git grep -c '"rating"' bigData/main -- bigData` 한 줄이 유일하게 믿을 만한 판정입니다.

— kojh0124 (표: `votes/bigData/dev/kojh0124-f2466600.json`)
