from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: ahwlstjd57
at: 2026-09-18T01:35:49.742Z
subject: 키 둘 받았습니다 — Jenkins 등록 + Jenkinsfile MR !1155 까지 끝. 비서는 GMS 전환 필요 없습니다

이예승 님이 **환율 키와 Gemini 키를 직접 주셨습니다.** 앞 쪽지에서 제가 *"비서를 GMS 로 옮겨야 한다"* 고 했는데 **그럴 필요가 없어졌습니다.** 지금 어댑터 그대로 돕니다.

## 둘 다 실제로 불러 봤습니다

| | 무엇을 불렀나 | 결과 |
|---|---|---|
| 환율 | 한국수출입은행 AP01 (`oapi.koreaexim.go.kr`) | `result=1`, **23개 통화** 받음 |
| 비서 | Gemini `gemini-3.6-flash` `generateContent` | **200**, 응답 텍스트 받음 |

`AssistantProperties` 의 기본 모델 `gemini-3.6-flash` 가 이 키의 모델 목록(50개)에 **실제로 있습니다.** 이름만 맞다고 믿지 않고 목록을 받아서 확인했습니다.

## 한 것

1. **Jenkins 전역 자격증명 등록 완료** — `gabolle-exchange-rate-auth-key`, `gabolle-assistant-api-key`
2. **Jenkinsfile MR 열었습니다 — `!1155`** (`fix/back/S15P21E201-1186-exchange-rate-key` → `back/dev`)
   https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/merge_requests/1155

순서는 말씀드린 대로 지켰습니다 — **Credential 먼저, Jenkinsfile 나중.** 반대로 했으면 다음 배포가 「그런 자격증명 없음」으로 통째로 실패했을 겁니다.

**되돌리기 경로에도 같이 넣었습니다.** Health check 실패로 `local-route-backend:latest` 로 롤백할 때 쓰는 블록에도 넣었습니다. 거기를 빼면 **되돌린 순간 두 기능이 다시 죽습니다** — 원래 이 버그가 그렇게 생긴 모양입니다.

## 그래서 Maintainer 요청은 정말 안 보내셔도 됩니다

1번(키 발급)·2번(Credential 등록) 둘 다 **끝났습니다.**

## 남은 둘

| 기능 | 상태 |
|---|---|
| **번역** | `gabolle.translate.*` 속성이 `back/dev` 에 **아예 없습니다.** 키 문제가 아니라 설정·어댑터부터 만들어야 합니다. GMS 로 갈지 따로 갈지 알려주시면 제가 하겠습니다 |
| **대중교통** | 환경변수는 `GABOLLE_TRANSIT_SERVICE_KEY` 입니다 (`GABOLLE_TAGO_SERVICE_KEY` 가 아닙니다 — 제가 앞 쪽지에서 이름을 틀리게 적었습니다). 값이 아직 없고, 폐기 여부도 확정 전입니다 |

`S15P21E201-802` 는 배포가 돌고 **운영에서 502 를 벗어나는 것을 확인한 뒤에** 정리하겠습니다. 카드가 「완료」인 채로 일주일 죽어 있던 것이 이번 일의 핵심이라, 이번에는 화면으로 확인하고 적겠습니다.
