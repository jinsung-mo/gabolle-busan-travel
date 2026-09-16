from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-16T10:50:46.506Z
subject: 웹 사진 고르기 풀렸습니다 — 운영 nginx 의 CSP 에 blob: 추가 (S15P21E201-1112)

제보하신 건(웹에서 사진 고르기가 전부 막힘) **고쳤습니다. 지금 됩니다.**

## 무엇을 했나
`/etc/nginx/sites-available/default` **120행 하나**입니다. 실제로 읽히는 설정 안에 CSP 줄이 그것 하나뿐인 것을 `nginx -T` 로 확인하고 고쳤습니다.

| | 전 | 후 |
|---|---|---|
| `img-src` | `'self' data: https:` | `'self' data: **blob:** https:` |
| `connect-src` | `'self' https://…` | `'self' **blob:** https://…` |

다른 항목은 한 글자도 안 건드렸습니다. 백업은 `/etc/nginx/sites-available/default.bak-20260916-blob-csp` 입니다.

`sudo nginx -t` 통과 → `sudo systemctl reload nginx` (접속 안 끊김).

## 확인
말씀하신 대로 증상이 조용해서, **막혀 있던 동작 두 가지를 브라우저에서 직접 해 봤습니다.**

```
blob 주소를 fetch        → 전: 막힘   후: OK (5바이트)
blob 주소를 이미지로 읽기 → 전: 막힘   후: OK (1x1)
```

밖에서 본 응답 헤더에도 `img-src 'self' data: blob: https:` · `connect-src 'self' blob: …` 로 내려옵니다.

🔴 **다만 실제 사진 고르기 흐름(파일 선택 → 업로드)까지는 제가 못 눌러 봤습니다.** 메뉴판·기록 사진·장소 사진·프로필 중 하나만 실제로 한 번 해 봐 주시면 완전히 닫힙니다. 서버 쪽 메뉴판이 정상이라고 확인해 주신 것과 합치면 이제 길이 뚫린 셈입니다.

## 곁들여 — 오늘 밤 프론트에서 나간 것 둘
- **MR !985** 지도에 문을 답니다. 여태 앱 안에서 지도 화면으로 가는 링크가 **0개**였습니다. 그리고 지도가 예시 대신 **내 일정**을 찍습니다
- **MR !986** 홈 「부산 둘러보기」가 음식점만 넷 띄우던 것. 부산시청 반경 안 장소 31곳이 **전부 음식**이라 거리로 뽑는 한 안 고쳐집니다 — 갈래를 먼저 정하고 뽑게 바꿨습니다

`nginx -t` 에 `duplicate MIME type "text/html"` 경고가 뜨는데 **제 변경과 무관한 기존 것**(166행)이고 설정 검사는 통과했습니다. 손대지 않았습니다.
