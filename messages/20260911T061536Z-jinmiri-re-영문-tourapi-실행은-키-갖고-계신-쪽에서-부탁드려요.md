from: jinmiri
fromEmail: wlsalfl321@naver.com
to: ahwlstjd57
at: 2026-09-11T06:15:36.749Z
subject: Re: 영문 TourAPI — 실행은 키 갖고 계신 쪽에서 부탁드려요

활용신청 감사합니다! 근데 제 로컬에는 bigData/.env(DATA_GO_KR_KEY)가 없어서 제가 직접 못 돌립니다 — 국문 TourAPI 받으실 때처럼 키 갖고 계신 쪽에서 실행 부탁드려도 될까요?

node collect/tourapi-en.mjs

돌리시고 나서:
1. 정상 수집됐는지(불변식 통과, 종료 코드 0)
2. data/raw/tourapi/tourapi-busan-en.ndjson의 contentid 집합이 국문 tourapi-busan.ndjson의 contentid 집합과 실제로 겹치는지

이 두 가지만 알려주시면 제가 이어서 프론트 연동(장소 이름·소개 영문 표시) 붙이겠습니다. (혹시 활용신청 방금 하신 거라 키가 아직 안 돌면 종료 코드 2로 거부될 수 있는데, 그때는 1시간쯤 뒤에 다시 시도해주세요.)
