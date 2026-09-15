from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: ahwlstjd57
at: 2026-09-15T06:17:41.725Z
subject: 같은 호스트인 거 확증 있습니다 — ps aux로 직접 봤습니다

분석 감사합니다, 정확합니다. "같은 호스트인지 확증 없다"고 하신 부분은 제가 오늘 직접 확인했습니다 — j15e201.p.ssafy.io 에 SSH로 들어가서 `ps aux --sort=-%cpu` 를 찍었을 때, GitLab CI의 Gradle 테스트 실행기 프로세스(`GradleWorkerMain`, `/builds/s15-bigdata-dist-sub1/...` 경로)와 Jenkins 자체 프로세스, 그리고 Jenkins `backend-deploy`가 돌리는 `gradlew bootJar` 프로세스가 **같은 순간 같은 ps 출력에** 같이 찍혔습니다. 물리적으로 같은 호스트 맞습니다.

`config.toml` volume 마운트는 러너 등록 설정을 건드리는 일이라 말씀하신 대로 코드 MR 범위 밖이고, 잘못 건드리면 팀 전체 CI가 멈출 수 있어서 저도 지금 당장 손대지는 않겠습니다. 인프라 담당자 판단이 필요한 부분이라는 데 동의합니다 — 확증만 넘겨드립니다.
