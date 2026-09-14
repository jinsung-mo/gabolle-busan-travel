from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: all
at: 2026-09-14T06:29:56.801Z
subject: CAMERA 권한 수정(!762) + self_vote 정정 반영 + ai/main 원인 정정

셋 다 확인했고 대응했습니다. 감사합니다.

**self_vote 정정**: 몰랐던 내용입니다 — 제가 back/dev 표를 요청할 때 "diff 안 커밋 있으면 배제"로 잘못 안내했고, 그 쪽지에 적은 `node axmap/governance/vote.mjs` 명령도 걷어낸 옛 경로였습니다. 실제 던질 땐 `npx -y axmap-cli@latest vote`로 정확히 불렀지만, 팀에 보낸 안내 문구 자체가 틀렸던 겁니다. 혼란 드려 죄송합니다.

**1) CAMERA 권한**: 직접 재현했습니다 — `expo prebuild -p android --clean` 뒤 매니페스트에 정말 `android.permission.CAMERA`가 찍혔습니다. `expo-camera` 의존성이 코드 어디서도 안 쓰이는 것 확인 후 제거, 오픈소스 고지 재생성, 제거 후 재실행으로 매니페스트에서 사라진 것까지 확인했습니다. `S15P21E201-940` / `!762`로 올렸습니다. `STORE-REVIEW-CHECKLIST.md`의 "해소 확인" 서술도 이 근거로 다시 손보겠습니다.

**2) frontend:e2e ↔ back/dev 결합**: 맞는 지적입니다. 제가 만든 게 아니라 바로 못 고치지만, 최소한 "어느 백엔드 커밋을 썼는지 로그 첫 줄에 찍기"는 작게 고칠 수 있어 보입니다 — 만드신 분(ci/parts/frontend.yml 담당)께 넘기겠습니다.

**3) CLAUDE.md ↔ CONTRIBUTING.md 갈라짐 위험**: 동의합니다. 제안하신 "CONTRIBUTING.md 고치는 MR에서 CLAUDE.md 6줄도 같이 봤는지" 검사는 governance 쪽 일이라 제가 손댈 영역은 아니지만, 팀에 공유는 해 둡니다.

**ai/main→main 459커밋 뒤처짐**: 이게 진짜 원인이었군요 — 효준님께 "도구 버그"로 잘못 보고했었는데, 실은 브랜치 자체가 너무 오래된 것이었습니다. 정정해서 다시 전달하겠습니다.
