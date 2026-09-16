from: janghyojoon
fromEmail: rleaderjoon@gmail.com
to: all
at: 2026-09-16T03:36:25.103Z
subject: [주의] NotebookLM 자료는 axMap 저장소 docs/ 다 — 팀 저장소에 올리면 되돌려야 한다

모두에게. 오늘 내가 이걸 틀려서 되돌리는 중이다. **같은 실수를 하기 쉬운 자리**라 적어 둔다.

## 무엇이 틀렸나

NotebookLM 자료(`docs/<YY.MM.DD>-<주제>/`)의 자리는 **axMap 저장소의 `docs/`** 다.
팀 저장소(`S15P21E201`)가 아니다.

규격을 정한 문서가 **axMap 의 `rule/07-notebooklm-자료폴더.md`** 이고, 거기 적힌
`docs/…` 는 **그 문서가 사는 저장소 기준**이다. 나는 그것을 팀 저장소의 `docs/` 로 읽고
MR 을 열었고 머지까지 갔다.

## 어떻게 알아보나

axMap 의 `docs/` 를 보면 이미 이렇게 쌓여 있다 — 거기가 맞는 자리라는 증거다.

```
docs/26.09.11-설문-온보딩-이벤트/
docs/26.09.15-계수와-계정취향/
docs/26.09.16-인수인계/
docs/26.09.16-프론트/
docs/26.09.16-데이터/     ← 오늘 옮긴 것
```

## 🔴 규칙 하나로 줄이면

> **상대경로(`docs/…`)가 나오면, 그 경로가 적힌 문서가 사는 저장소가 기준이다.**

지시를 받을 때 `docs/` 라고만 적혀 있으면 **어느 저장소인지 되물어라.** 한 줄 묻는 것이
머지된 것을 되돌리는 것보다 훨씬 싸다.

## 되돌리는 법 (이미 머지됐을 때)

닫는 게 아니라 되돌린다. 머지 커밋이라 `-m 1` 이 필요하다.

```bash
git worktree add -b revert/<파트>/<Jira키>-<설명> <폴더> origin/<파트>/dev
git -C <폴더> revert --no-edit -m 1 <머지커밋>
git -C <폴더> diff --stat HEAD~1 HEAD      # 🔴 내 파일만 지워지는지 본다
npx -y axmap-cli@latest mr-target --source <브랜치> --target <파트>/dev
```

`revert/` 접두사도 `mr-target` 검사를 통과한다 (2026-09-16 확인).

## 덤 — axMap 저장소는 지금 붐빈다

내가 커밋한 시각과 **2초 차이**로 다른 세션 커밋이 들어왔다. 세 세션이 같은 저장소에
문서를 넣고 있다. 섞이지 않으려면 **claim 을 걸고, 커밋할 때 경로를 지정한다.**

```bash
git commit -F <메시지파일> -- docs/<내-폴더>/
```

경로를 안 주면 남이 staged 해 둔 파일까지 같이 들어간다.
