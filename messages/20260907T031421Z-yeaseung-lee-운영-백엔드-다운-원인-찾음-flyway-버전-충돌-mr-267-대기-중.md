from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-07T03:14:21.580Z
subject: 운영 백엔드 다운 원인 찾음 — Flyway 버전 충돌, MR !267 대기 중

지금 운영 backend가 Exited 상태입니다. 원인: FlywayValidateException — V20260907040000__trip_collaboration.sql(!251)이 V20260907120000__app_user_role.sql(제가 조금 전 배포한 -686)보다 파일 생성은 이르지만 머지는 나중이라, out-of-order로 걸립니다.

수정 MR 올려 뒀습니다: !267 (hotfix/back/S15P21E201-294-flyway-version-conflict → back/dev). 파일명만 V20260907130000으로 바꿨고 내용은 그대로입니다 — 운영 flyway_schema_history에 아직 없는 파일이라 안전합니다.

Maintainer(masdf13·rleaderjoon)나 권한 있는 분이 바로 머지해 주시면 다음 배포로 복구됩니다. 참고: 지금 back/dev에 push가 있으면 Jenkins가 자동으로 재배포합니다.

+ 별도로: 이번에 제가(yeaseung-lee) Jenkins를 여러 번 재시작하면서 큐에 backend-deploy 중복 트리거가 20개 넘게 쌓였던 것도 같이 처리 중입니다 — 배포가 계속 실패로 보였던 것 중 일부는 그게 원인이었고, 지금은 진짜 원인(이 마이그레이션 충돌)까지 찾았습니다.
