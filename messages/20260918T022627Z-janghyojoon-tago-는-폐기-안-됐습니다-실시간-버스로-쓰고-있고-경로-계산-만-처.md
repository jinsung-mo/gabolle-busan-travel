from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: yeaseung-lee
at: 2026-09-18T02:26:27.831Z
subject: TAGO 는 폐기 안 됐습니다 — 실시간 버스로 쓰고 있고, 「경로 계산」만 처음부터 미채택입니다

장효준 세션입니다. **데이터 세션이 저장소에서 근거를 찾았습니다 — 기억이 아니라 실측입니다.** 스프린트 닫으시는 데 쓰세요.

## 한 줄

> **TAGO 는 폐기 안 됐습니다.** 실시간 버스 도착·주변 정류소로 **지금 쓰고 있습니다**(`S15P21E201-988`, `back/dev` 에 머지됨). 다만 **「대중교통 경로 계산」 용도로는 처음부터 안 쓰기로** 했고, 그건 **폐기가 아니라 미채택**입니다.

## 용도가 둘인데 갈라 봐야 합니다

**① 실시간 버스 도착정보 — 🟢 살아 있습니다**

```
b011b80f  [S15P21E201-988] feat: [BE] 부산 버스 실시간 도착정보 연동 (TAGO)
          → back/dev 의 조상 (merge-base 로 확인)

backend/.../transit/adapter/TagoTransitVendorAdapter.java
                 application/TagoArrivalsJsonParser.java
                 application/TagoNearbyStopsJsonParser.java
                 application/TagoResponseValidator.java
application-dev.properties:169  "부산 버스 정류소·실시간 도착정보(S15P21E201-988, TAGO)"
```

**② 대중교통 경로 계산 — 🔴 처음부터 안 쓰기로 했습니다**

기획서 v2 의 자료 표(`ref/local-route/LOCAL_ROUTE_기획서_v2.md:771`)에 그대로 적혀 있습니다.

> 국토교통부 TAGO 교통정보 · 대중교통 노선·정류장 정보(전국 확장 시 보강용) ·
> **추가 확인 필요** · **카카오모빌리티 API 로 대체** · 사용 **아니오(향후)**

**이유는 TAGO 가 나빠서가 아니라 성격이 달라서입니다** — TAGO 는 **노선·정류장**을 주지 **환승이 든 경로**를 안 줍니다.

## 🔴 `RaptorPlanner` 를 직접 만든 것은 TAGO 때문이 아닙니다

`route/transit/` 에 경로 계산기를 직접 만든 흔적이 있어서 저도 처음엔 「TAGO 를 포기해서 그런가」 했는데 **아닙니다.**

서버 주석이 정확합니다 — **카카오는 자동차 경로만 공개하고, 지하철·버스 경로를 주는 공개 API 가 애초에 없습니다.** 그래서 직접 만든 것이고, **TAGO 채택 여부와는 독립된 결정**입니다.

## 🔴 우리가 모르는 것도 적습니다

- 기획서의 **「추가 확인 필요」가 그 뒤에 실제로 확인됐는지** — 기록을 못 찾았습니다
- **전국 확장 때 노선·정류장용으로 TAGO 를 다시 볼 것인지** — 기획서가 「아니오(**향후**)」라고 **여지를 남겨 뒀습니다**

그 둘은 **사람이 정할 일**입니다. 카드를 닫으실 때 「폐기」가 아니라 **「경로 계산 용도로는 미채택, 실시간 도착 용도로는 사용 중」** 으로 적으시면 다음 사람이 헷갈리지 않습니다.

— 장효준 세션의 Claude
