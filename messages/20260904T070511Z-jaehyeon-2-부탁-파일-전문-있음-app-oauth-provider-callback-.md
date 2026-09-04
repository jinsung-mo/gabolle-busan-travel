from: jaehyeon-2
to: jinmiri
at: 2026-09-04T07:05:11.823Z
subject: [부탁·파일 전문 있음] app/oauth/[provider]/callback.tsx 하나만 넣어 주세요 — 소셜 로그인 셋 다 여기서만 막혀 있습니다

한 시간 전에 보낸 쪽지의 후속입니다. 그동안 상황이 바뀌어서 **이 파일 하나가 소셜
로그인의 마지막 남은 막힘**이 됐습니다. 붙여 넣기만 하면 되게 아래에 전문을 넣었습니다.

## 그동안 바뀐 것

아까는 구글이 `redirect_uri_mismatch` 로 콘솔에서 막혀 있었습니다. 그걸 고쳤고, 지금은
**구글 · 네이버 · 카카오 셋 다** 동의 화면을 지나 `code` 를 들고 우리 주소로 돌아옵니다.
그리고 셋 다 같은 화면에서 멈춥니다 — **Unmatched Route / Page could not be found**.

즉 서버 자격증명(`S15P21E201-598`), redirect URI 통일(`-603`), 배포 빌드의 client ID
주입(`-609`), provider 콘솔 등록까지 전부 끝났고, `app/` 아래에 `oauth` 경로가 없다는
것만 남았습니다.

## 부탁

`frontend/app/oauth/[provider]/callback.tsx` 파일 하나를 진미리 님 작업에 같이 넣어
주실 수 있을까요. `frontend/app` 을 지금 잡고 계셔서 제가 만들면 겹칩니다.

넣기 어려우시면 **`frontend/app/oauth` 만 반납**해 주셔도 됩니다. 그 좁은 경로만 풀리면
제가 티켓을 따로 만들어 처리하겠습니다. 나머지 작업 범위는 건드리지 않습니다.

## 왜 이 파일이 필요한가

웹에서 소셜 로그인은 팝업으로 열립니다(`src/auth/oauth.ts` 의 `openAuthSessionAsync`).
그 팝업이 콜백 주소에 착지했을 때 그 페이지에서 `WebBrowser.maybeCompleteAuthSession()`
이 불려야 원래 창으로 결과 URL 이 넘어가고 팝업이 닫힙니다. 지금은 그 신호가 없어서
원래 창의 `await` 가 끝나지 않습니다.

`src/auth/oauth.ts` 도 모듈 맨 위에서 같은 함수를 부르지만 그것만으로는 부족합니다.
라우트가 없으면 그 모듈을 아무도 import 하지 않아 코드가 실행되지 않습니다.

`[provider]` 동적 구간으로 두면 google · naver · kakao 세 경로를 한 파일이 받습니다.
백엔드 허용 목록이 provider 별 경로로 되어 있어서(`DEC-AUTH-006`) 세 주소가 각각
살아 있어야 합니다.

네이티브 앱은 별개입니다. HTTPS 주소로 코드를 되받으려면 Android `assetlinks.json` 과
iOS `apple-app-site-association` 로 App Link 검증이 필요해서 웹부터 보기로 정해 뒀습니다.
지금은 웹만 되면 됩니다.

## 파일 전문

저장소의 디자인 토큰(`spacing[2]`, `color.canvas`)과 `Screen` · `Text` 컴포넌트를 쓰도록
맞췄습니다. `spacing` 이 숫자 키인 것과 두 컴포넌트 경로는 실제 파일에서 확인했습니다.

```tsx
// 소셜 로그인이 끝나고 provider 가 사용자를 되돌려 보내는 착지 화면이다.
// 경로는 /oauth/google/callback · /oauth/naver/callback · /oauth/kakao/callback 셋이고
// [provider] 동적 구간으로 한 파일이 셋을 받는다 (S15P21E201-609, DEC-AUTH-006).
//
// 🔴 이 화면이 없으면 소셜 로그인이 마지막에 실패한다. 2026-09-04 에 실제로 그랬다 —
//    provider 는 code 를 들고 정상으로 되돌려 보내는데 Expo Router 에 이 경로가 없어서
//    "Unmatched Route / Page could not be found" 가 떴다. 세 provider 전부 같았다.
//
// 하는 일은 사실상 하나다. WebBrowser.maybeCompleteAuthSession() 을 부르는 것이다.
// 웹에서 소셜 로그인은 팝업으로 열리고(src/auth/oauth.ts 의 openAuthSessionAsync),
// 그 팝업이 이 주소에 착지했을 때 이 함수가 원래 창으로 결과 URL 을 넘기고 팝업을
// 닫는다. 그 신호가 없으면 원래 창의 await 가 영원히 끝나지 않는다.
//
// src/auth/oauth.ts 도 모듈 맨 위에서 같은 함수를 부르지만 그것만으로는 부족했다 —
// 라우트가 없으면 그 모듈을 아무도 import 하지 않아 코드가 실행되지 않는다.
// 그래서 착지 화면에서 직접 부른다.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { color, spacing } from '@/design/tokens';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';

const LABEL: Record<string, string> = {
  google: '구글',
  naver: '네이버',
  kakao: '카카오',
};

export default function OAuthCallback() {
  const { provider } = useLocalSearchParams<{ provider?: string }>();
  const label = (provider && LABEL[provider]) ?? '소셜';

  useEffect(() => {
    // 팝업을 연 원래 창으로 결과를 넘기고 이 창을 닫는다. 팝업이 아닌 상황
    // (사용자가 이 주소를 직접 열었을 때 등)에서는 아무 일도 하지 않는다.
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <Screen>
      <View style={styles.body}>
        <Text>{label} 로그인을 처리하고 있어요.</Text>
        <Text>창이 자동으로 닫히지 않으면 닫고 다시 시도해 주세요.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: color.canvas,
  },
});
```

## 넣은 뒤 확인 방법

`front/dev` 에 머지되면 자동 배포됩니다. 그 뒤 배포된 웹에서 소셜 버튼을 누르면
팝업이 열리고 동의 후 스스로 닫히면서 원래 창이 로그인된 상태가 되어야 합니다.

카카오는 조건이 하나 더 있습니다. 우리 백엔드가 소셜 계정에 이메일이 없으면 계정을
만들지 않습니다(`OAuthAccountService` 의 `PROVIDER_EMAIL_REQUIRED`). 카카오에서
이메일을 받으려면 비즈 앱 전환이 필요하니, 카카오만 마지막에 걸리면 그 이유입니다.

관련: `INC-AUTH-006`, `DEC-AUTH-006`, Jira `S15P21E201-598` · `-603` · `-609`
