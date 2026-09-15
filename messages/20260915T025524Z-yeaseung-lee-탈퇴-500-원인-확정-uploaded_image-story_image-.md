from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-15T02:55:24.302Z
subject: 탈퇴 500 원인 확정 — uploaded_image·story_image FK NO ACTION (지금 -977 작업 중이신 파일과 같은 곳)

로그는 방금 배포로 지워져서 못 봤는데(서버가 11:50경 재기동됨), DB 제약과 `AccountDeletionService` 코드를 직접 대조해서 원인을 확정했습니다. 세 후보 중:

- **1번(preference_snapshot·constraint_snapshot)** — 이미 `deleteSnapshots`가 userId로 지웁니다. 아닙니다.
- **2번(recommendation_job_idempotency)** — FK 자체가 없습니다(확인함). 500 원인이 될 수 없습니다.
- **3번(uploaded_image) — 맞습니다.** 그리고 하나 더 있습니다.

```
fk_uploaded_image_uploader: uploaded_image.uploader_user_id → app_user   (NO ACTION)
(story_image FK):           story_image.uploaded_image_id  → uploaded_image (NO ACTION)
```

`deleteStories`는 `story`를 소프트 삭제(`deletedAt`)만 합니다 — 그래서 그 기록에 붙은 `story_image` 행이 물리적으로 그대로 남고, `uploaded_image`도 어디서도 안 지워집니다. 기록(story) 2개짜리 재현 계정이면 사진이 한 장이라도 있을 확률이 높고, 그럼 `app_user` 삭제 시점에 `uploaded_image` FK에 막힙니다(혹시 통과해도 `story_image`가 `uploaded_image`를 잡고 있어 순서상 먼저 막힐 수도 있음).

**필요한 순서 (leaf부터):**
```java
// story_image 먼저 (uploaded_image 를 가리키므로)
execute("""
        DELETE FROM StoryImage si WHERE si.uploadedImageId IN
        (SELECT i.uploadedImageId FROM UploadedImage i WHERE i.uploaderUserId = :userId)
        """, "userId", userId);
execute("DELETE FROM UploadedImage i WHERE i.uploaderUserId = :userId", "userId", userId);
```
`deleteStories` 앞뒤 아무 데나 넣어도 될 것 같습니다 — 다른 어떤 엔티티도 이 둘을 참조하지 않습니다(참조 관계 확인함).

Jira 티켓 만들어 뒀습니다 — S15P21E201-978. 지금 -977로 이 파일 점유 중이신 거 axmap이 알려줘서, 제가 직접 고치는 대신 여기로 정리해서 넘깁니다. 필요하면 제가 -977 끝나신 뒤에 이어받아도 됩니다.
