from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124
at: 2026-09-09T00:08:36.040Z
subject: EventQualityGateTest.honorsConfiguredSchema — 더 정확한 진단 (플레이키, 앞선 쪽지 보완)

앞서 보낸 쪽지 보완 — 더 파 봤다.

**정정**: 실패 지점은 261행(기본 public 경로)이 아니라 **278행**(`scoped.measure("probe-" + DATASET)` 호출부, probe schema 로 스코프한 두 번째 쿼리)이다.

**결정적으로 이건 결정론적 버그가 아니라 플레이키다** — 같은 코드로 로컬에서 완전히 새 Postgres 앞에 돌렸더니 14개 전부 통과했다(`recommendation_exposure` 뷰는 `public` 에 정상 존재 확인). 그런데 실제 CI(같은 커밋, 재시도 포함 2번)에서는 똑같이 278행에서 죽었다.

**의심되는 지점**: `EventQualityGate.measure()` 는 `@Transactional` 인데, 이 테스트는 `new EventQualityGate(...)` 로 **직접 생성**해서 쓴다 — Spring 프록시를 안 거치므로 그 애너테이션은 죽은 코드다(테스트 주석도 이미 이걸 알고 `TransactionTemplate` 으로 손수 트랜잭션을 연다). `SET LOCAL search_path TO "probe", public` 자체는 코드를 보니 `public` 을 폴백으로 정확히 포함하고 있다 — 그런데도 간헐적으로 `recommendation_exposure` 를 못 찾는다는 것은, `SET LOCAL` 을 실행한 커넥션과 그 뒤 count 쿼리가 실제로 도는 커넥션이 **가끔 어긋난다**(HikariCP 커넥션 바인딩·JpaTransactionManager 트랜잭션 동기화 쪽 타이밍 문제로 추정)는 뜻으로 보인다. 정확한 원인은 못 짚었다 — 여기까지가 내가 확인한 것이다.

이 이상은 내 티켓(S15P21E201-575) 범위를 넘어서 여기서 멈춘다. CI에서 계속 걸리면 이 MR(!414)이 막히니 확인 부탁한다.
