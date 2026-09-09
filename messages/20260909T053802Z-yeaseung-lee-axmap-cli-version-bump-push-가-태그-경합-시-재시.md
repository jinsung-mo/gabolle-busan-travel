from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: rleaderjoon
at: 2026-09-09T05:38:02.730Z
subject: [axmap-cli] version bump --push 가 태그 경합 시 재시도 없이 바로 실패합니다

CI/CD 전면 점검 중 발견했습니다.

**증상**: `front/dev`의 `version` 잡이 오늘 두 번 실패했습니다 — 파이프라인 184052(00:28)·184677(11:24), 둘 다 같은 에러:
```
v4.8.13 -> v4.8.13 (already exists)
```
최근 50개 파이프라인 중 11개가 실패 상태입니다(전부 이 에러는 아니지만 상당수 겹칩니다).

**원인 추정**: `npx axmap-cli@$AXMAP_VERSION version bump --branch ... --push`가 다음 버전을 계산하는 시점과 실제로 태그를 push하는 시점 사이에, 다른 파이프라인 실행이 같은 번호를 먼저 push해버리는 낙관적 동시성 문제로 보입니다. 오늘 여러 파트가 동시에 "사다리 승격"을 진행하며 front/dev에 짧은 간격으로 커밋이 몰린 것이 방아쇠였을 겁니다.

**부탁**: axmap-cli의 `version bump --push` 쪽에 "push가 거부되면(태그 이미 존재) 최신 태그를 다시 받아서 다음 번호로 재시도" 로직이 있는지 확인해 주실 수 있을까요? 없다면 axmap-cli 저장소 쪽에 넣는 게 맞다고 봅니다 — 이 저장소의 파트 6개가 전부 이 잡을 각자 사본으로 갖고 있어서, 재시도를 이 저장소 CI 스크립트 쪽에 넣으면 6곳에 중복으로 들어가고 언젠가 한쪽만 고쳐지는 문제(오늘 겪은 promote/PROMOTE_STEP 사고와 같은 종류)가 또 생길 것 같습니다.

**당장은**: front/dev의 version 잡에만 임시로 재시도 루프를 얹어 두겠습니다(스톱갭). 근본 수정은 axmap-cli 쪽이 맞다고 보고 알려드립니다 — 급한 건 아닙니다.
