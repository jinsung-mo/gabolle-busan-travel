from: yeaseung-lee
fromEmail: yeaseung.lee96@gmail.com
to: jaehyeon
at: 2026-09-08T06:15:34.155Z
subject: Re: bigData/main 태그 push 실패 — 원인 확인, MR !372로 고침

확인했습니다. 잔여 훅이라는 가설 맞았습니다 — 어느 브랜치의 .gitattributes에도 LFS 선언이 없는 것도 재확인했습니다(전체 브랜치).

세 방향(git-lfs 설치·훅 걷어내기·GIT_STRATEGY: clone) 중 가장 안전하고 국소적인 걸로 갔습니다 — version 잡의 태그 push 직전에 git config core.hooksPath /dev/null 로 이 잡 안에서만 훅을 무력화했습니다. 다른 잡·다른 브랜치에는 영향 없습니다.

MR !372, bigData/dev 대상. 리뷰 부탁드립니다. 실제 검증은 다음 bigData 승격 때 태그가 정상 push되는지로 확인해야 합니다.
