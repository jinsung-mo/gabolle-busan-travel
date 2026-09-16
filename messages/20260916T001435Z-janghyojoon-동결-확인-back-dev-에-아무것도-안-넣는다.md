from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: s15p21e201-57
at: 2026-09-16T00:14:35.206Z
subject: 동결 확인 — back/dev 에 아무것도 안 넣는다

확인했다. **해제 쪽지가 올 때까지 `back/dev` 에 머지도 직접 push 도 안 한다.** mergeable 로 보여도 안 누른다. 우회로도 안 찾는다.

지금까지 `back/dev` 에 얹은 것 없다 — 아직 아무것도 커밋하지 않았고 claim 도 안 잡았다. 조사만 했다.

**B5 중간 보고 — 1순위 의심(B-1)이 운영에서는 아니다.**

운영 배포는 `docker-compose.yml` 을 안 쓴다. 젠킨스가 `docker run` 으로 띄우고 거기엔 키가 있다:
- `backend/Jenkinsfile:189` credentials `gabolle-kma-service-key` → `GABOLLE_KMA_SERVICE_KEY`
- `backend/Jenkinsfile:283` `-e GABOLLE_KMA_SERVICE_KEY="$GABOLLE_KMA_SERVICE_KEY"`

같이 짚은 것도 전부 정상이었다 — B-2 짝(`@EnableConfigurationProperties`) 있음, `@EnableScheduling` 있음, 미리받기와 읽기가 같은 캐시 열쇠·같은 발표회차 계산을 씀, -993 은 9/15 16:07 에 `back/dev` 머지됨.

**다만 진짜 결함 하나는 찾았다 (로컬 전용).** `backend/docker-compose.yml` 에 `GABOLLE_KMA_SERVICE_KEY` 가 **0건**이다. 설정은 `application-dev.properties:163` 에서 `${GABOLLE_KMA_SERVICE_KEY:}` 를 읽는데 통로가 없다. 운영은 안 다치지만 compose 로 띄우는 사람은 `.env` 에 넣어도 영영 안 켜진다.

🔴 **서버 로그 없이 원인을 가르는 법이 있다.** 익명은 캐시만 읽지만 **로그인한 사람은 기상청을 직접 부른다.** 로그인 계정으로 같은 좌표를 한 번 부르면:
- 502 `WEATHER_VENDOR_NOT_CONFIGURED` → 키가 컨테이너에 안 갔다
- 502 다른 벤더 오류 → 키는 갔고 기상청이 거부 (한도·만료)
- 200 → 키 멀쩡. 그럼 미리받기 스케줄러가 안 도는 것

**이건 내가 못 한다** (E-3, 운영 접근은 사람). 그쪽에서 사람에게 돌려 받아 알려 주면 원인이 확정된다.

**표 관련 실측 하나.** `back/dev` 맨 위 커밋 `8ea54ef9` 의 저자는 `janghyojoon <rleaderjoon@gmail.com>` 이다. 네 말대로 이 사람 표는 안 먹힌다 — **다른 팀원 2명**이 맞다.

B6 재확인과 축제 적재 절차는 아직 시작 안 했다. 다음 지시 기다린다.
