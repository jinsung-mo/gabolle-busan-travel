from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: yeaseung.lee96@gmail.com
at: 2026-09-23T05:11:58.213Z
subject: [알림] 운영 Airflow 컨테이너 다섯을 멈췄습니다 — 지우지 않았고 docker start 로 되살아납니다 (S15P21E201-1516)

예승 님, 장효준 쪽입니다. `infra/personalization`(예승 님 관리)과 관련해 운영에서 한 일을 먼저 알려 드립니다.

## 왜
Airflow 가 정기적으로 돌리던 일은 `taste_vector_daily`(-942) 하나였고, 그 DAG 는 백엔드 `/stale` → `/rebuild` 를 부르는 것이 전부였습니다. 그 일을 백엔드 `@Scheduled` 로 옮겼습니다 (!1499 스케줄러 · !1507 스위치 켜기, 둘 다 `back/dev` 머지·배포 완료). 설문 저장 직후 판을 만드는 것(!1498)도 따로 돌고 있습니다 — 운영에서 저장 53ms 뒤 판 생성 확인.

## 한 일 (2026-09-23)
| 시각 (KST) | 무엇 |
|---|---|
| 12:37 | 백엔드 새벽 접기 스위치 켜짐 (`GABOLLE_TASTE_VECTOR_DAILY_FOLD_ENABLED=true`, 컨테이너에서 확인) |
| 12:39 | `airflow dags pause taste_vector_daily` → `is_paused=True` |
| 14:01 | `docker stop` 으로 `airflow-api-server`·`scheduler`·`worker`·`dag-processor`·`broker` **다섯만** 멈춤 |

- **지우지 않았습니다.** 컨테이너·볼륨·`airflow_db` 그대로입니다. `sample_personalization_pipeline` 도 그대로 있습니다
- postgres·minio·redis·mlflow 는 그대로 돕니다. 백엔드 헬스 200
- 서버 메모리 사용량 8,209MiB → 6,544MiB (1,665MiB 줄어듦)
- 멈추기 전 확인: Airflow 에 기대는 다른 서비스 없음, 도는 DAG 실행 없음, 새벽 백업 cron 은 `compose exec postgres` 만 써서 영향 없음

## 되살리려면
`docker start` 로 다섯을 켜면 됩니다. DAG 일시정지 상태가 `airflow_db` 에 남아 있어서 `taste_vector_daily` 는 멈춘 채로 뜹니다 (백엔드와 이중으로 접지 않습니다). DAG 를 다시 쓰시려면 Jenkins 전역 변수 `GABOLLE_TASTE_VECTOR_DAILY_FOLD_ENABLED=false` → 재배포 → `airflow dags unpause taste_vector_daily` 순서입니다.

## 🔴 여쭙고 싶은 것
지금은 `compose.yaml` 에 Airflow 가 그대로라 그 폴더에서 `docker compose up -d` 를 하면 다시 켜집니다. 그래서 **Airflow 서비스들에 `profiles: ["airflow"]` 를 붙여 기본 실행에서만 빼는 MR 을 `common/dev` 로 올리려고 합니다** (`--profile airflow` 를 주면 예전처럼 켜집니다. 파일에서 지우지는 않습니다).

MLOps 계획(S15P21E201-719)에서 Airflow 를 쓰실 계획이 있거나, 이 방식이 불편하시면 알려 주세요. MR 에 예승 님을 리뷰어로 걸겠습니다.
