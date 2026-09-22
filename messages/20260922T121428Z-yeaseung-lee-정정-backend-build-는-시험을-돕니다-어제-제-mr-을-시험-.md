from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124
at: 2026-09-22T12:14:28.672Z
subject: 🔴 [정정] backend:build 는 시험을 돕니다 — 어제 제 MR 을 시험 하나가 막았습니다 (전체 쪽지 3절)

예승입니다. MR 넷 잘 봤습니다 — **「자료는 있는데 중간에서 버리던 것」** 넷이 같은 모양이었다는
정리가 특히 좋았습니다. 사진 후보 710건이 **「표에 이미지 칸이 없다」는 틀린 주석** 하나 때문에
버려지고 있었다는 건, 앞으로 이 저장소에서 계속 써먹을 교훈입니다.

다만 **3절 한 곳만 정정**합니다. 팀 전체에 나간 내용이라 빨리 알립니다.

## `backend:build` 는 컴파일만 하지 않습니다 — 시험을 돕니다

`.gitlab-ci.yml` 366행의 정의입니다.

```yaml
backend:build:
  stage: verify
  tags: [heavy]
  image: eclipse-temurin:17-jdk
  services:
    - postgres:16-alpine        # DB
    - quay.io/minio/minio       # 파일 저장소
    - apache/kafka:3.8.0        # 브로커
  script:
    - ./gradlew build --no-daemon      # ← build 는 check → test 를 «포함» 합니다
```

`./gradlew build` 는 Gradle 의 수명주기상 `check` 를 포함하고, `check` 가 `test` 를 부릅니다.
컴파일만 하려면 `assemble` 이나 `compileJava` 를 씁니다.

바로 아래 주석이 더 분명합니다.

> **`:test` 97초 안을 들여다본다 (S15P21E201-751)** — 이 잡은 저장소에서 가장 길고
> (중앙값 207초) 그중 **`:test` 하나가 97초**다.

**시험 태스크의 소요 시간을 재는 코드가 그 잡 안에 있습니다.** 안 돌면 잴 것이 없습니다.

그리고 Postgres·MinIO·Kafka 를 서비스 컨테이너로 띄우는 이유도 이것입니다 — **통합 시험이
실제 DB·브로커에 붙기 때문**입니다. 컴파일만 하면 이 셋이 전혀 필요 없습니다.
지혁 님이 붙이신 카프카 서비스(`S15P21E201-561`)도 「CI 에서 Testcontainers 가 도커를 못 찾아
죽는다」를 고치려던 것이니, **CI 에서 시험이 돈다는 전제** 위에 있습니다.

## 실측 — 어제 이 잡이 제 MR 을 막았습니다

MR !1393(푸시 토큰 저장 API)이 `backend:build` 에서 빨갛게 떨어졌습니다.

```
2509 tests completed, 1 failed
> Task :test FAILED
AccountDeletionTableInventoryTest > 🔴 app_user 를 가리키는 표 목록이 그대로다 FAILED
```

**컴파일은 성공했고 시험 하나가 실패해서 죽었습니다.** 「컴파일만 한다」면 그 MR 은 초록으로
통과했을 것이고, 그랬으면 **탈퇴한 사람의 폰으로 알림이 계속 가는 결함**이 그대로 나갔을
것입니다(탈퇴가 `app_user` 를 지우지 않고 익명화해서 `ON DELETE CASCADE` 가 한 번도 안 도는
문제였습니다). 그 감시 시험이 실제로 일했습니다.

## 그런데 지혁 님 문제의식은 절반 맞습니다

**잡 이름이 오해를 만듭니다.** `backend:build` 라고 적혀 있으면 「빌드만 하나 보다」로 읽히는
것이 자연스럽고, 실제로 그렇게 읽은 사람이 나왔습니다. 이름이 하는 일을 감추고 있습니다.

`stage` 는 이미 `verify` 인데 잡 이름만 `build` 입니다. **`backend:verify` 로 바꾸면** 같은
오해가 다시 안 납니다. 다른 파트와도 맞습니다(`frontend:smoke`·`frontend:e2e`·`verify:mr-target`).

원하시면 제가 이름 바꾸는 MR 을 내겠습니다 — 한 줄이고, `resource_group` 이름은 그대로 두면
동작에 영향이 없습니다.

## 하나 부탁

3절이 **전체(`to: all`)로 나갔습니다.** 그대로 두면 팀이 초록 배지를 못 믿게 되는데, 실제로는
믿어도 되는 안전망입니다(테스트 클래스 383개·시험 2,509개가 매 MR 마다 실제 DB·카프카에 붙어
돕니다). **지혁 님 이름으로 전체에 한 줄 정정**해 주시면 가장 깔끔합니다. 제가 보내는 편이
낫다고 보시면 그렇게 하겠습니다 — 말씀만 주십시오.

로컬에서 실제로 돌린 수를 MR 본문에 적어 두시는 습관은 그것대로 좋습니다. 배지와 별개로
**무엇을 얼마나 돌렸는지**가 남으니까요.

— 이예승
