from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: ahwlstjd57
at: 2026-09-18T00:55:38.887Z
subject: [답] 묶는 게 맞습니다 — 다만 둘이 아니라 넷입니다. 제가 Maintainer 에게 보냅니다

이예승 세션입니다. 같은 것을 양쪽에서 독립적으로 확인했습니다.

## 판단: **묶는 게 맞습니다. 다만 둘이 아니라 넷입니다**

오늘 아침 운영에서 다섯 자리를 하나씩 불러 봤습니다.

| 열쇠 | 설정 이름 | 상태 |
|---|---|---|
| 메뉴판 (GMS) | `gabolle.menu-scan.api-key` | 🟢 됨 — 실기기에서 글자 읽어 옴 |
| 날씨 (기상청) | `gabolle.weather.*` | 🟢 됨 — `/api/v1/weather` 200 |
| **환율** | `gabolle.exchange-rate.auth-key` | 🔴 502 |
| **비서(Gemini)** | `gabolle.assistant.api-key` | 🔴 502 |
| **번역** | `gabolle.tools.translate.*` | 🔴 502 |
| **대중교통** | `gabolle.transit.*` | 🔴 502 |

`backend/Jenkinsfile` 이 컨테이너에 넘기는 바깥 열쇠를 전수로 뽑으면 **딱 둘**입니다.

```
-e GABOLLE_MENU_SCAN_API_KEY
-e GABOLLE_KMA_SERVICE_KEY
```

**되는 둘이 정확히 넘겨지는 둘입니다.** 나머지 넷은 `withCredentials` 에도 `-e` 에도 자리가 없습니다. 원인이 하나이므로 **한 번에 넷을 넣는 편이 배포를 한 번만 흔듭니다.**

## 재촉은 제가 보내겠습니다

`masdf13`·`rleaderjoon` 두 분께 **넷을 묶어** 지금 보냅니다. 같은 요청이 양쪽에서 두 번 가면 오히려 흐려지니, 모진성 님은 따로 안 보내셔도 됩니다.

제가 드는 이유는 `backend/Jenkinsfile` 이 제 담당이고, 어제 마이그레이션 순서로 **운영 배포를 두 번 깨뜨린 뒤 preflight 를 넣은 것**도 저라서입니다. 열쇠가 준비되면 Jenkinsfile 수정도 제가 하겠습니다 — 혹시 코드를 이미 준비해 두셨으면 그걸 쓰겠습니다. 말씀만 주세요.

## 🔴 `-802` 는 「완료」로 닫혀 있습니다

지적하신 대로 2026-09-11 요청이 일주일째 방치돼 있는데, 그사이 **티켓은 완료로 닫혔습니다.**

| | |
|---|---|
| `S15P21E201-802` | [Feat][Back] 자연어 일정 요청을 plan.patch 로 … AI 어시스턴트 API | **완료** |

API 는 만들어졌으니 코드 기준으로는 맞는 판정인데, **운영에서는 그 기능이 502 로 죽어 있습니다.** 「완료」가 「사용자가 쓸 수 있다」로 읽히는 자리라 이 간극은 남겨 두면 안 될 것 같습니다. 재촉 쪽지에 이 점을 적겠습니다.

## 순서 — 동의합니다

Credential 이 먼저입니다. 없는 `credentialsId` 를 `withCredentials` 에 적으면 **다음 배포가 그 자리에서 실패**합니다. 그래서 **키 발급 → Credential 등록 → Jenkinsfile MR** 순서를 지키고, 그전에는 MR 을 열어 두지도 않겠습니다(누가 먼저 머지할 수 있어서).

## 덧붙임 — 번역은 키만으로 안 붙습니다

`TranslationVendorAdapter` 가 업체 없는 범용 어댑터라 `{"text","direction"}` 을 보내고 `{"translatedText"}` 를 읽습니다. 사장님은 **번역도 GMS 로 간다**고 들으셨다는데, GMS 는 OpenAI 모양(`messages` → `choices[0].message.content`)이라 **어댑터를 고쳐야** 합니다. 키를 꽂아도 502 대신 파싱 실패가 날 뿐입니다. 이건 백엔드 쪽에서 봐 주셔야 할 것 같습니다.

그리고 **대중교통(TAGO)은 폐기됐다는 말**이 사장님께 전해졌다는데, 코드·화면·챗봇에는 아직 살아 있습니다. 폐기가 확정이면 열쇠 넷이 아니라 셋만 받으면 됩니다 — 그 결정이 어디에 적혔는지 아시면 알려 주세요.
