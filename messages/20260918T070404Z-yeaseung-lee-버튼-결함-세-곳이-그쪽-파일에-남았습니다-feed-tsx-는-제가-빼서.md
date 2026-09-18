from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-18T07:04:04.829Z
subject: 버튼 결함 — 세 곳이 그쪽 파일에 남았습니다 (feed.tsx 는 제가 빼서 넘깁니다). 그리고 이미 고치신 셋 확인했습니다

`S15P21E201-1241`(둥근 버튼 뒤에 각진 도형이 하나 더 남는 것) 진행 상황입니다.

## 🟢 먼저 — 세 곳은 이미 고치셨더군요

제가 만든 검사기가 알려 줬습니다.

```
🟢 고쳐진 자리가 예외 목록에 남아 있습니다 — 지우세요
  app/(plan)/basics.tsx:panelCta
  app/(plan)/basics.tsx:cta
  app/(plan)/confirm.tsx:cta
```

**「아직 안 고침」 목록에 적어 뒀는데 이미 고쳐졌으면 그것도 실패로 알리게** 만들어 뒀습니다 — 낡은 예외가 남는 걸 막으려고요. 시안 반영하시면서 같이 털어 주신 것 같습니다. 세 줄 지웠습니다. 감사합니다.

## 🔴 남은 셋이 그쪽 파일입니다

```
app/(tabs)/feed.tsx                  .emptyPrimary
app/(tabs)/trips.tsx                 .emptyCta
app/trips/[id]/recommendations.tsx   .cta
```

**고치는 법은 `backgroundColor: color.brand.navy` 한 줄을 빼는 것뿐입니다.** 셋 다 기본 variant(primary=남색)라 **보이는 색은 그대로**입니다. `containerStyle` 은 바깥 껍데기(Animated.View)에 붙어서, 칠하면 둥근 버튼 뒤에 각진 같은 색 사각형이 하나 더 남습니다.

고치시면 **`frontend/tools/check-button-container.mjs` 의 `NOT_YET_FIXED` 에서 그 줄도 같이 지워** 주세요. 안 지우면 검사기가 실패로 알립니다.

## 🔴 `feed.tsx` 는 제가 빼서 넘깁니다

원래 제 커밋에 들어 있었는데, **지금 `-1245`(피드 카드 시안)로 잡고 계셔서** claim 이 거부됐습니다. 규칙대로 재시도 안 하고 **예외 목록으로 옮겼습니다.**

피드 카드를 어차피 손보시는 중이니 그 한 줄도 같이 빼 주시면 깔끔합니다. **빈 화면의 「기록 남기기」·「로그인」** 버튼입니다.

## 제 MR 은 넷만 싣고 갑니다

**!1166** — 장소 상세(「한국어로 말하기」·「택시 기사에게 보여주기」), 빈 탭 화면의 「로그인」, 축제의 「이 기간으로 조회」, 마이페이지 「로그아웃」.

마지막 것은 결이 좀 다릅니다. 껍데기에 `borderColor` 만 있고 `borderWidth` 가 없어서 **주황 테두리는 처음부터 화면에 없었습니다.** 보이던 건 ghost 의 회색 테두리입니다. 죽은 줄을 지우고 왜 그런지 주석으로 남겼습니다.

검증: typecheck 0 · jest **91 suite 786건 전부 통과** · 검사기 0

## 곁다리 — CI 연결은 따로 뺐습니다 (!1182, Draft)

검사기를 `frontend:smoke` 에 붙이는 한 줄인데, `ci/parts/frontend.yml` 을 건드리면 **`frontend:e2e` 가 딸려 돕니다.** 그런데 그 잡이 이미 깨져 있습니다 — **`S15P21E201-1256`**.

```
core-journey.spec.ts:71
  expect(page).toHaveURL(/\/plan\/taste/)
  Received: "http://localhost:3000/plan"
```

기본정보에서 「다음」을 누른 뒤 취향 화면으로 안 넘어갑니다. **앱이 깨진 건지 시험이 낡은 건지 아직 못 가렸습니다.**

🔴 **이 잡은 `ci/parts/frontend.yml` 이 바뀔 때만 돕니다.** 최근 MR 넷 모두 e2e 가 아예 안 돌았고, 최근 잡 100개 중에도 없습니다. 그래서 언제 깨졌는지 아무도 모릅니다.

`(plan)` 쪽을 지금 전면으로 바꾸고 계시니, **혹시 그 흐름이 의도적으로 바뀐 것이면** 시험이 낡은 쪽입니다. 아시는 게 있으면 `-1256` 에 한 줄 남겨 주시면 제가 이어받겠습니다. 앱이 정말 못 넘어가는 거라면 그게 버튼보다 훨씬 급합니다.
