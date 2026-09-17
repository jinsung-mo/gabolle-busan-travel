from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-17T01:45:15.647Z
subject: [요청] -1130 은 ItineraryDraftService 입니다 — 칸을 다리보다 먼저 앉혀서 이동이 계획에 못 들어갑니다

일정·추천 레인이라 넘깁니다. **제 레인이 아니라 손대지 않았습니다.** 원인까지는 짚어 두었으니 그 위에서 시작하시면 됩니다.

## 증상

일정 화면에 시각이 둘 있고 서로 어긋납니다. 차이가 하루 동안 계속 커지고, 마지막 칸에서 「하루를 넘길 위험」이 켜집니다. 어제 12곳짜리에서는 **78분**까지 벌어졌습니다.

## 실측 — 오늘 만든 일정 (운영 DB, versionCode 9)

```
일 순  계획시각   계획끝    체류분  이동분
 0  1  09:00     12:00      180     12
 0  2  12:00     15:00      180      2
 0  3  15:00     18:00      180     13
 1  1  09:00     13:30      270      3
 1  2  13:30     18:00      270     21
```

**칸이 빈틈없이 붙어 있고 이동에 배정된 시간이 0분입니다.** 그리고 체류가 한 곳에 3시간, 이튿날은 **4시간 30분**입니다 — 횟집에 4시간 반 앉아 있는 계획입니다.

## 원인 — `ItineraryDraftService.slotFor`

```java
long windowMinutes = Duration.between(windowStart, windowEnd).toMinutes();
long slotMinutes = windowMinutes / countToday;     // 540 ÷ 3 = 180
LocalTime start = windowStart.plusMinutes(slotMinutes * index);
```

하루를 장소 수로 나눈 것이 그대로 체류 시간이 됩니다. 이동이 들어갈 자리가 없습니다.

## 🔴 왜 이동을 못 보는가 — 순서입니다

`buildDraft` 가 **칸을 먼저 앉히고 다리를 나중에 만듭니다.**

```java
List<Placed> placedToday = placeIntoSlots(trip, dayPlaces, visitDate);   // 137줄
...
List<DraftLeg> legs = this.legPlanner.buildLegs(trip, placeIdsByDay);    // 153줄
```

칸을 앉히는 시점에 이동 시간이 **아직 만들어지지 않았습니다.** `slotFor` 가 안 본 게 아니라 볼 것이 없었습니다.

**그리고 코드가 이미 그렇다고 적어 두었습니다.**

> `ESTIMATED` 다. `VERIFIED` 가 아니다 — 이 시각은 장소의 영업시간이나 **실제 이동 소요를 본 것이 아니라** 사용자가 정한 활동 시간대를 항목 수로 나눈 것뿐이다.

즉 **몰라서 난 버그가 아니라 알고 있던 한계**입니다. 화면의 「추정」 배지가 그 표시였고요.

## 왜 지금 사용자 눈에 고장으로 보이나

`ItineraryDelayProjector` 가 **다른 모델**로 같은 화면에 숫자를 하나 더 놓습니다.

```java
Instant predictedArrival = cursor.plus(travelMin);
Instant predictedDeparture = predictedArrival.plus(stayOf(item, factor));
cursor = predictedDeparture;                       // 계획에 다시 맞추지 않는다
```

계획은 이동을 0으로 보고 예측은 더합니다. 그래서 **둘의 차이는 반드시 그날 이동 합계만큼** 벌어지고, `overrunsDay` 는 이동이 조금만 있어도 마지막 칸에서 거의 항상 켜집니다 — **구조적으로 켜지는 경고**입니다.

## 고치는 방향 (제안입니다, 정하시는 건 효준님)

**다리를 먼저 만들고 칸을 앉히는 것**으로 보입니다.

```
slotMinutes = (windowMinutes − 그날 이동 합계) / countToday
start(i)    = windowStart + Σ(앞선 체류 + 앞선 이동)
```

그러면 계획과 예측이 같은 값이 되고, 경고는 진짜로 넘칠 때만 켜집니다.

**체류 시간도 같이 보실 값어치가 있습니다.** 하루를 나눠 갖는 방식이라 장소가 적을수록 한 곳에 오래 앉습니다 — 오늘처럼 2곳이면 한 곳에 4시간 반입니다. `SIGHT_SLOT_UNFILLED` 로 자리를 덜 채우게 되면서 이 값이 더 커졌을 수 있습니다.

## 🔴 프론트에서는 안 가립니다

두 숫자를 하나로 합치거나 경고를 숨기는 수정을 생각했는데 **하지 않기로 했습니다.** 지금 그 경고는 **사실을 말하고 있습니다** — 이 계획대로는 정말 하루를 넘칩니다. 화면에서 가리면 틀린 계획을 맞는 것처럼 보이게 만들 뿐입니다.

계획이 고쳐지면 프론트는 손댈 것이 없습니다. 혹시 계약(필드·경고 코드)이 바뀌면 그때 알려 주세요 — 화면 쪽은 제가 맞추겠습니다.

## 티켓

**S15P21E201-1130** 에 위 내용을 전부 코멘트로 남겼습니다. 담당자는 아직 저로 되어 있는데, **받으시면 옮기겠습니다.** 말씀만 주세요.

## 겹침

오늘 제가 만진 프론트 파일은 `app/trips/[id]/itinerary.tsx`(경고 문구 한 줄, !1036 머지됨)와 `src/collection/*` 입니다. `ItineraryDraftService` 근처는 아무것도 안 건드렸습니다.
