# iOS build 41 실기기 QA — 탭바 깜빡임 원인 분석

**실측일 2026-09-22 · iPhone 16 Pro (iOS 26.6.2) · TestFlight build 41 (1.0.0)**
Appium XCUITest 로 실기기를 조작하고, 코드는 `front/dev`(`ff4472588`) 기준으로 읽었다.

> 이 문서는 **build 39 QA([../qa-ios-build39/](../qa-ios-build39/))의 후속**이다.
> 팀이 보고한 「탭을 여러 번 누를 때 잠깐씩 이상한 화면이 뜬다」를 파고든 결과를 적는다.

---

## 0. 한 줄 요약

**탭바 깜빡임의 원인을 코드와 런타임 양쪽에서 확증했다.** 원인은 셋이 겹친 것이다.
**이번에 실제로 넣은 것은 C-01 한 줄뿐**이고, C-03 은 시도했다가 되돌렸다(4-1).

| | 무엇 | 고치는 비용 |
|---|---|---|
| **C-01** | 현재 탭을 다시 눌러도 `router.replace` 가 그대로 돈다 | **한 줄** |
| **C-02** | 화면마다 `<TabBar>` 를 따로 그려서, 화면이 바뀌면 탭바도 통째로 다시 만들어진다 | 구조 (중간 크기) |
| **C-03** | `Stack` 에 `animation` 설정이 없어 탭 전환에 **화면 밀기(slide)** 가 붙는다 | ⚠️ **시도했다 되돌림** (5-1) |

---

## 1. 무엇이 보이나

팀 보고: **「하단 탭바에서 각 탭을 여러 번 누를 때 잠깐씩 이상한 화면이 순간 뜬다」**

---

## 2. 🔴 확증한 증거

### 2-1. 런타임 — 탭바가 통째로 사라졌다 다시 생긴다

탭을 빠르게 연달아 눌렀더니 Appium 이 이렇게 답했다.

```
tab-home: The previously found element "tab-home" Other is no longer available
tab-map:  The previously found element "tab-map"  Other is no longer available
tab-feed: The previously found element "tab-feed" Other is no longer available
tab-me:   The previously found element "tab-me"   Other is no longer available
```

🔴 **첫 탭을 누르는 순간 나머지 탭 요소가 전부 무효가 됐다.** 탭바가 자리에 그대로
있었다면 요소도 살아 있어야 한다. **탭바 자체가 언마운트 → 재마운트된다는 뜻이다.**

사용자가 보는 「이상한 화면」은 그 **재생성 사이의 프레임**이다.

### 2-2. 코드 — 화면마다 탭바를 따로 그린다

```
app/(tabs)/home.tsx:356    <TabBar active="home" … />
app/(tabs)/feed.tsx:915    <TabBar …
app/(tabs)/me.tsx:418      <TabBar …
app/(tabs)/trips.tsx:179   <TabBar active="map" />
app/(tabs)/saved.tsx:113   <TabBar active="saved" />
```

`src/components/TabBar.tsx` 맨 위 주석이 이유를 이미 적어 두었다.

> 이 셸은 아직 React Navigation 의 진짜 탭 내비게이션이 아니라 **Stack 하나뿐**이라
> (app/\_layout.tsx), **각 화면이 이 바를 직접 그려 붙인다.**

`app/(tabs)/_layout.tsx` 도 `<Slot />` 하나뿐이라 탭바를 안 잡아 준다.
`Screen.tsx` 는 탭바 **높이만큼 여백만** 잡고 바 자체는 안 그린다(`withTabBar`).

**→ 화면이 바뀌면 탭바도 반드시 새로 만들어진다.** 공유되는 탭바가 없다.

### 2-3. 코드 — 현재 탭을 눌러도 화면을 갈아 끼운다

`src/components/TabBar.tsx:177` 은 지금 어느 탭인지 **이미 알고 있다.**

```tsx
const selected = tab.key === active;
```

그런데 195-197 행은 그 값을 **안 쓴다.**

```tsx
onPress={() => {
  if (tab.route) router.replace(tab.route);   // ← selected 를 안 본다
}}
```

**→ 홈에 있으면서 홈을 눌러도** `router.replace('/home')` 이 돌아 화면 전체가 다시
마운트된다. 눌러도 아무 일도 안 일어나야 맞는 자리다.

### 2-4. 코드 — 탭 전환에 「화면 밀기」가 붙어 있다

`app/_layout.tsx:83-88`

```tsx
<Stack
  screenOptions={{
    headerShown: false,
    contentStyle: { backgroundColor: color.canvas },
  }}
/>
```

**`animation` 이 없다.** 그래서 iOS 기본값인 `slide_from_right` 가 적용된다.
탭 전환은 **밀고 들어오는 동작이 아닌데** 화면이 옆에서 밀려 들어오고, 그 위에서
탭바가 2-2 대로 다시 그려지니 깜빡임이 더 눈에 띈다.

---

## 3. 고치는 법

### C-01 — 현재 탭이면 아무 것도 하지 않는다 (한 줄)

`src/components/TabBar.tsx:195`

```diff
  onPress={() => {
-   if (tab.route) router.replace(tab.route);
+   if (tab.route && !selected) router.replace(tab.route);
  }}
```

`selected` 는 **바로 위 177 행에 이미 있다.** 이 한 줄이 「같은 탭 연타」로 생기는
재마운트를 **전부** 없앤다.

### C-03 — 탭 전환에서 밀기를 뺀다 ⚠️ **아직 넣지 않았다**

`(tabs)/_layout.tsx` 의 `<Slot />` 을 `<Stack screenOptions={{ animation: 'none' }} />` 로
바꿔 봤다가 **되돌렸다.** 경위는 5-1 에 적었다.

전역 Stack(`app/_layout.tsx`)에 `animation: 'none'` 을 거는 방법도 있지만, 그러면
장소 상세·설정처럼 **밀고 들어오는 것이 자연스러운 화면까지** 같이 죽는다.
각 탭 화면에서 `<Stack.Screen options={{ animation: 'none' }} />` 로 좁게 거는 쪽이
안전해 보이지만 **실기기에서 확인하지 못했다.**

### C-02 — 탭바를 한 벌로 (구조)

근본 해결은 탭바를 **화면 밖 한 곳에서 한 번만** 그리는 것이다. `(tabs)/_layout.tsx` 가
`<Slot />` 대신 탭바를 함께 그리면 화면이 바뀌어도 탭바는 안 죽는다.

비용이 있는 작업이라 **C-01 을 먼저 넣고 남은 깜빡임을 다시 보는 순서**를 권한다.
C-01 만으로도 「같은 탭 연타」로 생기던 재마운트는 사라진다.

---

## 4. 확인하지 못한 것 — 정직하게 남긴다

🔴 **「이상한 화면」이 눈으로 정확히 무엇인지는 못 봤다.**

Appium 으로는 이 깜빡임을 **재현해서 찍을 수 없다.**

| 시도 | 결과 |
|---|---|
| 접근성 트리 연속 조회 | 전환이 이미 끝난 뒤만 보인다 — 중간 상태가 안 잡힌다 |
| 스크린샷 연속 촬영 | 1장에 ~1초. 100~300ms 짜리 깜빡임보다 **훨씬 느리다** |
| 화면 녹화(`start_recording_screen`) | ffmpeg 이 없어 실패 |

그래서 **원인은 확증했지만 증상 자체는 코드로 추론한 것**이다.
아래가 남았다.

- [ ] **아이폰 화면 기록**(제어센터 → 화면 기록)으로 탭을 연타하며 녹화
      → 흰 화면인가 · 이전 화면 잔상인가 · 빈 목록인가
- [ ] C-01 이 들어간 빌드로 **같은 방법으로 다시 녹화**해 비교

녹화본이 있으면 3절의 어느 원인이 실제로 지배적인지 **바로 판정할 수 있다.**

---

## 4-1. 🔴 C-03 을 시도했다가 되돌린 기록

`(tabs)/_layout.tsx` 를 `Slot` → `Stack` 으로 바꿔 **실기기 Release 빌드**에 올렸더니
**앱이 검은 화면만 띄웠다** — 접근성 트리가 통째로 비었고(el=0) 프로세스는 살아 있었다.

처음에는 「뿌리 Stack 안에 Stack 을 또 넣어서」라고 판단했다. **그런데 틀렸다.**
`Slot` 으로 **되돌려 다시 빌드해도 검은 화면은 그대로였다.**

| 확인한 것 | 결과 |
|---|---|
| `main.jsbundle` 이 앱에 들어갔나 | ✅ 6.2MB 로 들어가 있다 |
| Info.plist 에 dev 설정 남았나 | ✅ `NSAllowsArbitraryLoads = false` — 정상 |
| expo-dev-client 가 섞였나 | ✅ 없다 |
| 기기 콘솔 로그 | ❌ 수집 실패 — 원인 문구를 못 받았다 |

**→ 검은 화면의 원인은 이 파일이 아니라 로컬 Release 빌드 쪽에 따로 있다. 원인 미상이다.**

그래서 C-03 은 **넣지 않았고**, `Slot` 을 그대로 둔다. 저장소의 다른 그룹도 전부 `Slot` 이라
선례를 따르는 편이 안전하고, 검증 못 한 구조 변경을 남길 이유가 없다.

🔴 **기기에 있던 TestFlight build 41 이 이 로컬 빌드로 덮어써졌다.** 검증이 끝난 뒤
로컬 빌드를 지웠으니 **TestFlight 에서 다시 설치해야 한다.**

---

## 5. 곁다리 — 이번에 확인된 것

### 같은 탭 연타로 요소가 쌓이지는 않는다

처음에 홈을 5번 눌렀더니 접근성 요소가 163 → 172 로 늘어 **누수인 줄 알았다.**
세어 보니 늘어난 것은 전부 **지연 로딩된 장소 사진과 출처 표기**였다.

```
+1 [Image] '영도다리축제 장소 사진'
+4 [StaticText] '사진 제공: 한국관광공사 공공누리 제3유형'
+1 [Image] '전포커피축제 장소 사진'
```

중복 누적이 아니라 **정상 동작**이다. 첫 판단을 정정한다.

### 죽은 버튼은 코드 레벨에 없다

`accessibilityRole="button"` 인데 `onPress` 가 없는 자리를 전수 검사했다 — **0건**이다.
`src/trip/TripNameSheet.tsx:224` 의 빈 `onPress` 는 **모달 안쪽 터치가 밖으로 새지 않게
막는 의도된 패턴**이고 주석도 달려 있다.

**→ 팀이 본 「쓰이지 않는 버튼」은 코드가 아니라 동작 레벨**(눌리긴 하는데 화면이
안 바뀌는 것)일 가능성이 높다. 이건 아직 전수 조사하지 못했다(4절과 함께 남는 숙제).

### build 39 지적 중 고쳐진 것

- **B-07 탭 선택 상태 미노출** → ✅ `accessibilityState={{ selected, … }}` 가 들어갔다
  (`TabBar.tsx:192`)

`front/dev` 에 `fix/front/S15P21E201-1489-qa39-copy-a11y` 가 올라와 있어 39 지적 중
일부가 반영되는 중으로 보인다. **전체 회귀 확인은 아직 못 했다.**

---

## 6. 재현 환경

```
기기    iPhone 16 Pro (iPhone17,1) · iOS 26.6.2 · UDID 00008140-000651513453001C
앱      com.gabolle.app  1.0.0 (41)  — TestFlight 설치본
코드    front/dev @ ff4472588
자동화  Appium 3.7.0 + xcuitest 12.12.4 + Appium-Python-Client
```

> 🔴 **WebDriverAgent 를 다시 깔면 「신뢰」를 다시 해야 한다.**
> 설정 › 일반 › VPN 및 기기 관리 › 개발자 앱 › `Apple Development: …` › 신뢰.
> 안 하면 WDA 가 설치는 되는데 `/status` 응답이 없어 **원인 없이 타임아웃**처럼 보인다.
