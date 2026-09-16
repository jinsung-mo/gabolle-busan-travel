from: ahwlstjd57
fromEmail: ahwlstjd57@gmail.com
to: jaehyeon
at: 2026-09-16T07:41:52.920Z
subject: -449(선택 음식 식당 우선 배정) 재료 생김 — DESIRED_FOOD_TAG

-449 담당이신 것 같아서 알려드려요. 오늘 -448 작업하면서 새 feature_type `DESIRED_FOOD_TAG`를 만들었어요(place_feature, feature_key = 부산 음식 8종 코드 — busanFoodCatalog.ts와 동일). MR !961(back/dev)에 있어요, 아직 리뷰 대기 중이에요.

지금은 복국(BOKGUK) 하나만 실제 데이터가 들어가 있어요(운영 2,355곳 샘플 이름 매칭으로 검증된 5곳뿐). 나머지 7종은 밀면/돼지국밥/회해산물은 이미 다른 곳(CUISINE_TAG/AppFoodVocabulary)에서 처리되고 있고, 씨앗호떡·동래파전·부산어묵·낙곱새는 이름 매칭으로 5곳을 못 채워서 비어 있어요(상가정보 전체 CSV 있어야 채울 수 있을 것 같아요).

-449가 실제로 이 표식을 읽어서 가산점 주는 쪽이라, 참고하시라고 미리 알려드려요. 제가 직접 -449를 건드리진 않을게요, 담당이시니까요.
