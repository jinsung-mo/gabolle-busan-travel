from: kojh0124
fromEmail: kojh0124@gmail.com
to: janghyojoon, yeaseung-lee
at: 2026-09-09T02:33:51.217Z
subject: [상의] 제가 만든 Airflow 스택이 infra/personalization 과 겹칩니다 — 합치려는데 질문 셋

두 분께 같이 보냅니다. 답이 서로 물려 있어서 각자 따로 여쭙는 것보다 나을 것 같습니다.

## 무슨 일인가 — 제 실수부터

취향 벡터 배치를 만들면서 **Airflow 스택을 새로 하나 세웠습니다**(`mlops/`). 그런데 오늘 보니 `infra/personalization/` 에 이미 있더군요. **`common/dev` 에만 있고 `back/dev` 에는 없어서** 제가 못 봤습니다 — 제 작업 트리에서는 그 폴더가 아예 존재하지 않습니다.

그래서 제가 써 둔 문서에 *"저장소에 배치 모양의 구멍이 있다"* 고 적혀 있는데, `back/dev` 기준으로는 맞고 저장소 전체로는 틀린 말입니다. 같은 이유로 *"CeleryExecutor 로 안 바꾼다"* 도 적어 뒀는데, 팀 스택은 이미 Celery 더군요. 죄송합니다.

| | 기존 (떠 있음) | 제가 만든 것 (아직 커밋 안 함) |
|---|---|---|
| 위치 | `infra/personalization/` | `mlops/` |
| Airflow | **3.0.3**, CeleryExecutor | 2.10.5, LocalExecutor |
| 같이 뜸 | MLflow · MinIO · Redis | PostgreSQL 하나 |
| 이미 깔림 | mlflow · lightgbm · boto3 | 없음 |
| 포트 | 8082 | 8081 |

포트는 안 겹칩니다. 문제는 **4코어에 Airflow 를 두 벌 띄우는 것**이고, 장효준 님이 어제 스택을 잠깐 멈춰 달라고 하신 그 상황이라 더 그렇습니다.

**그래서 제 쪽을 접고 기존 스택으로 합치려 합니다.** 아직 아무것도 안 옮겼고 커밋도 안 했습니다.

## 지금 있는 것

- **백엔드** (`back/dev`) — 취향 벡터 접기 + 기계용 내부 API(`/internal/v1/batch/taste-vectors`, `X-Internal-Token`). 진짜 PostgreSQL 16 에서 **13개 통과** 확인했습니다
- **DAG 둘** — `taste_vector_build`(일 1회, catchup, backfill), `connectivity_check`. 로컬에서 실제로 끝까지 돌려 봤습니다

핵심은 **Airflow 가 DB 에 직접 안 쓴다**는 것입니다. 판 교체가 트랜잭션 하나 안에서 끝나야 해서(`uq_user_taste_vector_current`) Spring 을 부르고, Airflow 는 언제 시킬지만 정합니다.

## 🔴 질문 셋

### 1. 장효준 님 — 조각을 719 안에 넣을까요, 옆에 뺄까요

제가 만든 것이 **S15P21E201-719 의 작업 내용 ③**(`user_taste_vector` 새 판)과 같은 일입니다. 앞의 ①② 와 뒤의 ④⑤⑥⑦(오프라인 평가·MLflow·MinIO·승격)은 손 안 댔습니다.

719 안에 흡수시킬지, 형제 티켓으로 빼고 719 를 ④~⑦ 로 좁힐지 정해 주시면 그대로 따르겠습니다.

**그리고 배포에 걸리는 게 있는지 하나만 확인 부탁드립니다.** 지금 `compose.yaml` 이 마운트하는 건 `./airflow/dags` 하나뿐입니다.

```yaml
volumes:
  - ./airflow/dags:/opt/airflow/dags
```

제 DAG 가 `from gabolle import internal_api` 로 `plugins/gabolle/` 를 부르는데, 이대로 옮기면 import 에서 죽습니다. `./airflow/plugins:/opt/airflow/plugins` 한 줄을 더해야 합니다. 그쪽 Jenkins 배포나 이미지 굽는 흐름에 걸리는 게 있을까요.

(하나 더 — `apache-airflow-providers-http` 가 `airflow/requirements.txt` 에 없습니다. `HttpHook` 이 그걸 씁니다. 이것도 한 줄입니다.)

### 2. 이예승 님 — 4코어에서 DAG 하나 더, 메모리가 될까요

`S15P21E201-750` 으로 `airflow-api-server` 한도를 올리신 직후라 여쭙니다. `taste_vector_build` 는 하루 1회, `max_active_runs=1` 이고 무거운 계산은 전부 백엔드에서 돕니다 — Airflow 쪽은 HTTP 부르고 결과 세는 게 전부라 워커 부담은 작을 겁니다. 그래도 지금 여유가 어떤지는 제가 모릅니다.

**안 되면 스케줄을 늦추거나 당분간 수동 실행만 해도 됩니다.** 그쪽이 급하면 순서를 뒤로 미루겠습니다.

### 3. 두 분 다 — 백엔드 쪽 티켓을 새로 팔까요

백엔드 조각 둘(내부 API·인증 / 벡터 접기)은 `common/dev` 와 무관하게 `back/dev` 로 바로 갈 수 있습니다. 티켓을 새로 만들지, `S15P21E201-541`(개인화 데이터·MLOps 기반) 에이픽 아래 이미 있는 `S15P21E201-551` 쪽에 붙일지 — 중복 티켓이 이미 여섯 개 나왔다고 하셨으니 그냥 새로 파는 게 맞는지 판단이 안 섭니다.

## 참고 — 파트를 넘는 계약이라 안전장치를 셋 넣었습니다

서버는 `back/dev`, DAG 는 `common/dev` 라 **한쪽만 배포되는 때가 반드시 생깁니다.** 그때 조용히 어긋나지 않게 이렇게 해 뒀습니다.

- 경로에 판 번호 (`/internal/v1/…`) — 모양을 바꾸면 `/v2/` 를 새로 내고 한동안 둘을 같이 둡니다
- DAG 가 응답 칸을 **받는 자리에서 검사**합니다. 예전엔 기본값 0 으로 읽었는데, 그러면 서버가 칸 이름을 바꾼 날 전부 0 이 되고 **실패 비율 검사가 아예 안 돌면서 DAG 는 초록**으로 끝났습니다
- 목록이 상한에 걸려 잘리면 `truncated` 로 알립니다. 없으면 밀린 사람이 하루에 상한만큼씩만 빠지면서 배치는 날마다 초록입니다

셋 다 "초록인데 아무것도 안 뜻하는 것" 을 막는 것이라, `backend:build` 의 건너뜀 검사와 같은 줄기로 봤습니다.

계획 문서를 따로 써 뒀는데 아직 push 를 안 해서 두 분이 볼 수 없습니다 — 조각 1 MR 에 같이 올리겠습니다. 그 전에 위 셋만 정해 주시면 바로 움직이겠습니다.
