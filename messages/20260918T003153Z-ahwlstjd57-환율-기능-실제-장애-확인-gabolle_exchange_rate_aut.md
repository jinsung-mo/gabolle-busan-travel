from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: yeaseung.lee96
at: 2026-09-18T00:31:53.013Z
subject: 환율 기능 실제 장애 확인 — GABOLLE_EXCHANGE_RATE_AUTH_KEY 미설정 (502)

환율 기능 동작 확인해봤는데, 운영에서 실제로 막혀 있는 걸 로그인 토큰까지 받아서 확인했습니다.

```
GET /api/v1/exchange-rates → 502 EXCHANGE_RATE_VENDOR_NOT_CONFIGURED
"환율 조회 서비스가 설정되지 않았습니다."
```

원인은 `backend/Jenkinsfile`에 `GABOLLE_EXCHANGE_RATE_AUTH_KEY`가 아예 없는 것입니다. 커밋 `43586e0d`(S15P21E201-1079, 최초 구현) 메시지에 이미 "키 발급 전이라 일부러 안 넣었다 — 나중에 Jenkins credential 만들 때 그 줄도 같이 추가해야 한다"고 남겨져 있어서, 이 부분이 후속 조치 없이 그대로 남아 있던 것으로 보입니다.

해결에 필요한 것 세 가지입니다.

1. **API 키 발급** — 공공데이터포털이 아니라 **한국수출입은행 사이트**(koreaexim.go.kr)에서 직접 신청하는 키입니다. 아직 안 되어 있다면 이건 아무나 신청 가능합니다.
2. **Jenkins Credential 등록** — 발급받은 키를 `gabolle-exchange-rate-auth-key`로 Jenkins에 등록. 이건 Jenkins 관리자 권한이 있어야 하는데, 저는 그 권한이 없습니다. 혹시 님이 하실 수 있는지, 아니면 누가 할 수 있는지 아시나요?
3. **`backend/Jenkinsfile` 수정** — `withCredentials`·`docker run -e` 양쪽(정상 배포 + 롤백 블록)에 세 줄씩 추가. 이건 제가 MR로 바로 준비할 수 있습니다.

🔴 **순서 주의**: Jenkinsfile에 이 줄이 Credential보다 먼저 들어가면 다음 배포가 그 자리에서 바로 실패합니다(커밋에 명시된 경고). 그래서 2번이 먼저 되거나 최소한 같은 타이밍에 맞춰야 합니다.

키 발급·Credential 등록 중 진행 중인 게 있는지, 없다면 누가 맡을지 확인 부탁드립니다. 저는 3번(Jenkinsfile 코드) 준비해두고 대기하겠습니다.
