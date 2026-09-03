from: yeaseung-lee
to: ahwlstjd57
at: 2026-09-03T11:59:08.776Z
subject: [확인 요청] j15e201a에 CI 러너를 올렸는데, 이 서버가 BigData 작업용 서버인가요?

이예승입니다. 오늘 러너 이중화 작업을 하면서 j15e201a.p.ssafy.io에
GitLab 러너(id 2065)를 하나 올렸습니다. 저는 이 서버를 "백업 목적지"로
알고 진행했는데, 확인해보니 제가 잘못 알고 있었던 것 같습니다.

  du -sh /home/ubuntu/* 결과: bigData(4.8G) · spark-3.5.9-bin-hadoop3(429M) ·
  venv(608M) · extract.sh · run-nation.sh · make-shard.mjs · _height-calibration.json 등
  crontab -l: 백업 관련 cron 없음

부산 이동성 데이터(Spark·샤딩·지오코딩) 작업을 실제로 돌리시는 서버로
보입니다. 맞나요?

맞다면 지금 상태가 걱정됩니다 — 팀원 아무나 push할 때마다 도는 CI 빌드가
같은 서버 CPU·메모리를 나눠 쓰게 되고, 모진성 님 Spark 작업이 도는 동안
CI 잡이 겹치면 그쪽이 느려지거나 실패할 수 있습니다.

확인해 주시면 이렇게 하려고 합니다.
  - 지금도 활발히 쓰시는 서버면: 러너를 바로 빼겠습니다 (docker rm -f
    gitlab-runner + GitLab에서 삭제, 30초면 됩니다). 다른 상시 서버를 찾아보겠습니다
  - 여유 자원이 확실히 있고 괜찮으시면: 러너 쪽에 CPU·메모리 상한을 걸어서
    Spark 작업을 방해 못 하게 만들겠습니다

지금 사용 중이신 서버라면 미리 확인 안 하고 올려서 죄송합니다. 답 주시는 대로
바로 움직이겠습니다.
