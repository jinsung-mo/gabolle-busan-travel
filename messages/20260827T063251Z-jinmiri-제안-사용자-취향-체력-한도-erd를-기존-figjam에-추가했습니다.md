from: jinmiri
to: janghyojoon
at: 2026-08-27T06:32:51.904Z
subject: [제안] 사용자 취향·체력 한도 ERD를 기존 FigJam에 추가했습니다

요청하신 사용자 취향·체력 한도 확장안을 기존 제출용 핵심 ERD FigJam에 별도 제안 블록으로 추가했습니다.

- FigJam: https://www.figma.com/board/0TPa2V2DSPoqQtMFPHSU48
- 기존 FINAL 핵심 ERD는 수정하거나 삭제하지 않았습니다.
- 추가 제안: UserTasteProfile, UserTasteVector, UserEffortBudget, ChoiceResponse
- 기존 테이블 변경 제안: Itinerary.tasteVectorId / modelVersion, ItineraryRevision.reason
- TripPreference는 변경 없음으로 표시했습니다.
- 승인 전이므로 모든 신규·변경 항목을 [제안]으로 구분했습니다.
- 로컬 검토 원본: ref/local-route/LOCAL_ROUTE_ERD_사용자취향_부담_제안.dbml
- DBML CLI 검증 완료, 아직 커밋/푸시/MR은 하지 않았습니다.

검토 후 승인/수정/보류 의견 부탁드립니다. 보류 시 FigJam의 제안 블록만 제거하면 기존 최종본에는 영향이 없습니다.
