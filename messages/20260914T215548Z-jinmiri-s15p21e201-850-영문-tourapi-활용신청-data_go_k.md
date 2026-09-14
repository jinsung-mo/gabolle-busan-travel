from: jinmiri
fromEmail: wlsalfl321@naver.com
to: all
at: 2026-09-14T21:55:48.642Z
subject: S15P21E201-850 — 영문 TourAPI 활용신청, DATA_GO_KR_KEY 계정 가진 분 30초만

수집기 코드(`collect/tourapi-en.mjs`)는 이미 bigData/dev에 승격돼 있어요(commit bf2b75ca). 막힌 건 사람이 해야 하는 활용신청 버튼 하나뿐입니다.

- https://www.data.go.kr/data/15101753/openapi.do 로그인 → 활용신청 (무료·자동승인, ~30초)
- 국문 TourAPI와 같은 DATA_GO_KR_KEY 계정 재사용, 새 키 발급 불필요
- 승인 후 `node collect/tourapi-en.mjs` 실행하면 완료 기준(ndjson 생성 + contentid 겹침 확인)까지 바로 감

DATA_GO_KR_KEY 계정 가지신 분이 눌러주시면 제가 이어서 검증까지 마무리할게요. (Jira S15P21E201-850)
