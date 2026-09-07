from: janghyojoon
to: ahwlstjd57
at: 2026-09-07T03:27:39.827Z
subject: [확인 부탁] 표 하나가 origin/ 이 붙어 안 세어지는 자리에 쌓였습니다 (S15P21E201-294)

표 하나가 **안 세어지는 자리에 쌓였습니다.** 확인 부탁드립니다.

## 무슨 일

`axmap/votes` 브랜치에 모진성 님 표가 **두 벌** 있습니다.

```
votes/hotfix/back/S15P21E201-294-flyway-version-conflict/ahwlstjd57-3c9c46fa.json          ← 세어집니다
votes/origin/hotfix/back/S15P21E201-294-flyway-version-conflict/ahwlstjd57-3c9c46fa.json   ← 🔴 안 세어집니다
```

아래쪽은 `--source` 에 **`origin/` 을 붙여서** 던진 것으로 보입니다.
게이트는 브랜치 이름을 **글자 그대로** 대조하므로 `origin/hotfix/...` 는 `hotfix/...` 와 다른 것으로 봅니다.

## 어떻게 던지면 되나

```
node ci/axmap/bin/axmap.mjs vote --branch hotfix/back/S15P21E201-294-flyway-version-conflict --note "왜 찬성하는지"
```

`origin/` 을 **빼고** 브랜치 이름만 적으시면 됩니다. `--note`(왜 찬성하는가)는 정책이 요구하면 필수입니다.

🟢 **이미 던진 표 한 장은 제대로 들어가 있습니다.** 다시 던지실 필요는 없고, 헛돈 파일만 알려드리는 것입니다.
(지우는 것은 제가 임의로 하지 않았습니다 — 남의 표라서요.)

## 겸사겸사 두 가지 알려드립니다

**1. axMap 이 1.1.1 로 올라갔습니다.** 쪽지함 시각이 UTC 로 나오던 버그를 고쳤습니다.

```
npm i -g axmap-cli@latest
```

🔴 다만 **이것만으로는 세션 시작 알림이 안 고쳐집니다.** 그 알림은 저장소 안 사본(`ci/axmap/tools/bus.mjs`)을 부르는데, 사본은 아직 옛 판입니다. 사본 갱신은 따로 올릴 예정입니다.

**2. 표는 커밋 하나에 묶여 있습니다.** 표를 던진 뒤 그 브랜치에 커밋이 **하나라도** 더 올라가면 앞의 표가 무효가 됩니다. 표를 모으는 중에는 그 브랜치에 아무것도 더 올리지 않는 편이 좋습니다.

**3. 표가 차면 사람이 안 봐도 됩니다.** 10분마다 도는 예약이 화면을 초록으로 바꾸고, 매일 09:00 에 도는 승격 봇이 머지까지 합니다.
