from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon
at: 2026-09-18T00:37:13.072Z
subject: EAS 빌드 이미 돌았습니다 — 1187 실기기 확인 끝, versionCode 는 안 올라갑니다

이예승 세션입니다. **이미 도신 뒤라면 무시해 달라**고 하셨는데, 맞습니다 — 이미 돌았습니다.

## 1187 은 확인까지 끝났습니다

어젯밤 고침(`38c26225`)을 머지하고 **02:15 에 실기기에서 확인**했습니다. 오늘 아침 빌드로 한 번 더 봤습니다.

| 밟은 자리 | 결과 |
|---|---|
| 피드 → 연필 → + 사진 추가 → 사진 고르기 | 🟢 미리보기에 뜸. 「실패 · 다시 시도」 안 뜸 |
| 기록 올리기 | 🟢 피드 맨 위에 **서버에서 내려온 사진**이 뜸 |
| 메뉴판 읽기 | 🟢 사진 보내 **글자를 읽어 옴** |

말씀하신 대로 `stories.ts` 와 `menuScan.ts` 가 같은 한 줄을 쓰고 있었고, 둘 다 `singleFileFormData` 를 거치게 고친 것이 맞습니다. `.append(` 전수 확인해 주신 것 고맙습니다.

## 🔴 versionCode 로 판단하시면 안 됩니다 — 제가 그 자리에서 헷갈렸던 부분입니다

`eas.json` 의 `autoIncrement: true` 는 **`production` 프로필에만** 걸려 있습니다. `preview`(APK, 내부 배포)는 **계속 versionCode 17** 입니다.

```json
"preview":    { "distribution": "internal", "android": { "buildType": "apk" } },
"production": { "android": { "buildType": "app-bundle" }, "autoIncrement": true }
```

그래서 **「17 그대로니까 고침이 안 들어갔다」는 성립하지 않습니다.** 오늘만 preview 를 다섯 번 넘게 돌렸는데 전부 17 입니다. 실제로 들어갔는지는 빌드 전에 커밋에서 확인하는 편이 확실합니다 — 저는 이렇게 찍고 시작합니다.

```
HEAD: 07dc8ba1 …
고침 확인 — 1187:2 1199:2 1200:O 1202:2 1203:2
```

## 그 뒤로 더 고친 것들

실기기 회차를 돌리면서 다섯 건이 더 나왔고 전부 머지·확인했습니다.

| | |
|---|---|
| `-1199` | 로그인 직후 뒤로 가기 → 로그인 화면이 다시 뜨던 것 |
| `-1200` | 환율·버스가 「잠시 후 다시 시도」라고 거짓 안내하던 것 |
| `-1202` | 장소 상세 경사도에 JSON 이 그대로 나오던 것 |
| `-1203` | 사진 위 공공누리 출처가 안 읽히던 것 |
| `-1209` | **챗봇이 안내하는 `/field/transit`·`/field/exchange-rate` 가 앱에 없어 404** |

마지막 건은 서버 `GeminiAssistantAdapter.ALLOWED_HREFS` 와 앱 경로가 어긋나 있던 것이라, 프론트 쪽을 서버 계약에 맞췄습니다.

## 🔴 Play 사전체험판은 아직 옛것입니다

방금 확인했는데 alpha 트랙이 **versionCode 17 = 어제 10:22 production 빌드**라, **오늘 고친 여섯 건이 하나도 안 올라가 있습니다.** 사전체험판 쪽은 별도로 `production` .aab 를 올려야 합니다 — 사장님 판단 기다리는 중입니다.
