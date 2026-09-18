from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-18T08:52:20.478Z
subject: 정정 둘째 — 잡은 17개가 아니라 20개입니다 (include 를 안 셌습니다). 표는 다 찼습니다

**박재현·이예승 두 분 덕에 세 MR 모두 정족수를 채웠습니다.** 감사합니다.

```
!1193 front/main    유효 찬성 2 / 필요 2
!1194 back/main     유효 찬성 2 / 필요 2
!1195 bigData/main  유효 찬성 2 / 필요 2
```

셋 다 표가 **지금 브랜치 끝 커밋**에 정확히 박혔습니다(`d702c1ae`·`b4d77735`·`49dcfab6`).

## 잡 개수를 한 번 더 정정합니다 — 20개입니다

처음에 **21**이라 했고, **17**로 고쳤는데, **그것도 틀렸습니다. 20입니다.**

```
.gitlab-ci.yml            잡 17   (세 파트 동일, blob f387ba9571)
ci/parts/frontend.yml     잡  3   frontend:dependency-scan · frontend:smoke · frontend:e2e
ci/parts/backend.yml      잡  0
ci/parts/bigdata.yml      잡  0
                        ────────
                          잡 20
```

`.gitlab-ci.yml` 이 `ci/parts/*.yml` 을 **`include`**(**다른 파일의 잡을 끌어와 붙이는 것**)로
가져오는데, 저는 `.gitlab-ci.yml` 의 최상위 키만 세고 **끌어온 것을 안 셌습니다.**
두 번 다 같은 실수입니다 — 파일을 안 열고 셌습니다.

## 🔴 겸사겸사 찾은 것 — `ci/parts/frontend.yml` 은 통일 대상이 아니었습니다

제 통합 작업은 `.gitlab-ci.yml` 과 `compose.yaml` 둘뿐이었습니다. 실측하니
`ci/parts/frontend.yml` 이 **front/main 만 다릅니다.**

```
backend.yml    네 브랜치 전부 5962238e  같음
frontend.yml   front/main 4895a8d1  ·  main·back·bigData 407c446b   ← 다름
bigdata.yml    네 브랜치 전부 5b3283da  같음
```

**문제 없습니다.** 다른 쪽이 **front/main 의 새 버전**이고, 나머지 셋은 손대지 않은
옛 버전이라 3-way 머지가 바뀐 쪽을 그대로 취합니다. 여섯 가지 머지 순서를 전부
돌려 확인했습니다 — **충돌 0건, 여섯 다 같은 결과 트리(b3e833ad)** 이고
그 안의 `ci/parts/frontend.yml` 은 **front 의 새 버전(4895a8d1)** 입니다. 잃는 것이 없습니다.

그 새 버전이 담고 있는 것은 **S15P21E201-983** — 프론트 잡 셋에 `tags: [heavy]` 를 붙여
운영 호스트(러너 2037)에서 백업 러너(2065)로 보낸 변경입니다. 이게 `main` 에 들어갑니다.

## 지금 상황

파이프라인이 한동안 밀렸습니다. 제가 만든 것과 30분 스케줄 `vote-recheck` 가 만든 것이
겹쳐 **아무도 안 보는 파이프라인 4개**가 백업 러너를 잡고 있었습니다
(`backend:build` 는 `resource_group` 으로 한 번에 하나만 돕니다). 정리했습니다.

남은 것은 `!1193` 5잡 · `!1194` 2잡 · `!1195` 2잡뿐입니다.
초록이 되는 대로 **하나씩** 머지하겠습니다 — 동시에 넣으면 `version` 잡이 태그를
같이 만들려다 부딪힙니다.

**`*/main` 동결은 머지가 다 끝날 때까지 유지해 주세요.**
