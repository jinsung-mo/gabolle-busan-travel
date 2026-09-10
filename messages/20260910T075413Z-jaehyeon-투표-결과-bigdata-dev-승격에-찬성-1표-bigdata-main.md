from: jaehyeon
fromEmail: masdf13@naver.com
to: all
at: 2026-09-10T07:54:13.144Z
subject: 투표 결과 — bigData/dev 승격에 찬성 1표, bigData/main → main 은 아직 던지면 안 됩니다

오늘 열려 있는 승격 표를 훑고 던질 수 있는 자리에 던졌습니다. 결과와 못 던진 이유를 그대로 적습니다.

## 던진 표

**bigData/dev → bigData/main @ f2466600 · approve** — 유효 찬성 1/2 (1표 더 필요)

이 승격이 kojh0124 님이 05:32 쪽지에서 멈춰 세운 별점 문제를 푸는 쪽입니다. `S15P21E201-760` 별점 걷어내기(f5ecac70)가 `bigData/dev` 에는 들어와 있고 `bigData/main` 에는 아직 없습니다.

`research/data/results/` 안에서 센 파일 수입니다.

| 낱말 | bigData/main (bf3a05a2) | bigData/dev (f2466600) |
|---|---|---|
| `"rating"` 키 | 25 | 0 |
| `N.N/5` | 36 | 0 |
| `Daco N점` | 20 | 0 |
| `N명 평가` | 21 | 0 |

## 던지지 않은 표

**bigData/main → main @ bf3a05a2** — 지금 1/2 입니다. 여기에 한 표가 더 들어가면 위 표의 왼쪽 칸이 그대로 `main` 으로 올라갑니다. 그래서 저는 안 던졌고, `bigData/dev` 승격이 먼저 들어간 뒤 새 헤드에서 던지는 것이 맞다고 봅니다. yeaseung-lee 님 표(05:16)가 이미 한 장 서 있으니 그 앞에 이 쪽지를 둡니다.

**front/dev → front/main @ 96f08d6c** — 1/2 인데 그 한 표가 제 표입니다. 두 번은 못 던집니다. jinmiri 님이 헤드를 잡아 두고 계시니 아직 안 던지신 분(rleaderjoon · yeaseung-lee · kojh0124) 중 한 분이면 됩니다.

**back/dev → back/main @ 53cc3fe1** — 0/2. 맨 위 커밋이 제 것이라 자기 표 규칙(self_vote=tip)에 걸려 제가 못 던집니다.

**common/dev → common/main @ 3d810bd2** — 0/2. `common/main` 의 정책 파일이 옛 판이라 자기 표 범위가 `authors` 로 걸립니다. 이 구간 751커밋 중 174개가 제 것이라 제 표는 안 셉니다. `main` 의 `self_vote: "tip"` 한 줄이 `common/main` 에 아직 안 올라간 것이 원인입니다.

**ai/main → main** — 게이트가 "바뀐 경로 0개" 로 판정 불가를 냅니다. 표로 푸는 문제가 아니라 환경 쪽이라 손대지 않았습니다.

## 이미 찬 것

`front/main → main` 2/2, `back/main → main` 2/2. 둘 다 승격 MR 만 걸면 됩니다. 최상위 `main` 이라 제가 임의로 누르지 않았습니다.

## 게이트가 거짓으로 "판정 불가" 를 낼 수 있습니다

제 PC 에서 `axmap gate --source bigData/dev` 가 계속 "바뀐 경로가 하나도 없습니다" 를 냈는데, 원인은 로컬에 남아 있던 옛 `bigData/dev`·`bigData/main`·`back/main` 브랜치였습니다. 셋 다 `main` 자리에 멈춰 있었고 게이트가 원격이 아니라 그쪽을 읽었습니다. `git branch -f <브랜치> origin/<브랜치>` 로 맞추니 정상 판정이 나옵니다. 같은 증상 보시면 로컬 브랜치부터 확인해 보세요.
