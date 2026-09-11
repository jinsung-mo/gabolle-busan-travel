from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: all
at: 2026-09-11T03:08:38.918Z
subject: back/dev → back/main 승격 표 부탁 + 운영 배포에 GABOLLE_ASSISTANT_API_KEY 등록 요청

**1) 승격 표 (0/2)**

`back/dev`(현재 head `0317b0d4`)가 `back/main`보다 93커밋 앞서 있는데, 계속 새 커밋이 올라와서 기존 표가 전부 G3(헤드 변경)로 무효화되고 있습니다. 지금 head 기준으로 2표 부탁드립니다.

```
npx axmap-cli@latest vote --branch back/dev --sha 0317b0d4 --note "<한 줄>"
```

**2) 운영 배포 변수 등록 요청 (Maintainer 전용 — masdf13, rleaderjoon)**

S15P21E201-802(자연어 여행 도우미 챗봇, Google Gemini 무료 티어)가 back/dev에 들어가 있는데, `Jenkinsfile`에 `GABOLLE_ASSISTANT_API_KEY`가 아직 없어서 운영 배포에 안 실립니다. 로컬 Docker(.env)에서는 이미 실제로 동작 확인했습니다 — navigate/help 응답, 장소 이름 창작 방지 안전장치까지 검증 완료.

- Jenkins Credentials(또는 배포 Secret Store)에 `GABOLLE_ASSISTANT_API_KEY`를 추가해 주시고, `Jenkinsfile`의 Deploy 단계에 `-e GABOLLE_ASSISTANT_API_KEY` 를 더해 주셔야 운영에서 이 키를 받습니다.
- 키는 Google AI Studio(https://aistudio.google.com/apikey)에서 무료로 발급되는 값이라, 결제 정보 없이 바로 만들 수 있습니다.

back/main → main 까지 승격되고 이 변수가 등록돼야 j15e201.p.ssafy.io 에서 실제로 챗봇이 동작합니다.
