from: yeaseung-lee
to: all
at: 2026-09-03T06:45:20.075Z
subject: [승인 요청] Jenkins UI(8081)를 443 서브패스로 옮기려 합니다 — 반대 있으면 알려주세요

이예승입니다. 인프라 쪽 정리 항목 하나를 진행하려는데, 팀 배포 파이프라인에
영향을 줄 수 있어 미리 알립니다.

## 무엇을

지금 Jenkins UI가 `http://j15e201.p.ssafy.io:8081`로 평문(HTTP, 암호화 없음)
직접 노출돼 있습니다. 이걸 `https://j15e201.p.ssafy.io/jenkins/`로 옮기고
(nginx 뒤에 두고 TLS 적용), UFW 8081 포트를 닫으려 합니다. 열린 포트가
22·80·443 세 개로 줄어듭니다.

## 왜

Jenkins 컨테이너에 `/var/run/docker.sock`이 마운트돼 있어서, Jenkins 계정이
뚫리면 EC2 호스트 자체가 뚫립니다 — 거기엔 DB 비밀번호·JWT 시크릿·배포용
SSH 키까지 다 올라가 있습니다. 지금은 로그인이 평문 HTTP라 카페 wifi 등에서
세션이 가로채일 수 있고, 로그인 폼에 rate limit도 없습니다.

## 영향받는 것 — 딱 이 둘입니다

GitLab Webhook 2개의 URL을 바꿔야 합니다 (scheme·path만 바뀝니다):
  - backend-deploy (back/dev 트리거)
  - infra-personalization-deploy (common/dev 트리거)

## 위험

Jenkins 컨테이너를 재생성해야 해서 (`--prefix=/jenkins` 설정 추가), 그 순간
진행 중이던 빌드가 있으면 끊깁니다. `jenkins_home` 볼륨은 그대로라 job
설정·크리덴셜·빌드 이력은 안전합니다.

## 롤아웃 순서 (한 번에 스위치 전환 아님)

1. 새 경로(`/jenkins/`)를 먼저 세우고 로그인 화면까지 눈으로 확인
2. 확인된 뒤에만 webhook 2개 URL 전환
3. GitLab "Test → Push events"로 각 webhook 재확인 (Hook executed successfully)
4. 그 다음에만 UFW 8081 닫음

## 부탁

지금 다들 back/dev·common/dev에 활발히 push 중이신 걸 압니다. 그래서 이 작업은
**push가 뜸한 시간대**를 잡아서 하려 합니다. 반대하시는 분 있으면 알려주세요
— 진행 시각도 미리 다시 공지하겠습니다. 문제가 생기면 되돌리는 것도
(webhook URL 원복, UFW 8081 재개방) 어렵지 않습니다.
