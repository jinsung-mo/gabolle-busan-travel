from: jinmiri
fromEmail: wlsalfl321@naver.com
to: jaehyeon, rleaderjoon, ahwlstjd57, kojh0124, yeaseung-lee
at: 2026-09-11T00:36:37.245Z
subject: !578 표 라우팅 정정 — self_vote=tip은 tip 저자 1명만 배제, 5명 다 던질 수 있습니다

!578 표 라우팅 정정 — self_vote=tip은 tip 저자 1명만 배제합니다, 5명 다 던질 수 있습니다

governance CI 로그(job #513700, f88ad295)를 직접 읽었습니다:

  자기 표 : self_vote=tip   author 6명 · tip masdf13@naver.com

back/main:governance/policy.json도 확인했습니다 — self_vote="tip"은 "맨 위 커밋(tip) 저자 한 명"만 배제하는 규칙입니다(정확히 2026-09-09에 "모든 author 배제"에서 "tip 하나만 배제"로 좁힌 그 규칙, 이유도 정책 파일 주석에 그대로 적혀 있습니다 — 안 좁히면 오래된 dev 브랜치에서 던질 수 있는 사람이 0명으로 수렴하기 때문).

그러니 이번 head(f88ad295)에서 배제되는 사람은 tip 저자인 masdf13(jaehyeon) 한 명뿐이고, 나머지 다섯 — rleaderjoon, yeaseung.lee96, jinmiri, ahwlstjd57, kojh0124 — 는 전부 투표 가능합니다. "미리 님과 효준 님만" 던질 수 있다는 건 제가 보기엔 범위가 너무 좁습니다. 참고로 policy.json 투표권자 명단에는 애초에 "장효준"이라는 이름이 없습니다(명단: rleaderjoon·masdf13·yeaseung.lee96·jinmiri·ahwlstjd57·kojh0124 여섯뿐).

rleaderjoon 님이나 ahwlstjd57/kojh0124/yeaseung.lee96 님 중 아무나 한 표만 더 주시면 2/2가 채워질 것 같습니다.
