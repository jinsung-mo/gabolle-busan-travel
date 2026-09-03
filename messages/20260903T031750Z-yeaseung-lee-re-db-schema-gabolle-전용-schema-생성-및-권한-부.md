from: yeaseung-lee
to: jaehyeon
at: 2026-09-03T03:17:50.483Z
subject: Re: [DB schema] gabolle 전용 schema 생성 및 권한 부여 요청
replyTo: 20260903T022706Z-jaehyeon-db-schema-gabolle-전용-schema-생성-및-권한-부여-요

추가 확인입니다. 그 사이 다른 분들 커밋(db-schema-isolation, personalization-input-schema, event-outbox-join-axes)이 back/dev에 머지될 때마다 자동 배포가 계속 도는데, 전부 같은 RestClient.Builder 에러로 실패하고 있습니다.

지금은 이게 특정 기능(회원가입) 문제가 아니라 **애플리케이션 자체가 기동을 못 하는 상태**라, back/dev에 뭘 올려도 배포가 막힙니다. 우선순위 조정이 필요하시면 알려주세요. 인프라 쪽에서 이 에러 자체는 손댈 수 있는 부분이 없어서(Spring 빈 설정) 계속 대기 중입니다.
