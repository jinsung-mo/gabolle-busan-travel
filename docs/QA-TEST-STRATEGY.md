# QA 테스트 전략

**실측 기준일 2026-09-11.** 숫자는 `origin/back/dev` · `origin/front/dev` 를 그 시각에 그대로
센 것이다 — 늘어나면 이 숫자는 낡는다(4절 참고). 이 문서는 Epic
[S15P21E201-773](https://ssafy.atlassian.net/browse/S15P21E201-773) 가 실행한 계획을
저장소에 남긴 것이다.

이 문서와 실제 테스트 코드·`.gitlab-ci.yml` 이 어긋나면 **코드가 기준**이다. 이 문서는 왜
이렇게 나눴는지를 적어 두는 자리지, 무엇이 도는지를 실시간으로 따라가는 자리가 아니다.

---

## 0. 왜 계층을 나누는가

**단위 테스트(unit test)** 는 함수 하나·클래스 하나를 그 밖의 모든 것(DB·네트워크·다른
서비스)을 흉내 낸 가짜로 대체하고 본다. 빠르지만 "그 클래스 혼자는 옳다"만 증명한다 —
그 클래스를 부르는 배선(Spring 설정, 인증 필터, 라우팅)이 옳은지는 못 본다.

**통합 테스트(integration test)** 는 진짜 DB 같은 일부 실제 인프라를 붙이고 본다. 데이터가
정말 그 모양으로 저장·조회되는지는 보지만, 보통 HTTP 요청 없이 서비스 계층을 코드에서
직접 부른다 — 그 앞단(컨트롤러 매핑, 보안 설정)은 여전히 못 본다.

**기능 테스트(functional test) / E2E(End-to-End)** 는 실제 소켓으로 진짜 HTTP 요청을 보낸다.
앱이 실제로 켜져 있고, 요청이 진짜 필터체인(`SecurityFilterChain` — Spring Security 가
요청마다 실제로 돌리는 인증·인가 검사의 사슬)을 통과한다. 가장 느리고 가장 손이 많이
가지만, **배선이 어긋난 사고는 이 계층에서만 잡힌다.**

이 구분이 추상적인 이유가 아니라 실제로 이 저장소에서 일어난 사고 때문에 있다:

| 사고 | 어떤 계층이 못 잡았나 | 어떤 계층이 잡았나(또는 잡을 예정인가) |
|---|---|---|
| [S15P21E201-704](https://ssafy.atlassian.net/browse/S15P21E201-704) — `SecurityConfig` 허용 목록과 `AuthController` 매핑이 서로 다른 파일이라 git이 조용히 어긋나게 합쳐, 소셜 로그인 첫 요청이 401로 막힘 | `MockMvc`(가짜 요청 객체로 컨트롤러만 도는 테스트 도구) — `SecurityFilterChain`을 아예 안 통과한다 | 기능 테스트(`OAuthChallengeJourneyFunctionalTest`, [S15P21E201-781](https://ssafy.atlassian.net/browse/S15P21E201-781)) — 실제 소켓 + 실제 필터체인으로 재현·회귀 방지 |
| CORS(**Cross-Origin Resource Sharing** — 브라우저가 다른 출처로 보내는 요청을 서버가 명시적으로 허용해야 통과시키는 브라우저 전용 보안 규칙) 헤더 누락으로 웹 로그인·여행 생성이 전부 실패 | 백엔드 기능 테스트조차 못 잡는다 — `TestRestTemplate`은 브라우저가 아니라 CORS 검사 자체를 안 한다 | Playwright(진짜 브라우저를 원격 조종하는 E2E 도구, [S15P21E201-775](https://ssafy.atlassian.net/browse/S15P21E201-775))로 처음 발견 — **브라우저에서 도는 검증은 브라우저로만 잡힌다** |

---

## 1. 현재 상태 실측 (2026-09-11)

### 1.1 백엔드 (`back/dev`)

| 계층 | 파일 수 | 무엇을 흉내/실제로 쓰나 | CI 잡 |
|---|---:|---|---|
| 단위/슬라이스 | 181 | Mock 또는 도메인 슬라이스 하나(`@WebMvcTest` 등) | `backend:build` |
| 통합(`*IntegrationTest`) | 72 | 진짜 PostgreSQL, 서비스 계층을 코드로 직접 호출(HTTP 없음) | `backend:build` |
| 기능(`functional/*Test`) | 15 | 진짜 소켓 + 진짜 필터체인(`FunctionalJourneyTest`, [S15P21E201-779](https://ssafy.atlassian.net/browse/S15P21E201-779)) | `backend:build` |

🔴 **셋 다 같은 CI 잡(`backend:build`)에서 `./gradlew build` 한 번으로 같이 돈다** — 계층별로
따로 게이트를 걸지 않는다. 저장소 크기가 지금 정도일 때는 분리 비용(러너 중복 기동, 캐시
분산)이 이득보다 크다고 판단했다(5절에 재검토 조건).

### 1.2 프론트엔드 (`front/dev`)

| 계층 | 파일 수 | 도구 | CI 잡 | 트리거 |
|---|---:|---|---|---|
| 단위 | 4 | Jest + `jest-expo`(리액트 네이티브용 Jest 프리셋) | `frontend:unit` | MR마다 |
| 웹 E2E | 1 | Playwright(브라우저 원격 조종) | `frontend:e2e` | **스케줄 전용** |
| 네이티브 E2E | 1개 플로우 | Maestro(모바일 앱 원격 조종) | 없음 — 로컬 전용 | — |

🔴 **네이티브 E2E는 CI에 없다.** [S15P21E201-777](https://ssafy.atlassian.net/browse/S15P21E201-777)
에서 로그인 플로우를 작성했지만 에뮬레이터에서 API 요청이 서버에 닿지 않는 원인 불명 버그
([S15P21E201-827](https://ssafy.atlassian.net/browse/S15P21E201-827))에 막혀 로컬에서도 끝까지
통과하지 못한다 — 그래서 CI에 올리지 않고 로컬 실행 방법만 `frontend/README.md`에 남겼다.

🔴 **웹 E2E가 MR마다가 아니라 스케줄 전용인 이유**는 [S15P21E201-700](https://ssafy.atlassian.net/browse/S15P21E201-700)
과 같다 — Metro(리액트 네이티브 번들러)를 동시에 여러 개 띄우면 CI 러너가 경합한다(4개
동시 실행 시 130초→247초 실측). `frontend:build` 잡 자체를 지운 그 판단을 그대로 물려받았다.

---

## 2. 테스트 피라미드 설계

```
                 ▲  느림 · 비쌈 · 배선까지 검증
                /│\
               / │ \    네이티브 E2E (Maestro)  — 로컬 전용, 아직 미검증 (1.2)
              /──┼──\
             / 기능   \  기능 테스트 (functional, RANDOM_PORT)  — 15개, 핵심 여정 위주
            /──────────\
           /   통합       \  통합 테스트 (*IntegrationTest)  — 72개, 도메인별
          /──────────────────\
         /       단위           \  단위/슬라이스 테스트  — 181개, 가장 많고 가장 빠름
        ▼──────────────────────────
                 빠름 · 저렴 · 좁게 검증
```

**계층마다 "이 계층이 아니면 못 잡는 것"이 다르다** — 그래서 아래로 갈수록 많이, 위로
갈수록 적게 두되, **위쪽 계층을 없애지 않는다.** 0절의 표가 그 이유다. 피라미드 모양을
맞추는 것 자체가 목적이 아니라, 계층마다 잡아야 할 사고 종류가 다른 것이 목적이다.

- **단위/슬라이스** — 가장 많아야 한다. 도메인 로직 하나하나(요금 계산, 검증 규칙, 추천
  점수 산식 등)는 여기서 조합 수를 늘려 가며 싸게 검증한다.
- **통합** — "정말 그 SQL이 그 인덱스를 쓰는가", "트랜잭션 롤백이 실제로 되는가"처럼 진짜
  DB가 아니면 확인할 수 없는 것만 남긴다.
- **기능/E2E** — 여정(journey) 하나당 하나. 모든 분기를 여기서 확인하지 않는다 — 분기는
  아래 계층의 몫이고, 이 계층은 "그 여정이 실제로 이어지는가"만 본다. [S15P21E201-779](https://ssafy.atlassian.net/browse/S15P21E201-779)
  가 만든 `FunctionalJourneyTest`도 "여정마다 다른 데이터는 프로퍼티가 아니라 헬퍼 호출
  인자로 달리한다"고 명시한다 — 프로퍼티를 바꾸면 Spring이 앱을 다시 띄워 이 계층의 비용
  가정이 깨진다.

---

## 3. 레이어별 코드 예시

실제로 저장소에 있는 파일을 가리킨다 — 새로 만든 예시가 아니라 지금 그대로 쓰는 패턴이다.

### 3.1 백엔드 · 단위/슬라이스

`@WebMvcTest` 등으로 도메인 하나만 스캔한다. 가장 빠르고 가장 좁다.

```java
// backend/src/test/java/com/gabolle/backend/auth/service/OAuthChallengeServiceTest.java
// OAuthChallengeService 하나만 본다 — DB도, HTTP도 없다.
```

### 3.2 백엔드 · 통합

진짜 PostgreSQL 위에서, 서비스 계층을 코드로 직접 부른다. `AuthPostgresIntegrationTest`
같은 공통 베이스가 스키마 검증(`ddl-auto=validate`)과 DB 연결을 담당한다.

```java
// backend/src/test/java/com/gabolle/backend/auth/OAuthTwoStepSignupIntegrationTest.java
class OAuthTwoStepSignupIntegrationTest extends AuthPostgresIntegrationTest {
    // accountService.authenticate(...) 를 코드로 직접 부른다 — HTTP 요청이 아니다.
    // 티켓이 표에 남는가, 단일 사용이 지켜지는가 같은 "DB 레벨 정확성"이 관심사다.
}
```

### 3.3 백엔드 · 기능(functional)

`FunctionalJourneyTest`를 상속하면 `TestRestTemplate`이 실제 소켓으로 나가고,
`MockMvc`는 절대 안 통과하는 진짜 `SecurityFilterChain`을 통과한다.

```java
// backend/src/test/java/com/gabolle/backend/functional/OAuthChallengeJourneyFunctionalTest.java
class OAuthChallengeJourneyFunctionalTest extends FunctionalJourneyTest {
    // rest.exchange(...) 로 실제 HTTP POST를 보낸다. 인증 헤더 없이 200이 나오는지
    // 확인하는 것 자체가 -704 재발 방지 검사다(0절 표 참고).
}
```

같은 계층의 다른 예 — 각각 "하나의 여정"을 끝까지 이어 붙인다:

- `CoreJourneyFunctionalTest` — 회원가입 → 로그인 → 여행 생성 → 추천 요청
- `ShareLinkJourneyFunctionalTest` — 공유 링크 발급 → 비로그인 조회 → 다른 계정으로 복제
- `StoryModerationJourneyFunctionalTest` — 스토리 작성 → 신고 → 관리자 승격 → 모더레이션

### 3.4 프론트엔드 · 단위

```ts
// frontend/src/plan/tripBasics.test.ts
// validateTripBasics() 같은 순수 함수 하나를 Jest로 본다. 네트워크도 렌더링도 없다.
```

### 3.5 프론트엔드 · 웹 E2E

Playwright가 진짜 Chromium을 띄워 화면을 실제로 클릭·입력한다.

```ts
// frontend/tests/e2e/core-journey.spec.ts
test('로그인 → 여행 기본정보 → 추천 요청까지 이어진다', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('이메일').fill(email);
  // ... 실제 폼을 채우고 실제 버튼을 누른다. 이 과정에서 CORS 헤더 누락(0절 표)이
  // 실제로 걸렸다 — 백엔드 기능 테스트로는 안 잡히는 종류의 버그였다.
});
```

### 3.6 프론트엔드 · 네이티브 E2E (미검증 — 1.2 참고)

```yaml
# frontend/.maestro/signup.yaml
# 실제 에뮬레이터에서 언어 선택 → 온보딩 → 회원가입 폼까지는 통과하지만,
# 마지막 API 요청이 에뮬레이터에서 서버에 닿지 않아 끝까지 통과하지 못한다
# (S15P21E201-827). 로컬 실행 방법은 frontend/README.md 참고.
```

---

## 4. CI 통합 계획

| 잡 | 계층 | 트리거 | 막는가(blocking) |
|---|---|---|---|
| `backend:build` | 단위+통합+기능 전부 | `backend/**` 변경 시 MR마다 | 예 |
| `backend:dependency-scan` | — (취약점 스캔, 테스트 아님) | `backend/**` 변경 시 MR마다 | 아니오(HIGH 39건 정리 전까지 임시) |
| `frontend:unit` | 단위 | MR마다 | 예 |
| `frontend:dependency-scan` | — (취약점 스캔) | MR마다 | — |
| `frontend:smoke` | 최소 스모크(화면이 그려지는가) | MR마다 | 예 |
| `frontend:e2e` | 웹 E2E | **스케줄 전용** | 스케줄 실행 자체가 실패해도 MR을 막지 않음 |
| (네이티브 E2E) | 네이티브 E2E | 없음 | — |

**왜 이렇게 나눴나:**

1. **백엔드는 계층을 안 나눴다** — `backend:build` 하나가 전부 돈다. 계층을 나누면
   러너를 계층 수만큼 띄워야 하고, 지금 규모(268개 파일 합계)에서는 그 비용이 "느린
   계층이 빠른 계층을 기다리게 하지 않는다"는 이득보다 크다고 판단했다. 이미 이
   잡 하나가 저장소에서 가장 느리다(`backend:build` 중앙값 207초, S15P21E201-751
   실측) — 그 실측 자체가 이 잡의 스크립트에 남아 있다(1.1의 코드 참고).
2. **프론트 단위 테스트는 MR마다** — 4개뿐이고 몇 초 안에 끝나므로 막을 이유가 없다.
3. **웹 E2E는 스케줄 전용** — Metro 번들러 동시 실행 경합(1.2)과, Playwright가 백엔드를
   컨테이너 안에서 직접 띄우는 구조라(`bootRun` + Postgres 서비스) 한 번 도는 데 몇 분이
   걸린다. MR마다 돌리면 그 시간이 모든 프론트 기여자의 대기 시간이 된다.
4. **네이티브 E2E는 CI에 아예 없다** — 통과하지 않는 테스트를 막는 잡으로 걸면 모든
   MR이 영원히 막힌다. -827이 풀리기 전까지는 로컬 전용으로 둔다.

---

## 5. 우선순위

실측 시점(2026-09-11) 기준으로 다음에 볼 것을 남긴다 — 완료되는 대로 이 절만 갱신한다.

1. **`frontend:e2e`의 첫 스케줄 실행 확인** — 로컬 통과와 CI 환경(Playwright 공식 Docker
   이미지 + 컨테이너 안에서 `bootRun`)에서의 첫 실행은 별개다. 스케줄이 한 번 돌고 나서야
   이 잡이 실제로 신뢰할 수 있는지 안다.
2. **[S15P21E201-827](https://ssafy.atlassian.net/browse/S15P21E201-827) — 네이티브
   에뮬레이터 연결 실패 원인 규명.** 이게 풀려야 네이티브 E2E를 CI에 올릴 수 있다.
3. **OAuth 실제 provider 왕복은 여전히 공백이다.** [S15P21E201-781](https://ssafy.atlassian.net/browse/S15P21E201-781)
   이 챌린지·로그인 엔드포인트가 "인증 없이 열려 있는가"는 덮었지만, 살아있는
   Google/Kakao/Naver/Apple 자격증명 없이는 실제 코드 교환·계정 연결까지 기능 테스트로
   못 잇는다. 표준화된 가짜 provider 서버(예: OAuth mock 서버)를 CI에 두는 방안을 검토할
   가치가 있다 — 다만 이건 이 문서가 결정할 일이 아니라 별도 조사 티켓감이다.
4. **`backend:build`가 커지면 계층 분리를 재검토한다.** 지금은 하나로 묶는 것이 맞다고
   판단했지만(4절), 파일 수나 실행 시간이 지금의 두 배를 넘으면 이 판단을 다시 본다 —
   그 기준값을 여기 박지는 않는다(**개수를 문서에 적지 않는다** — `CONTRIBUTING.md` 4절
   원칙과 같다. 적어 두면 낡는다).
