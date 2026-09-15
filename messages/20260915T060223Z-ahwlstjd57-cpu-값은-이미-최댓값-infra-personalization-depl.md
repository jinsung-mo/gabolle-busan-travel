from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: all
at: 2026-09-15T06:02:23.993Z
subject: CPU 값은 이미 최댓값 — infra-personalization-deploy 크로스락은 인프라 작업 필요

이예승 님이 보고한 `infra-personalization-deploy` 반복 실패(GitLab CI ↔ Jenkins 배포 CPU 경합) 건, 코드로 마무리할 수 있는지 확인해봤습니다.

**CPU 값 쪽은 이미 막혀 있습니다.** `infra/personalization/compose.yaml`의 `airflow-api-server`는 S15P21E201-798에서 이미 0.5 → 1.0 → 2.0으로 두 번 올린 상태(backend와 동일한 최댓값)고, 그 커밋 주석에 팀이 이미 결론까지 적어뒀습니다:

> "이 값도 절대 보장은 아니다 — 근본적으로는 동시 배포 자체를 겹치지 않게 막는 것이 맞는 방향이라 별도 후속 검토가 필요하다."

Docker Compose(스웜 아님)의 `deploy.resources`는 상한선(cap)만 걸 뿐 예약을 보장하지 않아서, 값을 더 올려도 근본 해결이 안 되고 다른 컨테이너 몫만 깎일 수 있습니다.

**남은 건 크로스락뿐이고, 이건 저장소 코드만으로는 안 됩니다.**
- Jenkins 쪽엔 이미 `/tmp/gabolle-deploy.lock`이 있음(`backend/Jenkinsfile`) — 이게 되는 이유는 세 Jenkinsfile이 `agent any`로 **같은 Jenkins 컨테이너 안에서 돌아 파일시스템을 공유**하기 때문입니다.
- GitLab Runner는 잡마다 새 Docker 컨테이너를 띄우고(`ci/runner-up.sh`, `--executor docker`) 호스트 `/tmp`를 마운트하는 설정이 없습니다 — 이건 `.gitlab-ci.yml`이 아니라 **러너 등록 시 `config.toml`에 volume을 추가하는 인프라 작업**이 선행돼야 합니다.
- 게다가 지금 문서(docs/CI.md)상 GitLab Runner(2037·2065)와 Jenkins/운영 호스트가 물리적으로 같은 서버라는 확증도 없어서, "애초에 어느 러너가 그 호스트에서 도는지" 확인부터 필요해 보입니다.

정리하면 이 건은 코드 MR로 제가 마무리할 수 있는 범위를 벗어나 있어서, 인프라(러너·Jenkins 관리) 담당하시는 분께 넘깁니다.
