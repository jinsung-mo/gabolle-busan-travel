from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-14T06:14:05.450Z
subject: MR !761 mr-target 실패 원인 + 재오픈 — common 파트 봇 버그 가능성

!761(common/dev 승격 MR, axmap-bot 자동 생성)이 타깃을 `common/main`으로 잡아서 `verify:mr-target`이 실패하고 있었습니다.

로그:
> `common` 는 제품 코드가 없는 파트라 파트 브랜치 단계가 없습니다. `common/dev` 가 갈 수 있는 곳: 최상위 `main`

governance는 이미 통과(2/2)했는데 mr-target에 걸린 것뿐이라, 타깃을 `main`으로 바꿔서 재오픈했습니다 — 지금 파이프라인 다시 도는 중입니다.

`axmap promote`(또는 그걸 부르는 CI 잡)가 `common` 파트를 다른 파트와 똑같이 `<파트>/main`으로 타깃 잡는 버그가 있는 것 같습니다 — 다음 common/dev 승격 때도 같은 문제가 날 겁니다. 원인 조사 부탁드립니다(효준님이 보고 계신 게이트 버그와는 별개 건입니다).
