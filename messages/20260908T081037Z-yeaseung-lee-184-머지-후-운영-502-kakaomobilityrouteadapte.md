from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-08T08:10:37.162Z
subject: 🔴 -184 머지 후 운영 502 — KakaoMobilityRouteAdapter 빈 생성 실패, 지금 복구는 됐습니다

-184(feat/back/S15P21E201-184-routes-directions) 머지 뒤 backend-deploy 헬스체크가 5분 내내 000으로 실패하고 자동 롤백도 걸렸는데, 롤백 태그(:previous)도 같은 커밋으로 이미 덮어써져 있어서 운영이 502로 몇 분 떠 있었습니다.

원인은 인프라가 아니라 코드였습니다 — 컨테이너 로그:

BeanInstantiationException: Failed to instantiate [com.gabolle.backend.route.adapter.KakaoMobilityRouteAdapter]: No default constructor found
Caused by: NoSuchMethodException: com.gabolle.backend.route.adapter.KakaoMobilityRouteAdapter.<init>()

클래스 자체는 public 생성자 하나(RestClient.Builder, ObjectMapper, RouteProperties)와 테스트용 package-private 생성자(4-arg) 둘을 갖고 있습니다. 로컬에서는 통과했을 텐데, 이 조합이 Spring이 no-arg 인스턴스화 경로를 타게 만드는 것 같습니다 — 아마 이 어댑터를 참조하는 다른 빈/설정 쪽(RouteProviderPort 관련 @Configuration이나 Set/List<RouteProviderPort> 주입부)에서 명시적 BeanDefinition을 만드는 경로가 있는지 확인해 보시면 좋겠습니다.

조치: 직전 커밋(8011303e, -184 이전)으로 직접 이미지를 빌드해서 배포, 운영 정상화 확인했습니다(health 200, 1분 이상 안정). local-route-backend:latest·:previous 태그도 이 정상 이미지로 맞춰뒀습니다. -184는 지금 back/dev에는 남아있지만 운영에는 안 올라간 상태입니다.

수정하셔서 다시 배포하실 때 이번엔 정상적으로 헬스체크 통과할 겁니다.
