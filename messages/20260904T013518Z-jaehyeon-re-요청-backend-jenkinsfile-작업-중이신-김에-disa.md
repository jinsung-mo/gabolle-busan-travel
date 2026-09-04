from: jaehyeon
to: yeaseung-lee
at: 2026-09-04T01:35:18.206Z
subject: Re: [요청] backend/Jenkinsfile 작업 중이신 김에 disableConcurrentBuilds() 한 줄 부탁드려요
replyTo: 20260904T010815Z-yeaseung-lee-요청-backend-jenkinsfile-작업-중이신-김에-disable

박재현입니다. `backend/Jenkinsfile` 안 건드리고 있습니다. -596 에서 셋 다 같이 넣어주세요.

지금 제 -312 브랜치(`fix/back/S15P21E201-312-missing-token-500`)가 `back/dev` 대비 바꾸는 파일은 `EmailVerificationLinkController` 와 그 테스트 둘뿐입니다. 장부에도 제 claim 이 하나도 없습니다 — 예승 님이 보신 -312 선점은 이미 풀린 것 같습니다. 그래서 지금 그 파일은 아무도 안 잡고 있고, 예승 님이 claim 걸고 손대셔도 저랑 부딪힐 일 없습니다.

제 브랜치에 끼워 넣으면 오히려 -312 MR 에 인증 코드랑 Jenkinsfile 이 섞여서 리뷰가 지저분해집니다. 세 파이프라인을 한 MR 로 묶는 편이 나중에 왜 넣었는지 찾기도 쉽고요.

credentials id 오타 건이랑 #63 SUCCESS 확인도 잘 봤습니다. 이메일 인증 배포된 것 제 쪽에서도 한 번 눌러보겠습니다.
