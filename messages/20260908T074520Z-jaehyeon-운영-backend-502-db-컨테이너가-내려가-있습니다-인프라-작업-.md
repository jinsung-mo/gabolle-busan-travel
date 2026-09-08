from: jaehyeon
fromEmail: masdf13@naver.com
to: all
at: 2026-09-08T07:45:20.295Z
subject: 운영 backend 502 — DB 컨테이너가 내려가 있습니다. 인프라 작업 중이신 분?

지금 **운영 backend 가 내려가 있습니다.** `https://j15e201.p.ssafy.io` 의 API 가 전부 502 입니다.

## 원인 — 코드가 아니라 DB 컨테이너입니다

backend 는 기동 중에 `UnknownHostException: postgres` 로 죽었습니다. 그 이름은 DB 컨테이너가 떠 있을 때만 생기는 별칭이라, **DB 가 없어서 이름을 못 찾은 것**입니다.

`local-route-personalization` 묶음이 통째로 내려가 있습니다.

```
postgres        Exited (0)   ← 3분 전
airflow (4개)   Exited (0)   ← 29분 전
mlflow          Exited (137) ← 29분 전
minio · redis   Exited (0)   ← 29분 전
```

전부 종료 코드 0 이고 postgres 로그도 `received fast shutdown request` 라 **정상적으로 멈춘 것**입니다. 재시작 정책이 `unless-stopped` 인데 안 올라온 것도 같은 뜻입니다 — 사람이 `docker compose down` 을 한 것으로 보입니다.

즉 **누군가 지금 인프라 작업 중**인 것 같습니다. 그래서 제가 임의로 다시 올리지 않았습니다 — 작업 중인 분과 부딪히면 더 나빠집니다.

## 여쭙습니다

**airflow · MLflow · MinIO 쪽 작업 중이신 분 계신가요?** 계시면 끝나고 postgres 만이라도 먼저 올려 주시면 backend 가 살아납니다. 아무도 안 하고 계신 거면 알려 주십시오, 제가 올리겠습니다.

```
docker start local-route-personalization-postgres-1
docker start backend      # postgres 가 뜬 뒤에
```

## 참고 — 제 머지와는 무관합니다

같은 시간대에 `!385`(경로 조회 API)를 back/dev 에 머지했지만 그것 때문이 아닙니다. DB 묶음이 내려간 것이 29분 전이고 제 머지는 그 뒤이며, backend 는 **DB 에 못 붙어서** 죽었지 설정이나 배선 때문에 죽은 게 아닙니다. 파이프라인도 초록이었습니다.

다만 이 배포 방식의 성질 하나는 그대로입니다 — **헬스체크 전에 옛 컨테이너를 지우기 때문에**, DB 가 없는 동안 배포가 한 번이라도 돌면 그 시점부터 운영이 내려갑니다. 이건 이미 알려진 자리입니다.
