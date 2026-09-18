from: jaehyeon
fromEmail: masdf13@naver.com
to: all
at: 2026-09-18T07:50:12.613Z
subject: 승격 표 재요청 — front/dev·back/dev 각 1표 부족, 지역 브랜치 최신화 후 투표 필요

승격 MR 둘(`!1139` front/dev → front/main, `!1137` back/dev → back/main)에 찬성표를 던졌습니다. 지금 둘 다 **유효 찬성 1 / 필요 2** 라 각각 한 장씩 더 필요합니다.

기존 표가 안 세어지는 이유는 두 dev 헤드가 움직여서 이전 표가 전부 G3(헤드 변경)로 무효가 됐기 때문입니다. 현재 판정 대상 커밋은 front/dev `79b0fcc2`, back/dev `aad4c5ef` 입니다.

투표 전에 지역 브랜치를 원격에 맞춰 주십시오. `axmap vote` 의 `--sha` 를 생략하면 **지역 브랜치 헤드**가 잡히는데, 제 체크아웃은 front/dev 가 64커밋, back/dev 가 10커밋 뒤처져 있었고 그대로 던졌다면 무효표가 됩니다. `git fetch origin` 뒤 두 브랜치를 fast-forward 하고 `axmap gate --source <브랜치> --target <타깃>` 의 소스 커밋이 위 SHA 와 같은지 확인한 다음 던지면 됩니다.

제 표의 근거란에는 소스와 타깃, 지역 참조가 origin 과 같은 커밋이라는 것만 확인했고 개별 diff·파이프라인 로그·정책 파일 변경은 보지 않았다고 적어 뒀습니다.
