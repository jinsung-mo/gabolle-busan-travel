from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: janghyojoon
at: 2026-09-10T00:39:10.592Z
subject: 🔴 [도구 버그 의심] front/main self_vote=tip인데 vote 명령이 authors 규칙으로 막습니다

!476 front/dev→front/main 에 표를 던지려다 막혔습니다. 상황을 그대로 남깁니다.

## 1. 정책은 이미 tip 입니다
`origin/front/main:governance/policy.json` 을 직접 열어보니 `"self_vote": "tip"` 이 이미 들어가 있습니다. jinmiri(wlsalfl321@naver.com)가 front/dev 의 맨 위 커밋 저자라, tip 규칙대로면 **저(ahwlstjd57)는 배제 대상이 아닙니다.**

## 2. 그런데 `vote` 명령이 authors 규칙으로 거부합니다
```
npx -y axmap-cli@latest vote --branch front/dev --sha <sha> --vote approve --target origin/front/main ...
```
```
이 표는 자기 표라 세지지 않습니다 (G1 — 자기가 쓴 코드에 자기가 찬성할 수 없습니다).
  ahwlstjd57@gmail.com 이(가) origin/front/main..front/dev 의 author 목록에 있습니다.
```

`gate` 명령은 tip 규칙을 정확히 반영해서 판정하는데(방금 `gate --source front/dev --target origin/front/main` 으로 확인 — 저는 "헤드가 바뀐 뒤라 효력 없음(G3)"으로만 걸리지 G1 으로는 안 걸립니다), `vote` 명령 자체의 사전 검사는 **여전히 옛 authors 규칙(브랜치의 모든 커밋 저자를 배제)**을 쓰는 것 같습니다.

## 3. 왜 중요한가
front/dev 에 커밋한 적 있는 사람이 masdf13·rleaderjoon·yeaseung.lee96·ahwlstjd57 넷입니다(투표권자 6명 중). tip 규칙의 취지가 "오래 쌓인 dev 브랜치에서 던질 수 있는 사람이 0이 되는 것"을 막는 것인데, `vote` 명령이 여전히 authors 규칙으로 막으면 **이 넷 전부가 똑같이 막힙니다** — kojh0124 한 명만 남고, 사실상 back/dev 에서 겪었던 것과 같은 잠김이 vote 명령 레벨에서 재현됩니다.

## 4. 지금은
`--force` 로 남기면 파일은 쌓이지만 판정문에는 "안 센 표"로 뜬다고 안내받아서, 무효표를 만들지 않으려고 안 던졌습니다. 실제로 던질 수 있는 사람(front/dev 에 커밋 이력이 없는 kojh0124)을 찾아야 할 것 같습니다.

axmap-cli 쪽 `vote` 명령이 `gate` 와 같은 self_vote 설정을 읽도록 고쳐야 할 것 같아서 남깁니다 — 표를 더 모아도 안 풀리는 자리라 재시도로는 해결이 안 됩니다.
