from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: yeaseung-lee
at: 2026-09-23T15:28:07.650Z
subject: Re: 로컬 i18n 되돌리기 — 제 작업 아닙니다. 커밋하지 말고 스태시 후 front/dev 최신으로 가세요

지금 하시던 일이 있으면 그것부터 마무리하고 보셔도 됩니다. 급하지 않습니다(다만 **이 변경을 커밋·푸시만은 하지 마세요**).

## 답
**제가 하던 작업이 아닙니다.** 이어서 할 것도 없습니다.

## 확인한 사실 (2026-09-24 00:3x, origin/front/dev 기준)
- staged 변경은 **1340 커밋 `7763fc0e2`(9/21, 일본어·중국어에서 영어로 떨어지던 문구 정리 · 번역 검사 CI)를 거꾸로 되돌린 모양**입니다
- 그 1340 작업은 `front/dev` 에 **살아 있습니다** — `src/i18n/pick.ts`·`tools/check-translations.mjs` 있음, `ci/parts/frontend.yml:162` 가 `npm run check:translations` 를 돌림
- 그래서 이걸 올리면 ① 일본어·중국어 화면이 다시 영어로 떨어지고 ② 번역 검사가 사라지거나(파일 삭제) CI 가 깨집니다
- unstaged `exchange-rate.tsx` + 시험: 1449 `93590f40d` 가 `front/dev` 에 병합돼 있음을 확인 — 말씀대로 스테일 중복입니다

## 원인 추정 (확인 못 함)
브랜치가 front/dev 보다 169커밋 뒤라, 1340 이전 상태의 파일이 어떤 조작(예: 옛 커밋에서 `git checkout <커밋> -- .` 나 `reset --soft`)으로 인덱스에 올라간 것으로 보입니다. 제 PC 에는 그런 기록이 없어 단정은 못 합니다.

## 권하는 순서 (지우지 않고 치우기)
```bash
git stash push --include-untracked -m "1340 되돌리기(원인 불명)+1449 중복 — 2026-09-24 보관"
git fetch origin
git switch -C front-dev-latest origin/front/dev   # 또는 쓰시던 방식으로 최신 front/dev
```
스태시는 며칠 뒤 문제없으면 `git stash drop` 하시면 됩니다.

## 참고 — 오늘 밤 front/dev 에 들어간 것 (APK 에 같이 실림)
!1540 여행 만들기 테마·여행 기분이 실제로 서버에 감 · topK 고정 제거 / !1544 폴드 펼침에서 로고·로그인·알림 중복 제거 / !1535 여행 페이지 폰 판(9/23). 서버는 테마 가산점·숙소 출발점·하루 동선·카프카 개인화가 운영에 배포됐습니다. 기록: axMap docs/26.09/26.09.23-여행앱-시나리오-검증/README.md
