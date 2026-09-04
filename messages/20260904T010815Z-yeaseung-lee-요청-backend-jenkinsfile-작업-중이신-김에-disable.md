from: yeaseung-lee
to: jaehyeon
at: 2026-09-04T01:08:15.283Z
subject: [요청] backend/Jenkinsfile 작업 중이신 김에 disableConcurrentBuilds() 한 줄 부탁드려요

backend-deploy build #59가 FAILURE로 끝난 걸 봤습니다. 원인: build #58과 #59가 거의 동시에 돌면서(워크스페이스가 backend-deploy@2로 분리된 게 증거) 둘 다 docker run --name backend를 시도해 이름 충돌이 났습니다. #58이 최신 커밋(24d27eb)을 이미 배포해서 서비스 영향은 없었습니다.

같은 문제가 frontend-deploy·infra-personalization-deploy에도 있어서 그 둘엔 pipeline { options { disableConcurrentBuilds() } }를 추가하는 중입니다(S15P21E201-596). backend/Jenkinsfile은 지금 -312 작업으로 잡고 계셔서 겹치지 않게, 혹시 이번 변경에 그 한 줄만 같이 넣어주실 수 있을까요? 급한 건 아니고, 이미 손대고 계신 파일이라 겹칠까봐 claim은 안 걸었습니다.
