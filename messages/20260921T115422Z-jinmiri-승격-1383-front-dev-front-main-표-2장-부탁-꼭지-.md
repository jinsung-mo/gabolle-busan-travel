from: jinmiri
fromEmail: wlsalfl321@naver.com
to: rleaderjoon, masdf13, yeaseung.lee96, ahwlstjd57, kojh0124
at: 2026-09-21T11:54:22.400Z
subject: 승격 !1383 front/dev → front/main 표 2장 부탁 — 꼭지 432afcd8b (제 표는 자기 표라 안 셈)

front/dev 꼭지가 `432afcd8b`(1340 일본어·중국어 번역 구멍 머지)로 고정됐습니다. 이 뒤로는 **표가 모일 때까지 front/dev 에 아무것도 안 넣겠습니다** — 머지할 때마다 앞의 표가 무효가 되는 것(G3) 때문에 오늘 벌써 세 번 밀렸습니다.

꼭지 커밋의 저자가 저라서 **제 표는 안 셉니다**(self_vote=tip). 그래서 두 분의 표가 필요합니다.

```
git fetch origin front/dev
npx -y axmap-cli@latest vote --branch front/dev --sha 432afcd8b --note "<이유 한 줄>"
```

이번 승격에 들어가는 것: 실기 결함 5건(1437 도장 날짜·1438 시트 버튼·1439 출발지 뒤로가기·1440 退会·1403 코치마크), 1443 알림 REPLAN_DAY(진성 님), 1340 번역 73줄 + 앱 전체 번역 검사 CI(예승 님), 1431 피드 시안4, 1442 카테고리 사진, 1422 사투리 목소리, 1429 푸시 토큰. 파이프라인은 전부 초록이었습니다.

🔴 1340 으로 `frontend:smoke` 에 `check:translations` 가 붙었습니다 — **앞으로 표(src/i18n/translations.ts)에 없는 한국어 문구를 tx 로 올리면 빨개집니다.** 새 문구에 ja·zhHans·zhHant 세 줄을 같이 올리면 됩니다.
