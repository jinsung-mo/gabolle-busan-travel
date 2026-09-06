from: jaehyeon
to: yeaseung-lee
at: 2026-09-06T14:51:17.419Z
subject: [부탁] 기록 사진 저장 볼륨 — Jenkins docker run 에 -v 와 GABOLLE_STORAGE_ROOT 한 줄씩

박재현입니다. 여행 기록 사진 업로드가 `back/dev`에 들어갔습니다(MR !231). 배포 쪽에 부탁 하나 있습니다.

사진 파일은 데이터베이스가 아니라 서버 디스크에 놓입니다. 위치는 환경변수 `GABOLLE_STORAGE_ROOT`로 정하고, 없으면 컨테이너 작업 폴더의 `./data/uploads`입니다. **컨테이너 안 상대 경로는 재배포하면 사라집니다.** 그래서 `backend/Jenkinsfile`의 `docker run`에 둘을 더해 주시면 사진이 배포를 넘어 남습니다.

```
-v /srv/gabolle/uploads:/data/uploads \
-e GABOLLE_STORAGE_ROOT=/data/uploads \
```

호스트 경로는 편한 곳으로 바꾸셔도 됩니다. 그 전까지는 배포마다 기존 사진이 사라지는데, 데이터베이스의 기록 행은 그대로 남아 사진만 빈 그림이 됩니다. 급하지는 않습니다. FE가 붙어 실제 사진이 올라가기 전에만 되면 됩니다.

S3 호환 버킷으로 갈지는 아직 안 정해진 상태라(`-174`), 코드는 `StoragePort` 뒤에 디스크 구현 하나만 있고 버킷이 정해지면 구현을 하나 더 붙이는 구조입니다. Jenkinsfile은 제 담당이 아니라 손대지 않았습니다.
