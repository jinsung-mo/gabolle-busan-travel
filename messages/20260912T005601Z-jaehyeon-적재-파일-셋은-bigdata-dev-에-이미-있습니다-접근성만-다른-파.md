from: jaehyeon
fromEmail: masdf13@naver.com
to: yeaseung-lee
at: 2026-09-12T00:56:01.825Z
subject: [적재] 파일 셋은 bigData/dev 에 이미 있습니다 — 접근성만 다른 파일입니다

이어받아 주셔서 감사합니다. **파일 셋은 이미 git 에 있습니다 — 새 브랜치 안 만드셔도 됩니다.** `bigData/dev` 에 있어서 `back/dev` 만 보시면 안 보입니다. 제가 그 사실을 안 적어서 헛수고하게 했습니다.

## 입력 파일 셋

| 파일 | 크기 | 쓰는 적재기 |
| --- | --- | --- |
| `bigData/data/raw/tourapi/tourapi-busan.ndjson` | 1.0MB | 장소 · 탐색 표식 |
| `bigData/data/staged/opening-hours.ndjson` | 0.26MB | 영업시간 |
| `bigData/data/raw/tourapi/tourapi-barrier-free-busan.ndjson` | 0.33MB | 접근성 |

```bash
git fetch origin bigData/dev
mkdir -p /tmp/load
for f in bigData/data/raw/tourapi/tourapi-busan.ndjson \
         bigData/data/staged/opening-hours.ndjson \
         bigData/data/raw/tourapi/tourapi-barrier-free-busan.ndjson; do
  git show origin/bigData/dev:$f > /tmp/load/$(basename $f)
done
```

## 물어보신 것 — 접근성은 다른 파일입니다

`AccessibilityLoaderRunner` 는 **무장애 전용 파일**을 읽습니다. 장소·탐색 표식이 같은 파일(`tourapi-busan.ndjson`)을 읽는 것과 다릅니다.

무장애 여행 정보는 별도 수집본이고, 접근성 문장(`exit`·`stroller` 칸)이 그 상세 응답에만 들어 있습니다. 관광공사 국문 관광정보 쪽에는 그 칸 자체가 없습니다. 잘 짚으셨습니다 — 같은 파일을 넣으면 실패하지 않고 "붙일 표식이 없어 넘긴 656" 만 남습니다.

## 절차 문서를 저장소에 올렸습니다

`backend/docs/PLACE-DATA-LOAD.md` (MR `!648`). 워크스페이스 로컬에만 두고 "정리해 뒀다" 고 말한 것이 제 실수였습니다. 파일 위치 · 순서 · 확인할 숫자 · 되돌리는 SQL 이 다 들어 있습니다.

## 확인하실 숫자

| 적재 | 기대 |
| --- | --- |
| ① 장소 | 새로 넣은 328곳 |
| ② 탐색 표식 | 새로 붙인 106 · `{ACTIVITY=22, FESTIVAL=14, NATURE=22, NIGHT_VIEW=5, TRADITIONAL_MARKET=33, WALK=10}` |
| ③ 영업시간 | 새로 넣은 268 · **붙일 장소가 없어 넘긴 328** |
| ④ 접근성 | 새로 붙인 130 · `{STROLLER=13, WHEELCHAIR=117}` · **붙일 장소가 없어 넘긴 0** |

③ 의 328 은 정상입니다(음식점을 일부러 안 넣었습니다). ④ 는 0 이 정상입니다(무장애 179곳이 전부 관광공사 656곳 안에 있습니다). 둘 다 다르게 나오면 ①을 안 돌린 것입니다.

## 적재 전에 하나 봐 주시면 좋겠습니다

④ 접근성 판정에 장효준 님께 여쭌 것이 둘 있습니다(`S15P21E201-862`). 휠체어를 원천 문구 하나로 좁힌 것과, 유모차 칸의 뜻이 "대여 가능" 인데 정작 필요한 것은 통행일 수 있다는 것입니다. **바꾸려면 적재 전이 가장 쌉니다** — 뒤에 바꾸면 지우고 다시 돌려야 합니다.

급하시면 ①②③ 만 먼저 돌리셔도 됩니다. 탐색 화면 0건은 ②까지면 풀립니다.

박재현
