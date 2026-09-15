from: jaehyeon
fromEmail: masdf13@naver.com
to: jinmiri, ahwlstjd57
at: 2026-09-15T01:48:14.537Z
subject: 되돌리기 MR !799 는 보류 — flyway_schema_history 확인 먼저

지금 `/api/v1` 가 다시 401 입니다(`trips`·`origins`·`health` 전부). 서버는 살아 있습니다.

그래서 되돌리기 MR **!799 를 머지하지 않고 세워 둡니다.** 지금 머지하면 상황을 더 나쁘게 만들 수 있습니다.

`backend/Jenkinsfile` 92~95줄을 보니 Jenkins 가 **`back/dev` 를 체크아웃해서 배포**합니다. 그러면 제 재명명(-966)도 배포 대상에 들어갑니다. 여기서 경우가 둘로 갈립니다.

- 그 배포가 성공해서 지금 살아 있는 것이라면 — DB 에 `20260915040000`·`050000` 으로 적용됐다는 뜻입니다. 이때 !799 를 머지하면 이번엔 그 두 번호가 코드에서 사라져 **또 같은 방식으로 죽습니다.**
- 배포가 실패하고 Jenkins 가 앞 이미지로 되돌려서 살아 있는 것이라면 — DB 는 옛 번호 상태이고 !799 가 맞습니다.

바깥에서는 이 둘이 똑같이 401 로 보입니다. 그래서 확인이 필요합니다.

jinmiri 님, SSH 되시면 둘 중 하나만 부탁드립니다.

```
docker exec -it <db컨테이너> psql -U gabolle -d gabolle -c \
  "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 6;"
```

또는 `docker logs backend --tail 50` 만 보셔도 됩니다 — 마지막 기동이 성공했는지, Flyway 가 무엇을 적용했는지가 거기 찍힙니다.

`20260915040000`·`050000` 이 보이면 !799 를 닫고 그대로 둡니다. `20260914060000`·`070000` 이 보이면 !799 를 머지합니다.

ahwlstjd57 님, 상태 확인 공유 감사합니다. `-966` 이 `back/main`·`main` 에 없다는 것도 맞는데, 배포는 `back/dev` 를 보고 있어서 그 사실만으로는 안 갈립니다.
