from: jaehyeon
fromEmail: masdf13@naver.com
to: all
at: 2026-09-10T02:58:10.569Z
subject: back/dev 가 빨갛습니다 — 검사 52개 실패, 원인과 고치는 MR !482

🔴 back/dev 를 지금 받아 전체 빌드를 돌리면 1265 중 52 개가 실패합니다. 고치는 MR 을 올렸습니다 — !482.

## 무엇이 깨졌나

원인 하나입니다. S15P21E201-317 이 AuthSliceApplication 의 스캔 목록에 com.gabolle.backend.trip 을 더했는데, 그 순간 그 패키지의 컨트롤러가 전부 함께 올라옵니다. 그중 TripFacetViewController(S15P21E201-475, 어제 제가 넣은 것)가 place 쪽 PlaceFacetViewService 를 필수로 요구하는데 place 는 안 올라와서, 컨텍스트가 통째로 못 뜨고 그 슬라이스를 쓰는 검사가 한꺼번에 빨개집니다.

PrivacySliceApplication 도 같은 이유로 다섯 개가 더 실패하고 있었습니다. 합쳐서 52 개입니다.

재현은 이렇습니다.

```
git checkout back/dev
GABOLLE_TEST_DB_URL='...' ./gradlew test --tests '*AccountDeletionIntegrationTest'
# 8개 전부 실패. 메시지에 PlaceFacetViewService 가 나옵니다
```

## 어떻게 고쳤나

두 슬라이스에 place 를 스캔·엔티티·리포지토리 목록에 더했습니다. 1265 · 실패 1 · 건너뜀 6 으로 돌아옵니다(남은 하나는 제 PC 에 python3 이 없어 나는 경로 최적화 검사이고 무관합니다).

컨트롤러 쪽에 조건을 걸어 슬라이스에서만 빠지게 하는 방법은 안 썼습니다. 그러면 운영에서도 조용히 빠질 수 있는 자리가 하나 늘고, 그 실패는 아무 검사도 못 잡습니다. ItinerarySliceApplication 이 같은 갈림길에서 같은 판단을 먼저 적어 뒀습니다.

## 서로 잘못한 것이 아니라 맞물린 것입니다

모진성 님이 trip 을 더한 것은 그 티켓에 필요한 일이었고, 제가 컨트롤러를 trip 에 둔 것도 그 자리가 맞습니다. 문제는 스캔 목록에 패키지를 하나 더하는 것이 그 패키지 하나를 더하는 일이 아니라는 데 있습니다 — 그 패키지가 기대는 곳까지 함께 따라옵니다. 두 슬라이스 파일 주석에 그 문장을 남겼습니다.

앞으로 슬라이스 스캔 목록에 패키지를 더하실 때는 그 패키지의 컨트롤러가 무엇을 필수로 요구하는지 한 번 보시면 이 사고가 안 납니다. 전체 빌드를 한 번 돌리면 바로 잡히기도 합니다.

## 부탁

!482 는 back/dev 로 가는 MR 이라 표는 필요 없습니다. CI 가 초록이면 제가 머지하겠습니다. 다만 지금 back/dev 위에서 작업하시는 분들은 이 MR 이 들어가기 전까지 인증·개인정보 계열 검사가 빨간 것이 정상이니, 그것 때문에 자기 변경을 의심하지 않으셔도 됩니다.
