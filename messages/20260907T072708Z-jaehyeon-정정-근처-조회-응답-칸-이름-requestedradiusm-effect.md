from: jaehyeon
fromEmail: masdf13@naver.com
to: jinmiri
at: 2026-09-07T07:27:08.892Z
subject: [정정] 근처 조회 응답 칸 이름 — requestedRadiusM · effectiveRadiusM 입니다

아까 쪽지에서 근처 조회 응답을 `radiusMeters`·`radiusExpanded` 로 적었는데, 실제 칸 이름이 다릅니다. 화면을 그 이름으로 만들면 값을 못 읽으니 지금 바로잡습니다.

**요청**은 `radiusMeters` 가 맞습니다. `GET /api/v1/places/nearby?lat=&lng=&radiusMeters=500&facetKey=SOUVENIR_SHOP&limit=20`.

**응답**은 이 이름들입니다.

```
requestedRadiusM   요청한 반경 (500)
effectiveRadiusM   실제로 찾은 반경 (안 넓혔으면 500, 넓혔으면 1000)
radiusExpanded     넓혔는가 (true/false)
expansionSteps     몇 번 넓혔는가 (0 또는 1)
facetKeyApplied    갈래 필터가 걸렸는가
scanTruncated      후보가 너무 많아 일부만 거리를 재었는가
items[].distanceM  미터 단위 거리 (정수)
```

"근처에 없어서 조금 넓혀 찾았어요" 안내는 `radiusExpanded` 로 판단하시고, 실제 거리는 `effectiveRadiusM` 을 쓰시면 됩니다.

동작에서 하나 더 정해야 했던 게 있어서 알려 둡니다. **`radiusMeters` 를 보내면 "하나라도 있으면 멈춤" 이고, 안 보내면 "여러 개 모일 때까지 넓힘" 입니다.** 이 엔드포인트에는 원래 반경 사다리(1km→2km→5km)가 있고, 설정된 최소 개수를 채울 때까지 계속 넓히도록 되어 있었습니다. 그런데 화면이 "500m 안" 이라고 말해 놓고 개수를 채우려고 5km 결과를 보여주면 그건 요청한 숫자를 서버가 무시한 겁니다. 그래서 반경을 명시한 요청은 그 반경을 존중하고, 하나도 없을 때만 두 배로 한 번 넓힙니다. 두 배로도 없으면 빈 목록입니다.

반경은 100m~20000m 만 받습니다. 그 밖은 400 이고 `fields` 에 `radiusMeters` 가 담깁니다.

그리고 `purpose` 와 `facetKey` 를 **함께 보내면 400** 입니다. 하나를 조용히 이기게 하면 보낸 필터가 무시된 것을 화면이 알 수 없어서입니다. 지금은 `facetKey` 만 쓰시면 됩니다 — `purpose` 는 설정이 비어 있어 어차피 아무것도 못 좁힙니다.
