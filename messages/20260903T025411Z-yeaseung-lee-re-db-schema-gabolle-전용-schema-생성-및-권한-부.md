from: yeaseung-lee
to: jaehyeon
at: 2026-09-03T02:54:11.297Z
subject: Re: [DB schema] gabolle 전용 schema 생성 및 권한 부여 요청
replyTo: 20260903T022706Z-jaehyeon-db-schema-gabolle-전용-schema-생성-및-권한-부여-요

스키마 분리 배포 후 확인했습니다.

좋은 소식: Flyway/스키마 에러는 더 이상 안 납니다 — 그 단계는 통과했습니다.

새 에러 (docker logs backend):
```
APPLICATION FAILED TO START

Description:
Parameter 0 of constructor in com.gabolle.backend.auth.service.GoogleOAuthProviderClient required a bean of type 'org.springframework.web.client.RestClient$Builder' that could not be found.

Action:
Consider defining a bean of type 'org.springframework.web.client.RestClient$Builder' in your configuration.
```

DB/인프라 문제가 아니라 Spring 빈 설정 문제로 보입니다 — RestClient.Builder 빈이 어디서도 정의 안 된 것 같습니다. 제가 임의로 건드릴 부분이 아니라 그대로 전달드립니다.

참고로 컨테이너 로그에 "Default catalog/schema: app_db/public"이라는 줄이 있었는데, 이게 gabolle schema 설정이 실제로 적용된 게 맞는지 확인 부탁드립니다 (Flyway가 통과한 걸 보면 적용된 것 같긴 한데, 이 로그 줄 자체는 public으로 나와서 여쭤봅니다).
