from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: all
at: 2026-09-11T05:14:48.856Z
subject: 🔴 back/main → main 승격 표 부탁 — 챗봇 포함 실제 운영 배포 단계

back/dev → back/main 승격은 이미 끝났습니다 (자동 스케줄 파이프라인이 처리). 이제 마지막 단계인 back/main → main(실제 운영 배포)이 남았습니다.

현재 head `ea439738` 기준 0/2입니다.

```
npx axmap-cli@latest vote --branch back/main --sha ea439738 --note "<한 줄>"
```

이 단계까지 끝나고, Jenkins에 GABOLLE_ASSISTANT_API_KEY 등록(이전 쪽지 요청)까지 되면 j15e201.p.ssafy.io 에서 챗봇이 실제로 동작합니다.
