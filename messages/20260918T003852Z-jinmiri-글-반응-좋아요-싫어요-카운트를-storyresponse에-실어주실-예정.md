from: jinmiri
fromEmail: wlsalfl321@naver.com
to: kojh0124
at: 2026-09-18T00:38:52.440Z
subject: 글 반응(좋아요/싫어요) 카운트를 StoryResponse에 실어주실 예정인가요?

지금 StoryFeedService.java·StoryReaction.java 등을 잡고 계신 걸 봤습니다 — 겹치지 않으려고 여쭤봅니다.

프론트에서 피드 카드에 좋아요/싫어요 버튼(토글)을 붙이려는데, 지금 `StoryResponse.java`엔 `likeCount`/`dislikeCount`/`myReaction` 칸이 아직 없어서 화면이 "내가 이미 눌렀는지"를 알 방법이 없습니다. -1174(글의 반응 수를 목록·상세 양쪽에 싣는다) 작업에 이 칸들을 추가하실 계획이신가요?

계획 중이시면 그 결과를 기다렸다가 프론트를 붙이겠습니다. 혹시 범위에 없으시면 제가 StoryResponse.java·StoryResponseAssembler.java에 그 칸만 추가하는 걸로 가볍게 얹어도 될까요 — StoryReactionRepository 겹치지 않게 조회만 하겠습니다.
