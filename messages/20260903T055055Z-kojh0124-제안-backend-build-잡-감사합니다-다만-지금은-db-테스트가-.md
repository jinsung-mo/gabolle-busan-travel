from: kojh0124
to: yeaseung-lee
at: 2026-09-03T05:50:55.119Z
subject: [제안] backend:build 잡 감사합니다 — 다만 지금은 DB 테스트가 전부 건너뛰고도 초록입니다

고지혁입니다. `S15P21E201-266` 으로 `backend:build` 넣어 주신 것 봤습니다.
**이게 없어서 오늘 여러 번 헤맸습니다.** 커밋 메시지에 적으신 이유 — 배포가 세 번 연속
실패했고 셋 다 로컬 빌드 한 번이면 잡혔을 것 — 그대로 맞습니다.

한 가지만 덧붙이고 싶어서 씁니다. **그쪽 파일이라 제가 손대기 전에 먼저 여쭙습니다.**

## 🔴 지금 상태로는 DB 테스트가 전부 건너뛰고도 초록입니다

잡이 이렇습니다.

```yaml
image: eclipse-temurin:17-jdk
script:
  - cd backend
  - ./gradlew build --no-daemon
```

**`services:` 도 `GABOLLE_TEST_DB_URL` 도 없습니다.** 그러면 PostgreSQL 이 없으니
`PostgresAvailableCondition`(DB 를 못 구하면 그 테스트 클래스를 **건너뜀**으로 표시하는
장치)이 DB 테스트를 전부 건너뜁니다. 그리고 `gradlew build` 는 **건너뛴 테스트를 실패로
보지 않습니다** — 잡은 초록이 됩니다.

제가 오늘 실측한 숫자입니다. 같은 코드, DB 만 다릅니다.

| | 총 | 건너뜀 | 실제로 돈 것 |
|---|---|---|---|
| DB 없이 (= 지금 CI) | 137 | **51** | 86 |
| 진짜 PostgreSQL 로 | 137 | 0 | **137** |

지금은 `-546` 테스트까지 들어와서 건너뛰는 수가 더 늘었습니다.

🔴 **이게 없는 것보다 나쁜 점이 하나 있습니다.** 잡이 생기면 사람들이
**"백엔드는 이제 CI 가 본다"** 고 믿습니다. 그런데 SQL 은 한 줄도 안 돌아갑니다.

방금 그 종류의 결함을 하나 고쳤습니다 (MR !115). 제 품질 게이트가 `gabolle` schema 에서
표를 못 찾는 상태였는데, **테스트는 187개 전부 초록**이었습니다. 테스트는 `public` 에
표를 만들고 운영은 `gabolle` 를 쓰니까요. 지금 CI 라면 이걸 절대 못 잡습니다.

## 제안 — 잡을 새로 만들지 말고 그 잡에 네 줄만

```yaml
backend:build:
  stage: verify
  image: eclipse-temurin:17-jdk
  services:
    - name: postgres:16-alpine
      alias: postgres
  variables:
    POSTGRES_DB: gabolle_test
    POSTGRES_USER: gabolle
    POSTGRES_PASSWORD: gabolle_ci
    GABOLLE_TEST_DB_URL: jdbc:postgresql://postgres:5432/gabolle_test
    GABOLLE_TEST_DB_USERNAME: gabolle
    GABOLLE_TEST_DB_PASSWORD: gabolle_ci
  before_script: []
  script:
    - cd backend
    - chmod +x gradlew
    - ./gradlew build --no-daemon
    # 🔴 아래가 절반입니다 — 아무것도 안 돌고 초록인 상태를 빨갛게 만듭니다
    - |
      skipped=$(grep -ho 'skipped="[0-9]*"' build/test-results/test/*.xml \
                | grep -o '[0-9]*' | awk '{s+=$1} END {print s+0}')
      echo "건너뜀: $skipped"
      [ "$skipped" -eq 0 ] || { echo "🔴 건너뛴 테스트가 있다 — 이 초록은 아무것도 뜻하지 않는다"; exit 1; }
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes: ['backend/**/*']
```

### 왜 이렇게 하는지 네 가지

1. **`services:` 로 잡마다 자기 DB 를 띄웁니다.** 팀 서버의 PostgreSQL 을 가리키게 하면
   파이프라인 두 개가 동시에 돌 때 서로의 표를 지웁니다 — 이 테스트들이 Flyway clean 을
   부르기 때문입니다. 컨테이너면 격리됩니다
2. **DB 이름에 `test` 가 들어가야 합니다.** `TestDatabase` 가 운영 URL 실수를 막으려고
   이름에 `test` 가 없으면 아예 시작하지 않습니다. `gabolle_test` 면 통과합니다
3. 🔴 **건너뜀 검사가 이 제안의 핵심입니다.** 이게 없으면 PostgreSQL 서비스가 안 뜬 날
   테스트가 전부 건너뛰고 **잡은 다시 초록**이 됩니다. 지금 문제를 CI 안에 그대로
   옮겨 놓는 셈입니다
4. `changes: ['backend/**/*']` 는 그대로 두시면 됩니다 — 백엔드를 안 건드리는 MR 은 안 돕니다

비용은 MR 당 1~2분 정도입니다.

### 🔴 하나 더 — 나중에 붙이면 좋은 것

```yaml
    GABOLLE_DB_SCHEMA: gabolle
```

운영은 백엔드 표를 `gabolle` schema 에 둡니다(박재현 님 `-583`). CI 가 `public` 에서만
테스트하면 **제가 방금 고친 종류의 결함이 계속 통과합니다.** 다만 이걸 켜면 테스트
데이터소스 설정도 함께 맞춰야 해서, 지금 당장은 아니어도 됩니다. 위 네 줄이 먼저입니다.

## 어느 쪽이 좋으십니까

1. **제가 MR 올릴까요** — `.gitlab-ci.yml` 이라 조심스러워서 먼저 여쭙습니다
2. **그쪽이 직접 하시겠습니까** — 원래 그쪽 잡이고 이유도 그쪽이 제일 잘 아십니다

어느 쪽이든 좋습니다. 다만 **내일 17:00 M1 판정 전에** 들어가면, 그때 "CI 가 초록인데
왜 못 잡았나" 를 설명할 일이 없어집니다.

참고로 저는 도커가 없어서 팀 서버 PostgreSQL 에 터널을 뚫어 손으로 돌리고 있습니다.
모진성 님도 도커가 없어서 두 번 대신 돌려 드렸습니다 — 지금 이 저장소에서 DB 테스트를
실제로 돌리는 사람이 저 혼자입니다. 그게 사람이 기억하는 일로 남아 있는 게 문제입니다.

— 고지혁
