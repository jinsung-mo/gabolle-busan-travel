from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: janghyojoon, jaehyeon, jinmiri
at: 2026-09-16T05:04:16.569Z
subject: [투표 요청] !905 front/dev -> front/main — 제 표는 자기 표라 안 셉니다, 두 분 필요합니다

## 승격 MR !905 (front/dev → front/main) 에 표 두 장이 필요합니다

제 표는 **셀 수 없습니다.** 맨 위 커밋을 제가 만들어서(오늘 front/dev 머지들) 자기 표 배제(G1, `self_vote: "tip"`)에 걸립니다. `--force` 로 밀어넣으면 안 세는 표만 쌓이므로 안 했습니다.

- 지금 집계: **유효 찬성 0 / 필요 2**
- 문턱이 2인 이유: `.gitlab-ci.yml` 이 바뀌어 개정(amendment) 판정
- 던질 수 있는 분: **장효준 · 박재현 · 진미리 · 모진성 · 고지혁** (이 중 두 분)

```bash
npx -y axmap-cli@latest vote --branch front/dev --sha 5cb68541 --vote approve --target front/main --note "<왜 찬성하는지 20자 이상>"
```

## 무엇이 올라가나 (183 커밋)

오늘 들어간 주요 항목입니다.

- **!906** 비회원 진입·하단 잘림 개선 — **production 빌드에서 `EXPO_PUBLIC_GOOGLE_CLIENT_ID`·`EXPO_PUBLIC_API_BASE_URL` 이 비면 빌드를 막는 안전장치** 포함. Play 비공개 테스트에 올라간 AAB 의 Google 로그인이 깨졌던 문제를 막는 것입니다
- **!929** 부산 사진 기반 앱 소개 화면 / 홈 장소 카드 비주얼
- **!927 !936** 여행 이름 붙이기 흐름과 홈 카드 표시
- **!931** 하트 상태, **!932 !938** 부슐랭(컬렉션) 서버 저장·넓은 화면 배치
- **!933** 여행 만들기 출발지 지우기 버튼, **!937** 챗봇 화면 톤

## 제가 확인한 것

- 머지한 건마다 `git merge-tree` 로 순차 병합 충돌 시뮬레이션을 먼저 돌렸고, 전부 파이프라인 초록에서만 머지했습니다
- !929 는 충돌이 났던 건이라 로컬에서 병합해 `tsc --noEmit` 통과와 jest 44스위트 269테스트 전부 통과까지 확인했습니다(실제 해결은 작성자 진미리님)
- **!940(버튼 애니메이션)은 일부러 안 넣었습니다** — 프론트 단위 테스트를 3.9배 느리게 만들어 CI 의 5초 제한을 넘기는 것을 A/B 로 확인했습니다. 이 승격에는 포함되지 않습니다

183 커밋을 한 줄씩 다 읽지는 않았습니다. 그 부분은 각 MR 의 리뷰와 파이프라인에 기댔습니다 — 표를 던지실 때 참고하세요.

## 참고

- **!903 (back/dev → back/main)** 은 제 표가 세어져 정족수를 채웠고, 늦게 온 표를 반영하려고 `governance` 잡을 재시도해 뒀습니다
- **!731 (ai/main → main)** 은 이미 `mergeable` 입니다
