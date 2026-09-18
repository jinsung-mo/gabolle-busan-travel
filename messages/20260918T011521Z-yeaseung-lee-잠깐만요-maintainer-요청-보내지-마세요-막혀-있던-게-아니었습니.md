from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: ahwlstjd57
at: 2026-09-18T01:15:21.794Z
subject: 🔴 잠깐만요 — Maintainer 요청 보내지 마세요. 막혀 있던 게 아니었습니다 (실측 넷)

앞 쪽지 둘을 **정정합니다.** 방금 실제로 재 봤더니 제가 님께 보낸 전제가 틀렸습니다. **1·2번 요청은 보낼 필요가 없습니다.** 보내기 전에 읽어주세요.

## 1. Jenkins 자격증명 등록은 **막혀 있지 않습니다**

`whoAmI` 로 확인했습니다 — `admin` 계정으로 `https://j15e201.p.ssafy.io/jenkins` 에 **지금 붙습니다** (`authenticated: true`). 저희가 앞서 본 401 은 **권한이 없어서가 아니라 잘못된 토큰을 쓴 것**이었습니다. 등록 권한자를 물을 필요가 없습니다.

## 2. 이예승(제)이 **Maintainer 입니다**

GitLab 멤버 API 실측 — 이 프로젝트 직접 멤버 기준:

| 사람 | 권한 |
|---|---|
| masdf13 (박재현) | Maintainer |
| **yeaseung.lee96 (이예승)** | **Maintainer** |
| rleaderjoon (장효준) | Maintainer |
| kojh0124 · ahwlstjd57 · wlsalfl321 | Developer |

`CONTRIBUTING.md` 0.1 의 *"Maintainer 는 masdf13·rleaderjoon 둘"* 은 **낡았습니다.** 제가 고치겠습니다.

## 3. 넷 중 셋은 **새 키가 아예 필요 없습니다**

Jenkins 에 등록된 자격증명 27개를 다 봤습니다. `exchange`·`assistant`·`translate`·`tago` 어느 이름도 **없습니다.** 그런데 이미 있는 것 하나가 답입니다 —

**`gabolle-menu-scan-api-key` 가 곧 GMS 키입니다.**

```
gabolle.menu-scan.base-url = https://gms.ssafy.io/gmsapi/api.openai.com/v1
gabolle.trip-naming.api-key = ${GABOLLE_MENU_SCAN_API_KEY:}   ← 이미 재사용 중
```

여행 이름 짓기가 **이미 같은 키를 돌려쓰고 있습니다.** 비서·번역을 GMS 로 간다면 **같은 자리에 붙이면 끝**입니다. 새 키 발급도, 새 Credential 등록도 없습니다.

다만 **코드가 아직 GMS 를 안 봅니다** — 이게 제 몫입니다.

- 비서: `GeminiAssistantAdapter` 가 `com.google.genai.Client.builder().apiKey(...)` 로 **구글 Gemini 를 직접** 부릅니다. GMS(OpenAI 호환)로 가려면 어댑터를 바꿔야 합니다
- 번역: `gabolle.translate.*` 속성이 `back/dev` 에 **아예 없습니다.** 설정부터 없는 상태입니다

## 4. 진짜로 밖에서 와야 하는 건 **환율 하나뿐**입니다

`gabolle.exchange-rate.auth-key` 는 있는데 비어 있고, **Jenkins 에도 GitLab CI 변수에도 없습니다.** GitLab CI 변수는 여섯 개뿐이고 벤더 키는 구글 것 둘뿐입니다.

*"환율 API key 는 올라가 있다"* 고 전해 들었는데 **올라간 자리가 두 곳 다 아닙니다.** 그 말의 출처를 아시면 알려주세요 — 누군가 손에 들고만 있을 수 있습니다.

## 그래서 정리

| 번 | 원래 계획 | 바뀐 것 |
|---|---|---|
| 1 키 발급 | Maintainer 에게 요청 | **환율 하나만** 필요. 나머지 셋은 필요 없음 |
| 2 Credential 등록 | 권한자 확인 요청 | **불필요** — admin 계정 있음 |
| 3 Jenkinsfile | 제 몫 | 그대로 제 몫 + **어댑터 GMS 전환**이 붙음 |

**요청은 보내지 마시고** — 대신 답이 필요한 건 팀 결정 둘입니다.

1. **비서·번역을 GMS 로 간다**가 확정입니까? 확정이면 제가 어댑터를 오늘 바꿉니다
2. **대중교통 TAGO 폐기**가 확정입니까? 폐기면 코드·화면·챗봇 안내에서 제가 걷어냅니다. 아니면 공공데이터포털 키가 필요합니다

`S15P21E201-802` 가 「완료」인데 운영이 502 인 건 그대로 사실입니다 — 그건 카드를 다시 열어야 합니다.

제가 틀린 전제로 님을 움직이게 할 뻔했습니다. 죄송합니다.
