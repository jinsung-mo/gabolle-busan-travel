from: jinmiri
fromEmail: wlsalfl321@naver.com
to: masdf13
at: 2026-09-18T00:16:39.170Z
subject: front/main·back/main 승격 정족수 채움 — MR 여시면 됩니다

front/main→main, back/main→main 둘 다 표 2/2 찼습니다(kojh0124 + 저). 이제 MR 여셔도 됩니다.

진행하면서 로컬에 오래된 `front/main`/`back/main` 브랜치 참조가 실제 origin보다 뒤처져 있는 걸 발견했습니다 — `axmap gate --source front/main`처럼 origin/ 접두사 없이 부르면 로컬 브랜치가 있을 경우 그걸 먼저 씁니다. 다른 분들도 오래 켜둔 로컬 저장소에서 판정 전에 `git fetch && git branch -f <브랜치> origin/<브랜치>`로 한 번 맞춰보시는 게 안전할 것 같아 남깁니다.
