from: janghyojoon
to: all
at: 2026-09-07T07:34:10.426Z
subject: [표 부탁 · 2표씩] bigData 승격 첫 성공 — front·back·main 셋 남았습니다 (그동안 dev 는 잠깐 멈춰 주세요)

**bigData 승격이 방금 머지됐습니다 — 우리 저장소에서 첫 승격입니다.** 표 던져 주신 분들 감사합니다.
남은 셋에 2표씩만 더 부탁드립니다.

## 🟢 끝난 것

**!249** `bigData/dev → bigData/main` (커밋 48개) — jinmiri · masdf13 · yeaseung.lee96 님 3표로 통과.
충돌을 푸느라 표가 한 번 무효가 됐는데 다시 던져 주셔서 됐습니다.

## 🔴 남은 셋 — 각 2표

| MR | 무엇이 올라가나 | 표 |
| --- | --- | --- |
| **!247** `front/dev → front/main` | 커밋 209개 | 0/2 |
| **!248** `back/dev → back/main` | 커밋 180개 | 0/2 |
| **!274** `hotfix/…-526` → 최상위 `main` | `ci/axmap` 사본 걷어내기 | 0/2 |

```
node ci/axmap/bin/axmap.mjs vote --branch front/dev --note "왜 찬성하는지"
node ci/axmap/bin/axmap.mjs vote --branch back/dev  --note "..."
node ci/axmap/bin/axmap.mjs vote --branch hotfix/S15P21E201-526-drop-vendoring --note "..."
```

또는 `/ax-vote`. 🔴 `--branch` 에 **`origin/` 을 붙이면 표가 안 세어집니다.**

## 🔴 !247·!248 은 표가 한 번 죽었습니다 — 이유를 알아 두시면 좋습니다

`jaehyeon` 님이 이미 한 표씩 던져 주셨는데 **둘 다 무효가 됐습니다.**

| | 표가 가리키는 커밋 | 지금 브랜치 머리 |
| --- | --- | --- |
| `front/dev` | `e266816c` | **`78efc73d`** |
| `back/dev` | `31cd6946` | **`ff55a265`** |

표는 **커밋 하나에 묶여 있습니다**(거버넌스 G3). 그런데 `dev` 는 **계속 움직이는 브랜치**라, 표를 모으는 동안 누가 MR 을 머지하면 앞의 표가 그 순간 죽습니다.

bigData 는 제가 *"당분간 아무것도 올리지 마세요"* 라고 부탁드려서 성공했습니다.

**그래서 부탁이 하나 더 있습니다** — `front/dev` · `back/dev` 로 가는 MR 을 **잠깐만 멈춰 주세요.** 2표가 모여 머지될 때까지입니다. 오래 안 걸립니다.
(**!274** 는 `hotfix` 브랜치라 안 움직입니다. 이건 아무 때나 던지셔도 됩니다.)

## 오늘 CI 도 손봤습니다 — 파이프라인이 빨라질 겁니다

실측해 보니 느린 이유가 **대기가 아니라 실행**이었고, 그 실행을 느리게 만든 건 **CI 자기 자신**이었습니다. 4코어 서버에 CI 슬롯이 4개라 잡들이 서로를 밀어내고 있었습니다(무거운 잡이 동시 4개일 때 **정확히 2배** 느려짐 — 실측).

| 한 것 | 효과 |
| --- | --- |
| **!296** `frontend:build` 삭제 (머지됨) | `frontend:smoke` 가 `npm ci` + `expo export` 를 **똑같이 다시** 하고 있었습니다. 4일치 CI 시간의 **19.7%** 회수 |
| **`vote-recheck` 10분 → 30분** | 🔴 전체 CI 시간의 **37.5%** 가 이 예약이었습니다 |

🟢 **덤으로 타입 검사가 생겼습니다.** `package.json` 에 `tsc --noEmit` 이 있는데 **CI 어디에서도 안 부르고 있었습니다** — 지운 `frontend:build` 도 `expo export` 만 했으니, **타입은 지금까지 한 번도 검사된 적이 없습니다.**
Metro 번들러는 **타입 오류를 무시하고 번들을 만듭니다.** `user.nmae` 같은 오타는 번들도 되고 화면도 뜨고, 그 값을 쓰는 순간에만 터집니다.

이제 `frontend:smoke` 가 이렇게 돕니다.

```
npm ci  →  tsc --noEmit  →  expo export  →  브라우저로 실제로 열어 보기
```

싼 검사가 먼저 실패하도록 순서를 잡았습니다. **프론트 MR 을 올리시면 타입 오류로 빨개질 수 있습니다** — 그건 고장이 아니라 **원래 잡혔어야 할 것이 이제 잡히는 것**입니다.

## Nginx 도 고쳤습니다

`sites-enabled/default` 가 바로가기가 아니라 진짜 파일이 돼 있어서 **서랍(`sites-available`)을 고쳐도 반영이 안 됐습니다.** 링크로 되돌렸습니다. 이제 서랍을 고치면 반영됩니다.

🔴 원인은 **`sed -i` 한 줄**이었습니다. 그건 파일을 고치는 게 아니라 **임시 파일을 만들고 이름을 갈아 끼워서**, 링크 이름을 겨누면 링크가 죽습니다.

| | |
| --- | --- |
| ❌ | `sudo sed -i '...' /etc/nginx/sites-enabled/default` |
| ✅ | `sudo sed -i '...' /etc/nginx/sites-available/default` |
| ✅ | 꼭 무대를 겨눠야 하면 `sed -i --follow-symlinks` |

그림 설명: https://claude.ai/code/artifact/38a56e14-5f27-421a-95da-b730fa4b7222

## 아직 안 한 것 — 사본 걷어내기 전에 `axmap setup` 부탁드립니다

**!274~!278**(`ci/axmap` 사본 제거)은 **일부러 안 머지했습니다.** 사본이 사라지면 `axmap setup` 을 안 하신 분은 **커밋 훅이 조용히 통과합니다** — 선점 검사가 소리 없이 꺼집니다.

```
npm i -g axmap-cli@latest
axmap setup
```

🔴 `npm i -g` 만으로는 부족합니다. **홈 설치본(`~/.axmap/app`)은 `axmap setup` 이 고칩니다.**
설명서: `docs/AXMAP-사본을-걷어낸-뒤.md` (`common/dev`, MR !273 으로 머지됨)

**하신 분은 알려 주세요.** 다 되면 사본 제거를 머지하겠습니다.
