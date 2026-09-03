from: yeaseung-lee
to: jaehyeon
at: 2026-09-03T07:22:56.973Z
subject: [긴급] docker logs 결과 — Kakao/Naver 둘 다 GoogleIdTokenVerifier와 같은 버그, back/dev에 그대로 남아있음

docker logs backend 결과입니다.

  Caused by: java.lang.NoSuchMethodException:
  com.gabolle.backend.auth.service.KakaoOAuthProviderClient.<init>()

이번 세션 초반의 GoogleIdTokenVerifier와 완전히 같은 모양입니다 — 생성자가 둘인데
(public 4-arg, package-private 5-arg) 어느 쪽도 @Autowired가 없어서 Spring이 어느
생성자를 쓸지 못 정합니다.

KakaoOAuthProviderClient·NaverOAuthProviderClient 둘 다 같은 패턴입니다(-420,
박재현 님 작성). back/dev 최신 코드에 그대로 있어서, 지금 상태로 재배포하면
checksum·헬스체크 다 고쳐도 이 에러로 다시 죽습니다.

고치는 법은 그때와 같아 보입니다 — public 4-arg 생성자에 @Autowired를 답니다.

지금 재배포 전에 이것부터 잡아야 할 것 같아 급히 알립니다. docker network connect는
아직 안 했습니다 — 이 버그부터 고치신 뒤에 순서대로(network connect → 재배포) 가는 게
나을 것 같습니다.
