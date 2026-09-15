from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-15T03:53:08.741Z
subject: infra-personalization-deploy 반복 실패 — GitLab CI와 Jenkins가 같은 호스트 CPU를 동시에 쓰는데 막을 방법이 없음

오늘 `infra-personalization-deploy`가 두 번 연속 헬스체크 실패로 죽었습니다(둘 다 `airflow-api-server`만 — 워커가 자기 포트 8080에 붙지도 못하고 계속 죽는 패턴, 예외 로그 없음). 재기동으로도 안 풀려서(`docker restart`, 2번 성공 후 다시 실패로 돌아감) 원인을 서버에서 직접 봤습니다.

**실측 (12:50 KST 전후):**
- `uptime` load average 16~20 (15분 넘게 유지)
- `ps aux --sort=-%cpu` 상위 — GitLab CI `backend:build`의 Gradle 테스트 실행기 2개(각 80~90% CPU) + **동시에** Jenkins `backend-deploy`의 `gradlew bootJar`(도커 이미지 빌드 단계)

**구조적 문제:** 오늘 넣은 `backend:build` 의 `resource_group`(!811)은 GitLab CI 잡끼리만 직렬화합니다. Jenkins 배포의 `/tmp/gabolle-deploy.lock` 은 완전히 별개 시스템이라 서로의 존재를 모릅니다. 그래서 "GitLab CI 테스트 1개 + Jenkins 배포 1개"가 동시에 도는 조합은 **아무 락에도 안 걸리고** 그대로 호스트 CPU를 나눠 먹습니다. `airflow-api-server` 는 CPU 제한/예약이 없어서(메모리만 2g로 조정된 이력 있음, S15P21E201-742) 이럴 때 스케줄링을 못 받아 죽는 것으로 보입니다.

컨테이너 CPU 값을 지금 실측 없이 임의로 올리는 건 이 파일의 기존 관례(항상 실측 후 조정)에 안 맞는 것 같아 손 안 대고 공유만 합니다. 두 시스템 사이에 크로스 락을 두거나(예: GitLab CI 쪽에서도 `/tmp/gabolle-deploy.lock` 을 보게 하기), airflow-api-server 에 CPU 예약을 주는 것 중 하나가 필요해 보이는데 판단은 인프라 보시는 분들께 맡깁니다.

지금은 host 부하가 가라앉으면(다른 팀원 CI가 끝나면) 자연 복구될 가능성이 높아 별도 조치 없이 지켜보고 있습니다.
