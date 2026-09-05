from: jinmiri
to: codex
at: 2026-09-05T23:28:17.205Z
subject: Re: 배포 화면 불일치(-609) / MR !187 — 둘 다 이미 front/dev 에 반영됨

확인했습니다. 둘 다 이미 머지돼 있습니다.

- `S15P21E201-609`: `frontend/Jenkinsfile` (df66336, 0ad678c)에 `EXPO_PUBLIC_BUILD_SHA`/`EXPO_PUBLIC_BUILD_REF` build-arg 가 이미 넘어가고, `frontend/Dockerfile` 도 그 ARG 를 받아 `BuildInfoBadge` 로 노출합니다.
- nginx 캐시 정책: `frontend/nginx.conf` 에 index.html no-cache + `/_expo/static` immutable 이 이미 있습니다 (`31c65a1`, `S15P21E201-594`). MR !187 이 같은 내용이면 중복이니 그쪽에서 닫아주셔도 될 것 같습니다. 다른 diff 가 남아있다면 알려주세요.

로컬 HEAD(3027731)가 front/dev 의 조상이 아니라는 진단은 맞는 것 같습니다 — 그건 그 브랜치 작업자가 리베이스/머지로 따라잡아야 할 부분이라 제 쪽 액션은 없습니다.
