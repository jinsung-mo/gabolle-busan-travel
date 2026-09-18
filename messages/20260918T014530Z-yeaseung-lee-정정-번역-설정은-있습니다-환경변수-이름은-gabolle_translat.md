from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: ahwlstjd57
at: 2026-09-18T01:45:30.268Z
subject: 정정 — 번역 설정은 있습니다. 환경변수 이름은 GABOLLE_TRANSLATE_API_KEY · _BASE_URL 둘입니다

앞 쪽지에서 *"`gabolle.translate.*` 속성이 `back/dev` 에 아예 없다"* 고 했는데 **틀렸습니다.** 접두사를 잘못 알고 찾아서 못 본 것입니다. 실제 접두사는 **`gabolle.tools.translate`** 입니다.

```
backend/src/main/resources/application-dev.properties:157
  gabolle.tools.translate.vendor-api-key=${GABOLLE_TRANSLATE_API_KEY:}
  gabolle.tools.translate.vendor-base-url=${GABOLLE_TRANSLATE_BASE_URL:}
```

그래서 배포가 넘겨야 할 환경변수는 **둘**입니다 — 키뿐 아니라 **주소도** 필요합니다. 어느 한쪽이 비면 어댑터가 호출 자체를 안 하고 `TRANSLATE_VENDOR_NOT_CONFIGURED` 로 끝냅니다.

| 환경변수 | 지금 |
|---|---|
| `GABOLLE_TRANSLATE_API_KEY` | 안 넘어감 |
| `GABOLLE_TRANSLATE_BASE_URL` | 안 넘어감 |

## 그런데 값만 넣는다고 되는 게 아닙니다

어댑터가 기대하는 모양이 **GMS 와 다릅니다.**

| | 지금 어댑터 | GMS |
|---|---|---|
| 요청 | `{"text": "...", "direction": "KO_EN"}` | `{"model": ..., "messages": [...]}` |
| 응답에서 읽는 칸 | `translatedText` | `choices[0].message.content` |
| 인증 | `Authorization: Bearer <key>` | 같음 |

즉 **GMS 로 가려면 어댑터를 새로 짜야 합니다.** `GmsMenuReader` 가 이미 GMS 모양으로 돌고 있으니 그게 본보기입니다.

## 그래서 확인이 필요합니다

*"메뉴판·비서·번역은 GMS 로 간다"* 는 전언인데, **그 셋 중 비서는 이미 GMS 가 아니었습니다.** 오늘 받은 것은 Google Gemini 키였고, `GeminiAssistantAdapter` 가 `com.google.genai.Client` 로 Gemini 를 직접 부릅니다. 전언이 셋 중 하나에서 틀렸으니 번역도 그 근거만으로 어댑터를 갈아엎을 수는 없다고 봅니다.

**둘 중 하나를 정해 주시면 제가 합니다.**

1. **GMS 로 간다** → 어댑터를 GMS 모양으로 새로 짭니다. 키는 이미 있는 `gabolle-menu-scan-api-key` 값을 그대로 쓰면 됩니다. 새 발급 없음
2. **지금 모양을 그대로 받는 업체를 쓴다** → `{"text","direction"}` 받고 `{"translatedText"}` 돌려주는 주소와 키 둘이 필요합니다

대중교통은 다른 세션에서 사장님께 폐기 확정 여부를 여쭙기로 했습니다. 환경변수 이름은 `GABOLLE_TRANSIT_SERVICE_KEY` 입니다.

**`S15P21E201-1186` 은 이 둘이 정리되기 전에는 닫지 않겠습니다.** 오늘 아침에 그 반대로 해서 `S15P21E201-802` 가 일주일 죽어 있었다는 걸 봤습니다.
