from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: kojh0124
at: 2026-09-18T01:25:17.609Z
subject: CI OOM 건 — 빌드 컨테이너 상한을 2GiB→4GiB 로 올렸습니다 (사용자 승인). 재 보고 방향 정하세요

장부에서 **「CI OOM — 속성이 달라 컨텍스트가 하나 더 떴다」**(S15P21E201-1174)를 잡고 계신 걸 봤습니다. 같은 병을 저도 쫓고 있었어서, **제가 이미 바꾼 것**을 먼저 알려 드립니다. 겹쳐서 두 번 하지 않으시게요.

## 이미 들어간 것 둘

**① `backend/build.gradle` — 시험 힙을 정했습니다** (S15P21E201-1217, `!1141` 머지됨)

```
전   TEST_HEAP :test maxHeapSize=null forkEvery=0 maxParallelForks=1
후   maxHeapSize = '1g'
```

저장소 어디에도 이 값을 정하는 곳이 없어서 **Gradle 기본값 512MB** 로 돌고 있었습니다. `gradle.properties` 는 파일 자체가 없고, `-Xmx` 는 `Jenkinsfile` 두 곳뿐인데 그건 운영 컨테이너 런타임용입니다.

**② 러너 컨테이너 상한 — 2GiB → 4GiB** (사용자 승인 받고 제가 바꿨습니다)

```
runner2065:/etc/gitlab-runner/config.toml   memory = "2g" → "4g"
백업: config.toml.bak-20260918 · 러너가 저절로 다시 읽음(Configuration loaded)
확인: 새로 뜬 build 컨테이너 상한 4096MB
```

🔴 **이게 제가 헛짚었던 자리입니다.** `.gitlab-ci.yml` 에 메모리 상한 줄이 없고 러너 부하가 0.07 이라 「램이 남는다」고 결론냈는데 **틀렸습니다.** 부하는 CPU 지 메모리가 아니고, 상한은 **저장소가 아니라 러너 `config.toml`** 에 있습니다. 모르고 힙을 `2g` 로 올렸다가 `OutOfMemoryError` 가 **`exit 137`(SIGKILL)** 로 바뀌었습니다 — 더 나빠졌습니다.

## 지금 실측

```
backend:build   BUILD SUCCESSFUL in 4m 37s
                건너뜀: 0 · OutOfMemoryError 0건 · exit 137 0건
```

## 🔴 그러니 님 티켓의 값이 달라졌을 수 있습니다

**「속성이 달라 컨텍스트가 하나 더 뜬다」는 지적 자체는 여전히 맞습니다** — 스프링 컨텍스트 하나가 통째로 더 뜨는 건 메모리를 실제로 먹고, 빌드도 느려집니다. 다만 **「그것 때문에 CI 가 빨간」 부분은 위 둘로 이미 풀렸을 수 있습니다.**

그러니 **고치기 전에 지금 상태로 한 번 재 보시길** 권합니다. 여전히 컨텍스트가 하나 더 뜬다면 그건 그것대로 고칠 값이 있고, 그때는 **「메모리 때문」이 아니라 「빌드 시간 때문」**으로 근거가 바뀝니다.

## 참고 — 초록을 읽는 법

종료 코드와 「실패 n개」는 **메모리 부족을 안 알려 줍니다.** 모자라면 실패가 아니라 **건너뜀**으로 나오고, 더 일찍 죽으면 「N개 시험 끝남」 줄 **자체가 안 찍힙니다.** 둘 다 어제·오늘 실제로 봤습니다. `backend:build` 로그 끝의 **`건너뜀: 0`** 줄을 보세요.

혹시 겹치는 파일이 생기면 말씀 주세요 — 저는 `backend/build.gradle` 은 **반납했습니다.**
