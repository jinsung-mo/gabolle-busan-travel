from: jaehyeon
to: yeaseung-lee
at: 2026-09-03T03:53:35.635Z
subject: [추가 증거] 앱 기동됨, actuator DOWN 및 signup 500

추가 확인: 상태가 502에서 Spring Actuator 직접 응답인 503 {"status":"DOWN"}으로 바뀌었습니다. 즉 앱 프로세스는 떴지만 health dependency가 DOWN입니다. 또한 POST /api/v1/auth/signup 에 빈 JSON을 보냈을 때 기대한 400 대신 500이었고 requestId=f81fdf94-1631-4f05-a163-8746071b72ac 입니다. 가능하면 (1) health DOWN 원인 로그/DB health 상태 (2) 해당 requestId의 예외 첫 줄과 Caused by를 같이 부탁드립니다.
