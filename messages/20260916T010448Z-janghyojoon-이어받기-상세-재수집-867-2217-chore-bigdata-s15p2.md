from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: janghyojoon
at: 2026-09-16T01:04:48.922Z
subject: [이어받기] 상세 재수집 867/2217 — chore/bigData/S15P21E201-1031-detail-refetch 에서 --resume

2026-09-16 밤에 남긴다. **다른 컴퓨터에서 이어받아도 되게** 필요한 것을 전부 적는다.

## 지금 어디까지 됐나

- 목록 **2,217곳 전부** 받음
- 상세 **867곳** 받음 · 남은 곳 **1,350** · 빈 상세 26건(내용 없는 곳. 오류 아니다)
- 일일 한도에 걸려 종료 코드 3 으로 멈췄다. 오늘 `detailIntro2` 로 **928건**에서 막혔다

## 어디서 이어받나

```bash
git fetch origin chore/bigData/S15P21E201-1031-detail-refetch
git worktree add <폴더> chore/bigData/S15P21E201-1031-detail-refetch
cd <폴더>/bigData && node collect/tourapi.mjs --resume
```

받아 둔 893줄이 그 브랜치에 커밋돼 있다. `--resume` 이 그걸 읽고 **안 받은 것만** 부른다.

## 🔴 다른 컴퓨터에서 할 때 걸리는 것 셋

1. **`DATA_GO_KR_KEY` 가 git 에 없다.** `bigData/.env` 는 `.gitignore` 다.
   이 PC 에서는 `C:\Users\SSAFY\Desktop\S15P21E201-bigdata\bigData\.env` 에 있다.
   새 컴퓨터는 axMap 저장소의 `docs/26.09.16-인수인계/03-새-컴퓨터-준비.md` 를 본다.
   **키 없이 돌리면 종료 코드 2 로 멈춘다** — 가짜로 채우지 않는다.

2. **일일 한도는 계정당이지 컴퓨터당이 아니다.** 두 컴퓨터에서 같이 돌리면
   같은 한도를 나눠 먹고 **둘 다 중간에 멈춘다.** 한 곳에서만 돌린다.
   돌리기 전에 `ax_claim` 으로 `bigData/data/raw/tourapi/tourapi-busan.ndjson` 을 잡는다 —
   이 장부는 컴퓨터를 넘어 보이므로, 다른 쪽이 잡고 있으면 그 자리에서 거부당한다.

3. **`git add` 가 그냥은 거부한다.** 그 수집본은 `.gitignore` 에 있으면서 추적된다.
   커밋하려면 `git add -f` 를 써야 한다.

## 🔴 끝난 뒤에

- **종료 코드 0 일 때만** MR 을 연다. 지금 그 브랜치는 **부분본**이라,
  머지하면 `bigData/dev` 의 온전한 수집본(667줄)이 부분본으로 바뀐다.
  커밋 제목에도 「머지하지 마라」를 박아 뒀다.
- 적재 순서는 **장소 → 기간 → 사진**이다. 뒤집으면 기간이 전부 버려진다.

## 정해야 할 것 하나

남은 1,350곳은 한도 때문에 **이틀**이 든다(9/17·9/18). 9/18 이 승격 마감선이라 여유가 없다.
쇼핑 980곳을 뒤로 미루면 남는 것이 370곳이라 하루에 끝나는데,
🔴 **「쇼핑은 영업시간이 덜 중요하다」는 아직 실측이 아니라 짐작이다.**
화면이 쇼핑 장소에 영업시간을 그리는지 보고 정한다. s15p21e201-57 에게 확인을 부탁해 뒀다.
