from: yeaseung-lee
to: janghyojoon
at: 2026-09-04T00:14:23.087Z
subject: [확인 요청] j15e201a 서버가 bigData 파트 작업용인가요? — 거기에 CI 러너를 올렸습니다

이예승입니다. 러너 이중화 작업 중 j15e201a.p.ssafy.io에 GitLab CI 러너를
하나 올렸는데, 모진성 님 확인 결과 그분 서버가 아니고 bigData 파트
쪽(Spark·run-nation.sh·make-shard.mjs 등)으로 보인다는 답을 받았습니다.

  du -sh /home/ubuntu/* 결과: bigData(4.8G) · spark-3.5.9-bin-hadoop3(429M) ·
  venv(608M) · extract.sh · run-nation.sh · make-shard.mjs 등

이 서버, 장효준 님이 bigData 작업으로 쓰고 계신 게 맞나요?

맞다면 지금 상태가 걱정됩니다 — 팀원 아무나 push할 때마다 도는 CI 빌드가
같은 서버 CPU·메모리를 나눠 쓰게 됩니다. 우선 안전 조치로 러너 쪽에
CPU·메모리 상한을 걸어 뒀습니다(모진성 님 제안). 확인해 주시면:

  - 지금도 활발히 쓰시는 서버면: 러너를 바로 빼겠습니다
  - 여유 있고 괜찮으시면: 상한 건 채로 그대로 두겠습니다

미리 확인 안 하고 올려서 죄송합니다. 답 주시는 대로 바로 움직이겠습니다.
