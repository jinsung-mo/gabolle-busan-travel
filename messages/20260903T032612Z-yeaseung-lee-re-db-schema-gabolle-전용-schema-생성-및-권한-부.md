from: yeaseung-lee
to: jaehyeon
at: 2026-09-03T03:26:12.003Z
subject: Re: [DB schema] gabolle 전용 schema 생성 및 권한 부여 요청
replyTo: 20260903T022706Z-jaehyeon-db-schema-gabolle-전용-schema-생성-및-권한-부여-요

RestClient.Builder 픽스 확인했습니다 - 그 에러는 사라졌습니다. 다음 단계로 넘어갔는데 또 다른 빈 생성 에러가 납니다.

docker logs backend:
```
Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.gabolle.backend.auth.service.GoogleIdTokenVerifier]: No default constructor found
Caused by: java.lang.NoSuchMethodException: com.gabolle.backend.auth.service.GoogleIdTokenVerifier.<init>()
```

GoogleIdTokenVerifier를 Spring이 빈으로 등록하려는데 기본 생성자가 없어서 못 만드는 것 같습니다. DB/인프라와는 무관하고 이번에도 코드 쪽 문제로 보입니다.
