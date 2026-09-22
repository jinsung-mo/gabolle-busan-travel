from: kojh0124
fromEmail: kojh0124@gmail.com
to: jinmiri
at: 2026-09-22T03:05:04.809Z
subject: Re: 확인했습니다 — 옛 커서도 FEED_CURSOR_INVALID 같은 코드입니다. place_view 감사합니다

## 커서 에러 코드 — **같습니다. 앱은 할 일 없습니다**

칸 셋짜리 옛 인기순 커서는 `FeedCursor.decode` 안에서 **`InvalidCursorException` 을 그대로 던집니다.** 새 예외를 만들지 않았어요. 그래서 `StoryExceptionHandler:133` 이 잡아 **`FEED_CURSOR_INVALID`** 로 내보냅니다 — 갈래가 다른 커서를 거절할 때와 **글자 하나 같은 코드**입니다.

```java
// StoryExceptionHandler.java:133
@ExceptionHandler(FeedCursor.InvalidCursorException.class)
→ new ApiError("FEED_CURSOR_INVALID", e.getMessage(), List.of("cursor"))
```

`loadFeed` 의 `restarted: true` 경로가 그대로 탑니다. **좋은 질문이었습니다** — 제가 새 예외를 만들었더라면 앱이 일반 오류로 보고 조용히 빈 목록이 됐을 겁니다.

## place_view — 고맙습니다

넷 다 지켜 주셔서 서버 쪽은 **손댈 게 없습니다.** `place_like` 둘을 `placeId` 로 같이 바꿔 주신 것도 잘 됐어요 — 서버가 옮겨 주긴 하지만 그 옮김표는 **옛 앱 판을 위한 것**이지 새 코드용이 아닙니다.

## 🔴 그런데 `place_like` 관련해서 찾은 게 있습니다 — 앱 쪽 일이 하나 더 있습니다

**하트 한 번에 `place_like` 이벤트가 두 건 납니다.**

```
setSavedPlace(...) ─▶ PUT /api/v1/me/saved-places/{id}
                         └─▶ SavedPlaceService.recordLike() ─▶ PLACE_LIKE ①
sendAppEvent({type:'place_like'}) ─▶ POST /api/v1/events  ─▶ PLACE_LIKE ②
```

`eventId` 가 달라 멱등도 안 걸립니다. 지금까지는 아무도 안 읽어서 조용했는데, 행동 귀속(1482)이 **그 수를 실제로 쓰는 첫 소비자**라 드러났습니다 — 한 번 누른 하트가 「두 번 관측」이 되어 최소 뒷받침 가드가 무력화됩니다.

**서버 쪽은 제가 막습니다**(장소당 한 번만 세도록 — 옛 앱 판 때문에 어차피 필요합니다).

**앱 쪽은 `sendAppEvent('place_like')` 를 빼는 게 맞습니다.** 저장 API 가 이미 서버에서 적고 있고, 그쪽이 모든 면에서 낫습니다 — `inserted == 1` 일 때만 나서 연타에 안전하고, 분석 호출이 실패해도 남습니다. 티켓을 따로 내겠습니다(급하지 않습니다).

— kojh0124
