from: kojh0124
fromEmail: kojh0124@gmail.com
to: all
at: 2026-09-07T08:13:52.420Z
subject: 🔴 [실측] backend:dependency-scan 이 모든 파이프라인을 빨갛게 만듭니다 — HIGH 39건, 톱니는 Tomcat 14건 (이예승 님 · -680)

고지혁입니다. **이예승 님** 앞으로 쓰지만 파이프라인이 전부 빨개지는 일이라 모두에게 보냅니다.

## 무엇이 일어나고 있나

`backend:dependency-scan` 잡이 **잡이 붙은 모든 파이프라인에서 실패**합니다. `back/dev` 의 최근 파이프라인을 훑어 보니 그 잡이 있는 것은 전부 실패, 없는 것은 전부 성공이었습니다.

```
181656  failed   scan=failed
181655  success  scan=absent
181620  failed   scan=failed
181619  success  scan=absent
181617  failed   scan=failed
181616  success  scan=absent
```

잡 로그의 마지막 줄이 이렇습니다.

```
HIGH(>=7.0) 이상: 39 | 판정 불가: 0
🔴 HIGH 이상 취약점이 있다 — S15P21E201-680
ERROR: Job failed: exit code 1
```

## 🔴 잡은 고장난 게 아닙니다 — 명세대로 동작하고 있습니다

S15P21E201-680 의 완료 기준이 이것입니다.

> MR 파이프라인에서 심각도 high 이상 취약점이 있으면 잡이 빨갛게 된다.

즉 **지금 빨간 것이 그 티켓이 요구한 동작**입니다. 문제는 티켓이 완료로 닫힌 시점에 이미 39건이 있었다는 것이고, 그래서 이 문턱이 **아무도 통과할 수 없는 문턱**이 되었습니다. 저는 이것을 잡의 버그가 아니라 **문턱을 세울 때 기준선(baseline)을 안 잡은 것**으로 읽었습니다.

## 실측 — 무엇이 걸렸나

도구는 osv-scanner 2.5.1(**공개 취약점 DB 를 라이브러리 목록과 대조해 주는 도구**)이고 `backend/gradle.lockfile` 의 196개 패키지를 봤습니다. CVSS(**취약점 심각도 점수. 10점이 최악이고 7.0 이상을 HIGH 로 봅니다**) 7.0 이상만 세면 39건이고, 패키지별로는 이렇습니다.

```
14  org.apache.tomcat.embed:tomcat-embed-core@11.0.14   (최대 9.8)
 3  tools.jackson.core:jackson-core@3.0.2
 2  com.fasterxml.jackson.core:jackson-databind@2.20.1
 2  io.micrometer:micrometer-core@1.16.0
 2  org.postgresql:postgresql@42.7.8
 2  org.springframework.boot:spring-boot@4.0.0            (최대 9.1)
 2  org.springframework.boot:spring-boot-starter-actuator@4.0.0
 2  org.springframework.data:spring-data-commons@4.0.0
 2  org.springframework.security:spring-security-config@7.0.0
 2  org.springframework:spring-webmvc@7.0.1
 2  tools.jackson.core:jackson-databind@3.0.2
 1  com.fasterxml.jackson.core:jackson-core@2.20.1
 1  org.assertj:assertj-core@3.27.6
 1  org.springframework.security:spring-security-web@7.0.0   (최대 9.1)
 1  org.springframework:spring-expression@7.0.1
```

**가장 많은 것은 Tomcat 입니다(39건 중 14건).** 제가 처음에는 Jackson 문제로 봤는데 실측해 보니 아니었습니다 — Jackson 네 좌표를 다 합쳐도 8건입니다.

## 🔴 고치기 전에 확인해야 할 것 — 버전을 내리는 쪽으로 가면 안 됩니다

걸린 버전들이 **전부 현재/최신 메이저**입니다.

```
Spring Boot 4.0.0 · Spring Framework 7.0.1 · Spring Security 7.0.0
Tomcat 11.0.14 · Jackson 3.0.2 · PostgreSQL JDBC 42.7.8
```

올릴 곳이 없는 버전에 HIGH 가 14건씩 붙는 것은 **두 가지 중 하나**입니다.

1. 실제로 그 최신 버전에 남아 있는 취약점이다 → 올릴 수 없으니 완화책이나 예외 등록이 답이다
2. osv-scanner 가 보는 영향 범위가 이 새 메이저를 잘못 포함하고 있다 → 예외 등록이 답이다

**저는 둘 중 어느 것인지 확인하지 않았습니다.** 그래서 "오탐이다" 라고 단정하지 않겠습니다. 다만 어느 쪽이든 **의존성 버전을 내려서 초록을 만드는 것은 답이 아닙니다** — 1번이면 더 취약한 버전으로 가는 것이고, 2번이면 없는 문제 때문에 멀쩡한 최신판을 버리는 것입니다.

확인하는 방법은 GHSA 하나를 열어 affected 범위가 정말 `11.0.14` 를 포함하는지 보는 것입니다. 로그에 GHSA 번호가 다 찍혀 있습니다.

## 제안 — 세 가지 중 하나

| | 무엇 | 언제 |
|---|---|---|
| 가 | `allow_failure: true` 로 바꿔 **보고는 하되 막지는 않게** 한다 | 지금 바로. 가장 싸다 |
| 나 | 지금 39건을 **기준선으로 등록**하고(만료일을 붙여서) 그 뒤 새로 생기는 것만 빨갛게 한다 | 오탐 판정 뒤 |
| 다 | 잡을 **스케줄 파이프라인으로 옮긴다** — MR 을 막지 않고 매일 한 번 돈다 | 중기 |

저는 **가 → 나** 순서를 권합니다. 지금 상태는 "모두가 빨간 것을 무시하는" 상태로 굳는데, 그러면 나중에 진짜 새 취약점이 생겨도 아무도 안 봅니다. 문턱은 넘을 수 있어야 문턱입니다.

🔴 **다만 이건 제 판단이 아니라 이예승 님 결정입니다** — 보안 문턱을 낮추는 일이라 제가 임의로 손대지 않았습니다. `.gitlab-ci.yml` 은 제가 잡고 있지도 않습니다.

## 같이 알아 두실 것 하나

`backend:dependency-scan` 이 빨간데도 **MR 이 머지됐습니다**(!304 · !297 · !292 전부). 즉 지금 이 잡은 머지를 막지 않고 있습니다. 팀 규칙 3절이 `Pipelines must succeed`(**MR 을 머지하려면 CI 검사가 전부 초록이어야 한다는 설정**)에 기대고 있는데, 그 설정이 켜져 있다면 머지가 안 됐을 것입니다.

그 설정이 지금 꺼져 있는 것인지, 아니면 이 잡이 필수 목록에 안 들어간 것인지는 제가 설정 화면을 볼 수 없어서 모릅니다. **확인해 주시면 좋겠습니다** — 3절이 "권한이 아니라 파이프라인으로 막는다" 를 팀의 방식으로 적어 뒀는데, 지금은 그 장치가 실제로는 안 막고 있는 상태로 보입니다.

## 제 쪽 상황

오늘 올린 MR 넷(!292 · !297 · !304 · !308)은 이 잡 말고는 전부 초록이고, 걸린 39건은 제 변경과 무관합니다(전부 `gradle.lockfile` 의 기존 의존성입니다). !308 은 아직 열려 있습니다.
