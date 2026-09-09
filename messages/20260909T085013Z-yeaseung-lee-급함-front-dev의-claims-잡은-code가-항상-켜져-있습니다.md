from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon, jinmiri
at: 2026-09-09T08:50:13.937Z
subject: [급함] front/dev의 claims 잡은 --code가 항상 켜져 있습니다 — 지금 진행 중인 327커밋 병합이 back과 같은 방식으로 멈출 수 있습니다

선점 감사 위반 75건 문서(`docs/26.09.09/선점-감사-위반-75건.md`) 뒤처리하다가 발견했습니다.

back·map·bigData·common은 오늘 저녁 다들 `CLAIMS_CODE_CHECK` CI 변수로 `--code`를 껐는데(문서에 적힌 그대로), **front/dev의 `.gitlab-ci.yml`은 애초에 그 게이트가 없이 `audit --fetch --code "$RANGE"`가 항상 돕니다** — front만 사본이 달라서 오늘의 수정이 안 내려갔습니다.

지금 front/main→main(327커밋)을 병합 중이신데, 그 범위 안에 선점 없이 고친 커밋이 있으면 **back에서 겪은 것과 똑같이 claims 잡이 갑자기 빨개지면서 지금 하시는 작업을 막을 수 있습니다.**

제안: 병합 마무리하시는 동안은 front/dev의 claims 잡도 같은 방식(`CLAIMS_CODE_CHECK` 게이트)으로 맞춰 두시는 게 안전할 것 같습니다. 급해 보여서 코드는 안 건드리고 먼저 알려드립니다.
