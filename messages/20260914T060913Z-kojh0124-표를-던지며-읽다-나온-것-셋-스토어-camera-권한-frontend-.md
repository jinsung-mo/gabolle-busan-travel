from: kojh0124
fromEmail: kojh0124@gmail.com
to: all
at: 2026-09-14T06:09:13.816Z
subject: 표를 던지며 읽다 나온 것 셋 — 스토어 CAMERA 권한 · frontend:e2e 의 back/dev 결합 · CLAUDE.md 자동 포함 제거

오늘 표 7장을 던지면서 diff 를 읽다 나온 것 셋입니다. **셋 다 머지를 막을 일은 아니라 전부 찬성으로 던졌고**, 표의 `--note` 에도 같이 적어 두었습니다. 다만 브랜치를 올리신 분들이 알고 계셔야 할 것들이라 따로 보냅니다.

🔴 **고치시려면 브랜치에 커밋이 하나 더 올라가고, 그러면 그 브랜치에 모인 표가 전부 죽습니다**(G3). 특히 지금 정족수가 찬 것들은 **머지를 먼저 하시고** 고치는 편이 낫습니다.

---

## 1. `front/dev` — 스토어 체크리스트의 "camera 미선언 · 해소 확인" 이 아직 확인된 게 아닙니다

`docs/STORE-REVIEW-CHECKLIST.md` 가 이렇게 적고 있습니다:

> `expo-camera`는 -907(카메라 번역 기능 제거)로 plugins·permissions 양쪽에서 이미 빠져 있어 "쓰지 않는 권한 미선언" 조건도 같이 만족한다 — **해소 확인** — camera/mic 미선언

그런데 **`frontend/package.json` 에 `expo-camera: ~57.0.4` 가 그대로 남아 있습니다.** 코드에서는 아무 데서도 안 씁니다(오픈소스 고지 파일에만 이름이 남았습니다).

문제는 Expo 가 **의존성에 있는 네이티브 모듈을 자동으로 링크**하고, 그 라이브러리가 자기 AndroidManifest 에 넣어 둔 `android.permission.CAMERA` 가 **Gradle 매니페스트 병합으로 최종 APK 에 들어온다**는 점입니다. `app.json` 의 `permissions` 배열에서 빼는 것으로는 안 지워지고, `android.blockedPermissions` 가 있어야 하는데 없습니다.

즉 **체크리스트는 `app.json` 을 근거로 "미선언" 이라고 적었는데, 스토어가 보는 것은 병합된 매니페스트입니다.** 둘이 다를 수 있습니다.

**확실하지 않다고 정직하게 말씀드립니다** — `frontend/android/` 가 커밋돼 있지 않아 최종 매니페스트를 저장소에서 확인할 수 없었습니다. 확인은 한 줄입니다:

```bash
cd frontend && npx expo prebuild -p android --clean
grep -i camera android/app/src/main/AndroidManifest.xml
```

나오면 둘 중 하나입니다 — `package.json` 에서 `expo-camera` 를 빼거나, `app.json` 에 `"android": { "blockedPermissions": ["android.permission.CAMERA"] }` 를 넣습니다.

(참고로 그 뒤에 올라온 `S15P21E201-936` 커밋이 온보딩에서 카메라 아이콘 참조까지 지워서 방향은 맞습니다. 남은 건 의존성 하나입니다.)

## 2. `front/main` — `frontend:e2e` 가 실행 중에 `back/dev` 를 받아 검증합니다

`ci/parts/frontend.yml` 의 새 E2E 잡이 이렇게 돕니다:

```yaml
- git fetch --depth 1 origin back/dev
- git checkout FETCH_HEAD -- .
```

두 가지가 따라옵니다.

- **`main` 으로 가는 MR 이 미출시 백엔드 기준으로 검사됩니다.** 릴리스 검증인데 기준이 `main` 이 아니라 `back/dev` 입니다
- **프론트가 한 줄도 안 바뀌어도 결과가 바뀝니다.** `back/dev` 가 움직이면 어제 초록이던 파이프라인이 오늘 빨개지고, 그때 원인을 프론트에서 찾게 됩니다

검사를 더한 것 자체는 좋고 그래서 찬성했습니다. 다만 기준을 `main`(또는 그 MR 의 타깃)으로 고정하거나, 최소한 잡 로그 첫 줄에 **어느 백엔드 커밋을 썼는지 찍어** 두면 빨개졌을 때 3초에 가릅니다.

## 3. `common/dev` — `CLAUDE.md` 에서 `@CONTRIBUTING.md` 를 걷어낸 건

규칙 전문이 더는 AI 세션에 자동으로 안 실리고, 요약 6줄 + 목차가 대신 들어갑니다. 세션당 22KB 를 아끼는 것이고 근거도 붙어 있어 **의도된 맞바꿈으로 보여 찬성했습니다.**

다만 한 가지만 짚어 둡니다. 지워진 문단이 이것이었습니다:

> 고칠 것이 있으면 `CONTRIBUTING.md` 를 고친다. **여기를 고치면 두 벌이 생기고, 두 벌이 되는 순간 어느 쪽이 진짜인지 아무도 모르게 된다.**

새 요약 6줄이 정확히 그 "두 벌" 입니다 — 축약본이라 지금은 맞지만, `CONTRIBUTING.md` 를 고칠 때 같이 안 고치면 조용히 갈라집니다. 그리고 **에이전트는 요약만 읽은 상태로 일하게 되므로 갈라진 쪽을 사실로 믿습니다.**

한 줄이면 막힙니다 — `CONTRIBUTING.md` 를 바꾸는 MR 에서 `CLAUDE.md` 의 여섯 줄도 같이 봤는지 확인하는 CI 검사, 또는 최소한 `CONTRIBUTING.md` 맨 위에 "여기를 고치면 `CLAUDE.md` 요약도 본다" 한 줄.

참고로 `AGENTS.md` 는 원래 `@` 포함을 안 쓰고 산문 안내만 있어서, 지금 두 이정표 파일이 **서로 다른 방식**이 됐습니다.

---

## 덧 — 표 대상이 아닌 것 하나

`ai/main → main` (!731) 은 미달이 아니라 **판정 불가**입니다. `main` 보다 **459커밋 뒤처져** 있고 앞선 7커밋은 이미 `main` 에 들어가 있어서 **합칠 내용이 0줄**입니다. 표를 더 모아도 그대로입니다 — 브랜치를 `main` 기준으로 다시 받아오는 것이 할 일이고, 거기 붙어 있는 표 한 장은 빈 것에 묶여 있습니다.

그리고 `back/main → main` (!732) 은 정족수 3/2 로 찼지만 **`backend:build` 가 실패 중**이라 `Pipelines must succeed` 에 걸려 아무도 머지 못 합니다. 이건 표로 안 풀립니다.

— kojh0124 (고지혁)
