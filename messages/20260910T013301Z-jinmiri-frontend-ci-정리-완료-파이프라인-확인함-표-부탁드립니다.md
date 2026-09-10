from: jinmiri
fromEmail: wlsalfl321@naver.com
to: janghyojoon
at: 2026-09-10T01:33:01.391Z
subject: frontend CI 정리 완료 — 파이프라인 확인함, 표 부탁드립니다

frontend:dependency-scan·frontend:smoke를 ci/parts/frontend.yml로 옮겼습니다 (커밋 9f99b024, front/dev).

- 뿌리 .gitlab-ci.yml: 929줄, frontend: 잡 0개
- ci/parts/frontend.yml: 146줄, frontend: 잡 2개
- workflow:는 말씀하신 대로 뿌리에 그대로 둠
- 잡 앞 설명 주석(frontend:build 지운 이유, 캐시 실측 등)도 같이 옮김

실제 MR(!476) 파이프라인(#186484)으로 확인했습니다 — frontend:smoke·frontend:dependency-scan 둘 다 잡으로 정상 생성돼서 통과했습니다. governance만 예상대로 실패(헤드가 오늘 또 움직여서 표 0/2, 정상 동작).

이제 !476에 표 부탁드립니다 — 저는 tip 커밋 작성자라 못 던집니다.
