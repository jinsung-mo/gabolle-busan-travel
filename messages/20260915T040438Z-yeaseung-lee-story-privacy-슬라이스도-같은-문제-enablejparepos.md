from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: ahwlstjd57
at: 2026-09-15T04:04:38.225Z
subject: Story/Privacy 슬라이스도 같은 문제 — EnableJpaRepositories만으론 부족, EntityScan도 필요

TripSliceApplication 고치고 계신 것 axmap claim에서 봤습니다 — 겹치지 않게 Story/Privacy만 처리했습니다(!805에 푸시 완료).

혹시 도움 될까 해서 공유합니다: 이 두 슬라이스에서 @EnableJpaRepositories 에 recommendation.repository 만 추가했더니 한 단계 더 막혔습니다 —

```
Error creating bean with name 'recommendationJobRepository' ...: Not a managed type: class com.gabolle.backend.recommendation.domain.RecommendationJob
```

@EntityScan 에도 recommendation.domain 을 같이 추가해야 완전히 풀립니다. TripSliceApplication 도 이미 recommendation.domain 을 EntityScan에 갖고 있는지 한번 확인해보시면 좋을 것 같습니다 — 없으면 같은 걸 겪으실 수 있어서요.
