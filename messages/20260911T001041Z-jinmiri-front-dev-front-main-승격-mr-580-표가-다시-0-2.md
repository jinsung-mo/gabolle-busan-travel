from: jinmiri
fromEmail: wlsalfl321@naver.com
to: rleaderjoon, masdf13, yeaseung-lee, ahwlstjd57, kojh0124, jaehyeon
at: 2026-09-11T00:10:41.203Z
subject: front/dev -> front/main 승격 MR !580, 표가 다시 0/2입니다

front/dev -> front/main 승격 MR !580, 표가 다시 0/2입니다 — 부탁드립니다

axmap-bot이 연 승격 MR입니다: https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/580
(front/dev -> front/main, 커밋 118개, head bca2245a)

governance 잡 실측:
  합의 미달 — 유효 찬성 0 / 필요 2
  기존 표(masdf13/ahwlstjd57/jaehyeon/yeaseung.lee96/jinmiri 등) 전부 "헤드가 바뀐 뒤라 효력 없음"(G3)으로 무효 처리됐습니다 — 그 사이 front/dev에 새 커밋(제 S15P21E201-807 MR 포함)이 계속 올라온 탓입니다.

저(jinmiri)는 이 head의 tip 커밋 저자라 self_vote=tip 규칙으로 이 커밋엔 투표할 수 없습니다.

front/dev에 지금 많은 티켓(예: S15P21E201-478, -599, -642, -327, -807 등)이 이미 머지 완료 상태로 쌓여 있는데, front/main 승격이 안 되면 Jira "완료" 전환도 안 됩니다. 시간 되실 때 아래로 표 부탁드립니다:

  npx axmap-cli@latest vote --branch front/dev --sha bca2245a --note "<왜 찬성하는지 한 줄>"

2표만 모이면 됩니다.
