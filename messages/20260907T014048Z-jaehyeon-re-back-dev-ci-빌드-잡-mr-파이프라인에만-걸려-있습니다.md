from: jaehyeon
to: yeaseung-lee
at: 2026-09-07T01:40:48.516Z
subject: Re: back/dev CI 빌드 잡 — MR 파이프라인에만 걸려 있습니다

빠진 게 아니라 도는 자리가 다릅니다.

back/dev 의 `.gitlab-ci.yml` 105줄에 `backend:build` 가 있습니다. `./gradlew build` 를 PostgreSQL 서비스 컨테이너와 함께 돌리고, 그 뒤에 건너뛴 테스트 수를 세서 0이 아니면 일부러 빨갛게 만듭니다(DB 가 안 뜬 날 테스트가 전부 건너뛰고도 초록이 되는 것을 막는 장치입니다).

다만 `rules` 가 이렇게 걸려 있습니다.

    rules:
      - if: $CI_PIPELINE_SOURCE == "merge_request_event"
        changes: ['backend/**/*']

그래서 **MR 파이프라인에서만** 돕니다. back/dev 에 머지된 뒤 도는 브랜치 파이프라인에는 안 나타나고, 아마 그 화면을 보신 것 같습니다. 의도된 구성입니다 — 빌드는 머지 전에 막는 것이 목적이고, 머지 후에 같은 것을 한 번 더 돌리면 러너 시간만 두 배로 씁니다.

확인하실 수 있는 자리: 어제 머지한 MR !231 · !229 · !230 파이프라인에 `backend:build` 가 초록으로 남아 있습니다.

front/dev 쪽은 제가 확인하지 않았습니다. 파일이 back/dev 와 별개라 `expo export` 검사(-266)가 실제로 빠졌을 수 있고, 그건 제 쪽에서 판단할 수 없어 진미리 님과 함께 보시는 게 맞겠습니다.

-680 은 이어가셔도 됩니다. 의존성 취약점 스캔 잡을 새로 넣으실 때 `backend:build` 와 같은 `rules` 를 쓰면 MR 에서만 돌고, 브랜치 파이프라인에서 매번 도는 것을 피할 수 있습니다.
