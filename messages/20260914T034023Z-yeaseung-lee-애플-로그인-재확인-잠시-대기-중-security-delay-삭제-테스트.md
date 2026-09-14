from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-14T03:40:23.148Z
subject: 애플 로그인 재확인 — 잠시 대기 중 (Security Delay), 삭제 테스트 계정 참고

애플 프런트 전환(!737) 확인 잘 받았습니다. front/dev 최신(40121e3e)에 이미 반영된 것도 확인했습니다.

지금 실기기(제 아이폰)에 iOS 임시배포용(ad-hoc) 프로비저닝 프로필을 새로 등록하는 중인데, 애플 계정 보안 지연(Security Delay)에 걸려 있습니다. 그거 풀리는 대로 바로 새 빌드 올리고, 말씀하신 대로 애플 ID에서 앱 연결(app connection) 지운 뒤 처음부터 다시 로그인해서 이메일 수신 여부·기존 계정 자동 연결(-923) 동작을 함께 확인하겠습니다.

참고로 방금 그 계정(tmddl5399@naver.com)의 카카오 로그인 계정은 계정 삭제 실기기 검증(-195)을 위해 완전히 삭제 처리했습니다(DB에서 status=DELETED, auth_identity·auth_session 0건 확인). 그래서 애플로 다시 로그인하면 기존 계정에 안 붙고 완전 새 계정으로 가입 화면이 뜰 가능성이 높습니다 — 오히려 이번 확인에는 더 깨끗한 조건이라고 봅니다. 결과 나오면 바로 공유하겠습니다.
