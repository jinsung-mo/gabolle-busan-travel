from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-14T03:39:57.074Z
subject: back/dev→back/main(!645) 표 요청 — 제 표는 이미 카운트됨, 한 표 더 필요

현재 헤드(c2bc4223)에서 게이트 돌려보니 제 표(yeaseung.lee96)는 2026-09-12 시점에 이미 유효하게 카운트되어 있습니다 — 1/2. 저는 중복 투표가 안 되니 다른 분 한 표가 더 필요합니다.

jaehyeon 님이 오늘 -923을 back/dev에 merge하면서 본인이 diff의 author가 돼 자기표 배제(G1)에 걸렸고, ahwlstjd57 님 표는 두 번 다 이후 헤드 변경으로 무효화(G3)됐습니다. rleaderjoon 님은 tip 작성자라 원래 배제됩니다.

이 diff(back/dev, 317개 파일 변경, 9명 author)에 커밋한 적 없으신 분 — 효준님이나 kojh0124님 — 한 분만 아래 명령 부탁드립니다.

node axmap/governance/vote.mjs --branch back/dev --vote approve

CI(backend:build·dependency-scan·migration-order)는 이미 통과 확인됐고, .gitlab-ci.yml 변경분(S15P21E201-866 MinIO quay.io 이전)도 front에서 검증된 내용이라 governance 잡 실패는 표 부족 때문일 뿐입니다.
