from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: yeaseung.lee96@gmail.com
at: 2026-09-23T05:30:29.552Z
subject: [리뷰 부탁] !1513 (Draft) — 앞 쪽지보다 범위가 넓어졌습니다: infra 배포 Jenkinsfile 도 고쳐야 했습니다

예승 님, 앞 쪽지(Airflow 컨테이너 멈춤)의 후속입니다. **MR !1513 을 Draft 로 열고 리뷰어로 걸었습니다. 예승 님 확인 전에는 머지하지 않습니다.**

## 범위가 넓어진 이유
앞 쪽지에서는 `compose.yaml` 에 `profiles: ["airflow"]` 만 달겠다고 했는데, 그것만으로는 못 막는다는 것을 알았습니다.

- `infra-personalization-deploy` 가 **common/dev push 마다** `up -d --no-deps ${DEPLOY_SERVICES}` 를 도는데, 그 목록에 Airflow 다섯이 **이름으로** 들어 있습니다. compose 는 이름으로 부른 서비스는 profile 이 있어도 켭니다
- 헬스체크가 `:8082/api/v2/monitor/health` 를 기다려서, Airflow 가 없으면 15분 뒤 배포가 실패합니다

그래서 profile 만 단 MR 을 머지하면 **그 머지가 Airflow 를 다시 켰을 것**입니다.

## !1513 이 바꾸는 것
- `compose.yaml`: `x-airflow-common` 과 `airflow-broker` 에 `profiles: ["airflow"]`
- `Jenkinsfile`: `booleanParam AIRFLOW_ENABLED`(기본 false). 새 단계 `Resolve Services` 가 배포·빌드 목록을 정하고, 헬스체크·실패 로그도 같은 스위치를 봅니다. 켜면 예전과 똑같이 돕니다
- `README.md`: 기동 명령에 `--profile airflow`

## 확인한 것 / 못 한 것
- `docker compose config --services`: 이름표 없으면 postgres·redis·minio·mlflow, `--profile airflow` 면 원래 10개
- Groovy 로 파싱하고 헬스체크 명령 문자열을 스위치 꺼짐·켜짐으로 실제 평가 — 켜짐일 때 예전 문장과 같습니다
- 🔴 **Jenkins 에서 직접 돌려 보지는 못했습니다.** 이 파일을 검사하는 CI 잡도 없습니다. 첫 번째 새 파라미터 빌드에서 `params.AIRFLOW_ENABLED` 가 기본값(false)으로 잡히는지는 머지 뒤 빌드 로그의 `Resolve Services` 줄로 확인하려고 합니다

MLOps(S15P21E201-719) 쪽 계획과 부딪히거나, 스위치를 파라미터 말고 다른 방식(전역 변수 등)으로 두는 게 나으시면 MR 에 남겨 주세요.
