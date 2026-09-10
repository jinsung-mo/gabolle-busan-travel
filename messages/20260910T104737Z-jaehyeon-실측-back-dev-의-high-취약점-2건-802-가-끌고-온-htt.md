from: jaehyeon
fromEmail: masdf13@naver.com
to: ahwlstjd57 yeaseung-lee
at: 2026-09-10T10:47:37.989Z
subject: [실측] back/dev 의 HIGH 취약점 2건 — -802 가 끌고 온 httpcore5·httpclient5 (머지는 안 막힘)

제 MR(!522, 애플 로그인)에서 `backend:dependency-scan` 이 빨갛게 떴는데, 원인이 제 변경이 아니라 이미 `back/dev` 에 들어가 있는 의존성이라 그대로 전합니다. **머지를 막지는 않습니다**(`allow_failure: true`).

## 무엇이 걸렸나

```
org.apache.httpcomponents.client5:httpclient5@5.5.2   GHSA-hjcp-jmpx-g3qm  5.3
org.apache.httpcomponents.core5:httpcore5@5.3.6       GHSA-hf6x-8p5f-cgmf  7.5
org.apache.httpcomponents.core5:httpcore5-h2@5.3.6    GHSA-v3jc-474w-2wm6  7.5
```

HIGH(7.0 이상) 둘이라 잡이 실패합니다.

## 어디서 들어왔나

`backend/gradle.lockfile` 이력을 보면 이 세 좌표는 **d9cad5f5 `[S15P21E201-802]` 자연어 여행 도우미 assistant API** 에서 처음 들어옵니다. `com.anthropic:anthropic-java:2.34.0` 이 전이로 끌고 오는 것으로 보입니다.

근거 둘입니다. 하나, 제 브랜치는 `back/dev`(b1a0a130) 기준이고 저는 `gradle.lockfile` 을 건드리지 않았습니다(바뀐 파일 8개 전부 `auth` 아래와 `application-dev.properties`). 둘, 같은 스캐너가 `feat/back/S15P21E201-804-research-place-loader` 에서는 초록인데 그 브랜치의 잠금 파일에는 httpcore5 자체가 없습니다.

## 제안

`S15P21E201-367` 때 이예승 님이 minio 로 같은 상황을 푼 방식이 그대로 맞을 것 같습니다 — 고쳐진 판이 있으면 `build.gradle` 에 그 좌표만 명시로 올려 전이 버전을 덮고, 잠금 파일을 다시 만드는 것입니다(`bcprov-jdk18on` 줄이 그 예입니다).

제가 손대지 않은 이유는 이게 AI 도우미 쪽 의존성이라 판을 올렸을 때 무엇이 깨지는지 제가 판단할 수 없어서입니다. 고칠 때 도움이 필요하시면 말씀해 주세요. 지금은 앞으로 나오는 **모든 백엔드 MR 이 이 잡만 빨간 채로** 올라옵니다 — 그 상태가 길어지면 진짜 새 취약점이 들어와도 "원래 빨갛다" 로 넘어가게 됩니다.
