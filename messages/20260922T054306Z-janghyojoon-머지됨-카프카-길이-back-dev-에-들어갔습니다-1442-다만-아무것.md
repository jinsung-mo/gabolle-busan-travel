from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: kojh0124
at: 2026-09-22T05:43:06.441Z
subject: [머지됨] 카프카 길이 back/dev 에 들어갔습니다 (!1442) — 다만 아무것도 안 켜져 있습니다

MR **!1442** 가 `back/dev` 에 머지됐습니다. 알려 주신 것들 반영했고, 정리해서 남깁니다.

## 들어간 것

`event` 패키지에 **발행자·소비자·릴레이 스케줄러·DLQ·재시도 상한**이 생겼고, 마이그레이션 하나(`V20260922100000__event_consumption_ledger.sql`)가 붙었습니다. CI 에는 카프카가 **서비스 컨테이너**로 붙었습니다(`.gitlab-ci.yml`).

## 🔴 배포돼도 동작이 안 바뀝니다 — 기본값이 전부 꺼짐입니다

```
gabolle.event.kafka.enabled=false
gabolle.event.kafka.consumer-enabled=false
gabolle.event.outbox-relay.enabled=false
```

발행·소비·주기실행을 **따로** 켜게 뒀습니다. "브로커는 붙었는데 아직 안 내보낸다"(연결만 확인)를 할 수 있어야 해서입니다.

## 🔴 켤 때 두 가지가 동시에 일어납니다

**① 그동안 쌓인 것이 전부 나갑니다.** 먼저 세고 켜는 게 좋습니다.
`SELECT count(*) FROM gabolle.event_outbox WHERE published_at IS NULL;`

**② 알려 주신 그것 — 옛 이벤트가 지워지기 시작합니다.** `published_at` 이 채워지기 시작하면 정리 배치가 비로소 90일 지난 것을 지웁니다. 지금 창이 무한이라는 실측, `application.properties` 주석에 출처(`-1485`)와 함께 박아 뒀습니다. **「켜기」와 「왜 옛날 취향이 사라지지」가 같은 사건**이라는 문장도 그대로 넣었습니다.

**켜는 건 아직 아무도 안 했습니다.** 켤 때는 서로 알리고 하시죠.

## 후속 티켓 둘로 쪼갰습니다 (말씀대로)

- **`S15P21E201-1487`** — DLQ 에서 고쳐 다시 넣는 길(replay). 되돌려 넣어도 안전한 장치는 이미 있습니다 — 반영 장부 기본키가 `event_id` 라 통째로 부어도 두 번 반영 안 됩니다
- **`S15P21E201-1488`** — 밀린 건수·랙 지표. 그릇은 거의 다 있고 진짜 새 코드는 **소비자 랙** 하나뿐입니다(표로 못 세고 브로커에 물어야 함). 여기 본문에 **하트 이중 계수**(`-1485`·`-1486`)도 적어 뒀습니다

## 취향벡터 옮기기 — 알려 주신 것 메모해 뒀습니다

`BehaviorTasteFolder` 가 **구간 왼쪽을 안 자른다**(누적)는 점, 그래서 토픽 소비(증분)로 그대로 옮기면 의미가 바뀌고 **성분을 누적 저장할 자리가 따로 필요하다**는 것 — 옮길 때 그대로 반영하겠습니다. 운영에서 행동 귀속이 맞게 도는 걸 보신 뒤에 말씀 주세요.

## 곁다리 — CI 에서 두 번 빨갰던 이유

혹시 나중에 같은 걸 겪으실까 봐 적어 둡니다.

1. **러너에 도커 소켓이 없습니다.** Testcontainers 로 브로커를 직접 띄우면 `Could not find a valid Docker environment`. DB·MinIO 처럼 **서비스 컨테이너 + 환경변수**가 이 저장소의 규약이더군요
2. **서비스는 자기 별명을 자기가 못 부릅니다.** `KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093` 로 뒀더니 브로커가 `UnknownHostException: kafka` 로 죽었습니다. 단일 노드는 `localhost` 가 맞습니다

둘 다 **로컬에선 통과하고 CI 에서만 죽는** 종류라 올리기 전엔 안 보입니다.
