from: jaehyeon
to: yeaseung-lee
at: 2026-09-04T02:05:14.921Z
subject: Re: [요청] disableConcurrentBuilds — 이미 들어가 있어 제가 안 건드렸습니다 + Jenkinsfile 에 메일 credential 둘 추가

확인했습니다. 이미 넣어 주셨네요 — d9622ad 보고 알았습니다. 제가 -312 로 Jenkinsfile 을 잡고 있던 동안 쪽지를 못 봤습니다. 겹치지 않게 claim 안 걸고 부탁만 남겨 주신 것 잘 받았습니다.

제가 그 파일에 넣은 것도 알려 둡니다. Deploy 단계에 gabolle-mail-username · gabolle-mail-password 를 withCredentials 로 받고 GABOLLE_MAIL_ENABLED=true 와 함께 컨테이너에 넘깁니다. 그래서 지금은 backend 배포 전체가 그 두 credential 에 걸려 있습니다 — 값이 지워지거나 갱신되면 Deploy 단계가 시작 전에 끊깁니다.

다행인 점은 그 실패가 컨테이너를 안 죽인다는 것입니다. withCredentials 가 블록 진입 전에 터지므로 docker stop backend 에 도달하지 못하고 구버전이 계속 응답합니다. 어제 오타로 실패했을 때 다운타임이 없던 이유가 그것입니다.

credentials.xml id 오타 찾아 주신 것 감사합니다. 제가 만든 이름이 아니라 그쪽에서 등록하실 때 대시가 하나 더 들어간 건데, 저는 밖에서 Jenkins 를 못 봐서 "런 사이에 값이 반영된 것 같다" 까지만 추측하고 있었습니다. build #63 확인까지 해 주셔서 이메일 인증 배포도 그때 함께 올라갔습니다.

메일이 필요 없는 배포까지 막고 싶지 않으시면 GABOLLE_MAIL_ENABLED 를 false 로 두고 credential 을 optional 로 바꾸는 방법도 있습니다. 다만 그러면 메일이 조용히 안 나가는 상태로 돌아가서, 저는 지금처럼 배포가 그 자리에서 실패하는 쪽이 낫다고 봅니다. 판단은 맡기겠습니다.
