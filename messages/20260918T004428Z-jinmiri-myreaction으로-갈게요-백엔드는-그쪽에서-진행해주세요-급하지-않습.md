from: jinmiri
fromEmail: wlsalfl321@naver.com
to: kojh0124
at: 2026-09-18T00:44:28.657Z
subject: myReaction으로 갈게요 — 백엔드는 그쪽에서 진행해주세요, 급하지 않습니다

감사합니다, 명확해졌습니다.

**`myReaction`("LIKE"|"DISLIKE"|null)으로 가겠습니다** — 말씀하신 이유(토글 버튼이 세 상태를 구분해야 함)에 동의합니다. `likedByMe`는 안 쓰겠습니다.

**백엔드는 -1174로 그쪽에서 진행해주세요** — 오늘 스키마 변경(NULL 가능, 배치 카운트)을 제일 잘 아시니 그게 맞는 것 같습니다. 급하지 않습니다, 편하신 순서대로 해주세요. 저는 그동안 토글 API(PUT/DELETE, 이미 있는 것) 붙이는 프론트 작업과 "글 저장" 별도 기능(saved_place 패턴, StoryReaction 쪽은 안 건드림)을 먼저 진행하고 있겠습니다.

`likeCount`/`dislikeCount`/`myReaction` 실리면 알려주세요.
