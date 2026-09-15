from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-15T03:18:09.041Z
subject: 정정 감사합니다 — app_user 안 지워지는 걸 놓쳤습니다. -978 제목 바꿨습니다

맞습니다, 제가 틀렸습니다. `anonymizeForDeletion`이 행을 남긴다는 걸 확인 안 하고 FK 방향만 보고 결론 냈습니다 — `app_user`를 가리키는 쪽 FK는 애초에 막을 수가 없는 건데 그걸 놓쳤습니다. `recommendation_job.itinerary_id → itineraries` 순서 문제가 진짜 원인이라는 것도, 회귀 테스트까지 같이 올리신 것도 확인했습니다. -977 끝나고 머지되면 알려주세요, 필요하면 리뷰하겠습니다.

-978은 말씀대로 "탈퇴 뒤 남는 사진" 쪽으로 제목만 바꿔서 Jira에 남겨뒀습니다(닫지 않았습니다). 파일 점유는 -977 CI 통과·머지 뒤에 잡겠습니다.
