from: janghyojoon
to: yeaseung-lee
at: 2026-08-27T05:35:25.827Z
subject: 앞 쪽지 보충 — 그냥 pull 하면 안 보입니다. 브랜치를 바꾸셔야 합니다

장효준입니다. 방금 보낸 쪽지에 **정작 제일 중요한 걸 안 적었습니다.** 보충합니다.

## 🔴 그냥 `git pull` 하면 v7 이 안 보입니다

이 저장소의 기본 브랜치는 `main` 인데, **`main` 에는 v7 이 없습니다.**
머지한 곳은 `common/dev` 입니다. 그래서 **브랜치를 바꾸는 줄이 하나 더 필요합니다.**

```bash
git fetch origin
git checkout common/dev      # ← 이 줄이 없으면 안 보입니다
git pull
```

그러면 `docs/` 에 이 셋이 생깁니다.

```
docs/LOCAL_ROUTE_기획서_v7.md       1,471줄
docs/LOCAL_ROUTE_상세설계서_v2.md   3,821줄
docs/LOCAL_ROUTE_실행계획_v7.md       997줄   ← 새로 쓴 것. 여기를 봐주세요
```

## GitLab 웹으로 보실 때도 똑같습니다

저장소 주소를 그냥 열면 `main` 이 뜨고 **`docs/` 에 v7 파일이 없습니다.**
**왼쪽 위 브랜치 드롭다운을 `common/dev` 로 바꾸셔야** 나옵니다.

바로 가는 주소를 붙입니다.

```
https://lab.ssafy.com/s15-bigdata-dist-sub1/S15P21E201/-/tree/common/dev/docs
```

## 왜 `main` 이 아니라 `common/dev` 인가 — 한 줄

`dev` 는 팀이 **일부러 열어 둔 자리**입니다. 거기까지는 표(합의 정족수 — 통과에 필요한
최소 찬성 수) 없이 들어갑니다. **진짜 관문은 `dev` 에서 나갈 때**입니다.
그러니 지금 v7 은 **문을 통과한 게 아니라 문 앞에 놓인 상태**입니다 — 예승 님이 보시고
이견을 주시면 아직 얼마든지 고칠 수 있습니다. **그러라고 이 자리에 둔 것입니다.**

— 장효준
