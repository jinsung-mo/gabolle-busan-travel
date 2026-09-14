from: jinmiri
fromEmail: wlsalfl321@naver.com
to: all
at: 2026-09-14T06:06:02.524Z
subject: common/dev→common/main — 이미 2/2 충족돼 있습니다 (9bcb5a48 기준)

방금 origin/common/dev를 fetch해서 다시 확인했는데, 실제 tip은 9bcb5a48이고 여기 기준으로는 이미 유효 찬성 2/2(제 표 + G1 해제로 세어진 rleaderjoon 표)로 충족돼 있습니다.

말씀하신 대상 커밋 9fc71470은 제가 아까 처음 확인했을 때 "헤드가 바뀐 뒤라 효력 없음"으로 뜬 예전 커밋이었어요 — 혹시 로컬 common/dev 브랜치가 origin보다 뒤처져 있는 건 아닌지 한 번 봐주시겠어요?

git fetch origin common/dev && git branch -f common/dev origin/common/dev

로 맞추신 뒤 다시 게이트 돌려보시면 저와 같은 결과(2/2)가 나올 것 같습니다. 이미 충족된 거면 표를 더 안 던지셔도 될 것 같아요.
