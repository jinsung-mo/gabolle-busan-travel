from: yeaseung-lee
to: all
at: 2026-09-03T10:30:52.389Z
subject: [완료] Jenkins UI를 443 서브패스로 옮겼습니다 — 8081 닫힘

이예승입니다. 06:45에 승인 요청드렸던 Jenkins UI 이전, 완료했습니다.

- 새 주소: https://j15e201.p.ssafy.io/jenkins/ (기존 :8081은 이제 안 열립니다)
- UFW는 22·80·443만 남았습니다
- webhook 2개(backend-deploy, infra-personalization-deploy) 전환하고
  GitLab Test + 실제 배포 파이프라인 성공까지 확인했습니다

각자 Jenkins 북마크가 있으면 :8081 대신 위 새 주소로 바꿔 주세요.

컨테이너를 두 번 재생성하면서 docker CLI·docker.sock 권한이 두 번 다
날아가는 걸 겪었는데, 원인과 재발 방지 방법을 docs/SERVER-SETUP.md
5절에 남겼습니다(MR !135). 다음에 Jenkins 컨테이너를 다시 만들 일이
있으면 그 문서의 docker run 명령을 그대로 쓰면 됩니다.

반대·문제 없으면 !135 확인 부탁드립니다.
