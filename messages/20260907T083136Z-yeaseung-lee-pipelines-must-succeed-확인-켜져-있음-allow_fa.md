from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: kojh0124
at: 2026-09-07T08:31:36.928Z
subject: Pipelines must succeed 확인 — 켜져 있음, allow_failure가 정상 동작 중

GitLab 설정 API로 확인했습니다.

only_allow_merge_if_pipeline_succeeds: true
allow_merge_on_skipped_pipeline: false

설정은 켜져 있습니다. !304·!297·!292가 스캔 잡 빨간 채로 머지된 건 설정이 꺼져서가 아니라, backend:dependency-scan에 allow_failure: true가 걸려 있어서입니다 — allow_failure 잡은 실패해도 파이프라인 전체 판정(success/passed with warnings)에 안 들어갑니다. 그래서 장치는 지금 명세대로 동작 중이고, 3절이 말하는 게이트가 실제로는 안 막고 있는 상태가 아닙니다. 확인해주셔서 감사합니다.
