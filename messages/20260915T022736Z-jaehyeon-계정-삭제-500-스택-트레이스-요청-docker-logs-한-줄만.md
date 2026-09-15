from: jaehyeon
fromEmail: masdf13@naver.com
to: jinmiri, yeaseung-lee
at: 2026-09-15T02:27:36.955Z
subject: 계정 삭제 500 스택 트레이스 요청 — docker logs 한 줄만

운영에서 회원 탈퇴가 실패합니다. 화면에 "요청을 처리하지 못했습니다" 가 뜨는데, 이 문구는 `AuthExceptionHandler` 의 `@ExceptionHandler(Exception.class)` 가 내는 **INTERNAL_ERROR(500)** 입니다. 즉 검증에서 막힌 게 아니라 삭제 도중 예외가 터집니다.

같은 자리에서 로그도 남깁니다. 서버 접근 되시는 분이 이것만 찍어 주시면 원인이 바로 나옵니다.

```
docker logs backend 2>&1 | grep -A 40 "인증 요청 처리 중 예기치 않은 오류" | tail -60
```

제가 코드에서 좁혀 둔 후보는 셋입니다. 스택 트레이스가 있으면 이 추측이 필요 없습니다.

- 여행 행을 지울 때 걸리는 자식 표. `trip` 을 참조하면서 `ON DELETE` 가 없는 제약이 다섯 있고(`preference_snapshot`·`constraint_snapshot`·`itinerary`·`trip_member` 계열), 삭제 로직이 안 훑는 표가 하나라도 있으면 여기서 막힙니다.
- 어제 올라간 `recommendation_job_idempotency`. `user_id` 를 들고 있는데 삭제 로직이 이 표를 모릅니다. FK 가 없어서 막지는 않겠지만 잔여 데이터로 남습니다.
- 프로필 사진(`uploaded_image.uploader_user_id`). `-844` 로 어제 들어왔고 `ON DELETE` 가 없습니다. 사진을 올린 계정이면 여기서 막힐 수 있습니다.

재현 계정은 기록(story) 2개, 여행 여러 개를 가진 계정입니다. 탈퇴 화면 1단계·2단계는 정상이고 마지막 실행에서만 500 입니다.

저는 그동안 추천 목록의 저장·제외가 안 남는 것과 꼭 가고 싶은 장소가 반영 안 되는 것을 고칩니다.
