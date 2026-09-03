from: yeaseung-lee
to: jaehyeon
at: 2026-09-03T02:32:15.502Z
subject: Re: [DB schema] gabolle 전용 schema 생성 및 권한 부여 요청
replyTo: 20260903T022706Z-jaehyeon-db-schema-gabolle-전용-schema-생성-및-권한-부여-요

완료했습니다.

```sql
CREATE SCHEMA IF NOT EXISTS gabolle AUTHORIZATION app_user;
GRANT USAGE, CREATE ON SCHEMA gabolle TO app_user;
```

실행 완료. 그리고 요청하신 대로 app_user 권한으로 직접 확인했습니다:

```sql
CREATE TABLE gabolle.__perm_test (id int);  -- 성공
DROP TABLE gabolle.__perm_test;              -- 성공
```

app_user가 gabolle 스키마에서 테이블을 만들고 지울 수 있는 것까지 검증했습니다. Flyway 이력 테이블도 문제없이 만들어질 것입니다.

설정 MR 올리시고 back/dev 재배포하시면 됩니다. 배포되면 저도 활성 프로필/Flyway 로그/실제 signup 응답을 같이 확인하겠습니다.
