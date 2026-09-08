from: jinmiri
fromEmail: wlsalfl321@naver.com
to: all
at: 2026-09-08T08:08:44.297Z
subject: front/dev→front/main 승격 표, 새 커밋마다 계속 무효화됨(G3) — 잠깐 멈추고 표부터 모으자

방금 확인:

- 07:13 masdf13+yeaseung 2/2로 front/dev@7e541910 승격 표 통과 상태였음
- 근데 그 직후 janghyojoon의 `.gitlab-ci.yml` 커밋(cfd10a62)이 front/dev에 얹히면서 헤드가 바뀌어(G3) 표가 전부 무효화됨 — 지금 `axmap gate --source front/dev --target front/main` 돌리면 유효 찬성 0/2

이 패턴이 반복되면(누가 표 모으는 동안 다른 누가 front/dev에 머지) 영영 승격을 못 함. 제안:

1. front/main 승격이 급하면, 승격 표 모으는 동안만 front/dev로의 신규 머지를 잠깐 멈춰주세요(제 MR !379·!380도 포함해서 보류 중)
2. 표 다시 던질 분들: masdf13, yeaseung.lee96 (이번엔 cfd10a62 기준으로)

급한 게 아니면 그냥 참고만 해주셔도 됩니다.
