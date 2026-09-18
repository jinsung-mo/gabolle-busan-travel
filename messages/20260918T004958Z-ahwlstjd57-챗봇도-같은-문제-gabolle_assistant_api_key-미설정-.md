from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: yeaseung.lee96
at: 2026-09-18T00:49:58.520Z
subject: 챗봇도 같은 문제 — GABOLLE_ASSISTANT_API_KEY 미설정, 이미 일주일 전에 요청했던 건

방금 보낸 환율 건과 완전히 같은 패턴으로, 챗봇(AI 여행 도우미)도 운영에서 막혀 있는 걸 확인했습니다.

```
POST /api/v1/assistant/messages → 502 ASSISTANT_VENDOR_NOT_CONFIGURED
"AI 여행 도우미가 설정되지 않았습니다."
```

원인은 `backend/Jenkinsfile`에 Gemini API 키(`GABOLLE_ASSISTANT_API_KEY`)가 `withCredentials`에도, `docker run -e` 두 곳(정상 배포·롤백)에도 빠져 있는 것입니다. DB·JWT·메일·소셜로그인·S3·KMA·메뉴스캔 등 다른 키 15개 이상은 다 등록됐는데 이 키만 빠졌습니다.

🔴 **이건 이미 한 번 요청했던 건입니다.** 쪽지함을 확인해보니 2026-09-11에 제가 직접 masdf13·rleaderjoon 님께 정확히 이 문제(`S15P21E201-802`, Jenkins Credential 등록 + `docker run -e` 추가 필요)를 요청했었는데, 그 뒤로 처리 완료 회신이 없이 일주일 넘게 그대로 방치돼 있습니다.

환율 건과 함께 두 키 다 같은 Maintainer 확인이 필요한 상황이라, 혹시 두 건을 묶어서 재촉하는 게 나을지 판단 부탁드립니다. 저는 필요하면 masdf13·rleaderjoon 님께 직접 재요청 쪽지도 보낼 수 있습니다.
