#!/usr/bin/env node
/**
 * 가동 상태 페이지의 **추세 곡선**이 약속을 지키는지 확인한다.
 *
 *     node ci/status/check-uptime.mjs        # 0 이면 통과
 *
 * 🔴 **왜 눈으로 보는 것으로 안 되나.** 이 그림을 만들면서 실제로 두 번 속았다.
 *    한 번은 튄 칸 하나가 나머지를 바닥에 눌러 평평하게 만든 것을 기계가 통과시켰고
 *    (눈이 잡았다), 한 번은 좌표 두 개가 붙어 버려(…,56 + 131.0 → 56131.0) 면이
 *    화면 밖으로 나간 것을 눈이 "색이 안 나오네" 로만 읽었다 (기계가 잡았다).
 *    **둘 다 있어야 했다.** 오류 메시지는 어느 쪽에서도 안 났다.
 *
 * 🔴 이 검사는 **사본이 아니라 uptime.html 에서 코드를 꺼내 돌린다.** 사본을 검사하면
 *    페이지만 고친 날 검사가 계속 초록으로 거짓말한다.
 *
 * 여기 쓰는 자료는 **표본**이다. 서버의 진짜 값이 아니라, 그리기 어려운 모양
 * (못 잰 구간 · 멈췄던 칸 · 앞뒤가 끊긴 칸 하나 · 완벽했던 기간)을 일부러 모은 것이다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] || path.join(here, "uptime.html");
const page = fs.readFileSync(target, "utf8");
const from = page.indexOf("  const SHOW_SLOTS = 42;");
const to = page.indexOf("  // ── MR 검사 속도 줄에 붙는 자세한 값");
if (from < 0 || to < 0 || to < from) { console.error("페이지에서 추세 곡선 코드를 못 찾았습니다"); process.exit(2); }
const src = page.slice(from, to);

let slotHours = 4;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const nf = (v, d = 1) => (v == null || !isFinite(v) ? null : Number(v).toFixed(d).replace(/\.0+$/, ""));
const { trendHtml, cpuTrendHtml, spanPickHtml, useFine, useSpan } = new Function("esc", "nf",
  src + "\nreturn { trendHtml, cpuTrendHtml, spanPickHtml, useFine: (f, m) => { fine = f; if (m) fineMinutes = m; }, useSpan: (s) => { span = s; } };")(esc, nf);

const slot = (i, o = {}) => ({ t: `2026-09-${String(8 + Math.floor(i/6)).padStart(2,"0")}T${String((i%6)*4).padStart(2,"0")}`, state:"ok", up:100, n:60, avgMs:120, ...o });

let bad = 0;
const ok = (name, cond, extra = "") => { console.log((cond ? "  통과  " : "  실패  ") + name + (cond ? "" : "  ← " + extra)); if (!cond) bad++; };

// ── 가운데가 뚫린 7일 ──
const holed = Array.from({length:42}, (_,i) =>
  (i >= 12 && i <= 15) ? slot(i,{ state:"none", up:null, avgMs:null })     // 못 잰 4칸
  : i === 20 ? slot(i,{ state:"down", up:72, avgMs:900 })                  // 멈췄던 칸
  : slot(i,{ avgMs: 100 + i * 6 }));
const svg = trendHtml({ id:"frontend-app", kind:"deploy", slots: holed });

ok("못 잰 칸을 회색으로 덮는다", (svg.match(/class="gap"/g)||[]).length === 1);
ok("선이 두 토막으로 끊긴다", (svg.match(/class="ln-ms"/g)||[]).length === 2,
   `실제 ${(svg.match(/class="ln-ms"/g)||[]).length} 토막`);
ok("점 사이를 휘게 하지 않는다 (곡선 명령 없음)",
   !/ d="[^"]*[CQSTAcqsta]/.test(svg.replace(/class="[^"]*"/g,"")));
ok("멈췄던 칸이 아래로 파인다", /class="ln-fail"/.test(svg));
ok("칸마다 값을 말한다", (svg.match(/<title>/g)||[]).length === 42);

// ── 앞뒤가 끊긴 칸 하나 ──
const lonely = Array.from({length:42}, (_,i) =>
  i === 21 ? slot(i) : (i < 10 ? slot(i) : slot(i,{ state:"none", up:null, avgMs:null })));
const svg2 = trendHtml({ id:"backend-app", kind:"deploy", slots: lonely });
ok("외톨이 칸은 점으로 남는다", /class="dot-ms"/.test(svg2));

// ── 한 번도 안 틀린 7일 ──
const clean = Array.from({length:42}, (_,i) => slot(i,{ avgMs: 110 + (i%5)*4 }));
const svg3 = trendHtml({ id:"frontend-app", kind:"deploy", slots: clean });
ok("완벽했던 기간은 아래가 평평하다", !/class="ln-fail"/.test(svg3) && /한 번도 안 틀렸/.test(svg3));

// ── 그릴 게 없을 때 ──
ok("점 하나로는 안 그린다", trendHtml({ id:"x", kind:"deploy", slots:[slot(0), slot(1,{state:"none",up:null,avgMs:null})] }) === "");
ok("MR 줄은 없다고 적는다", /추세 곡선이 없습니다/.test(trendHtml({ id:"frontend-ci", kind:"mr", slots: clean })));

// ── 그라디언트 이름이 줄마다 달라야 한다 (같으면 색이 서로 덮인다) ──
ok("서비스마다 그라디언트 이름이 다르다",
   svg.match(/id="g-ms-([^"]+)"/)[1] !== svg2.match(/id="g-ms-([^"]+)"/)[1]);


// ── 튄 칸 하나가 나머지를 짓뭉개지 않는가 ──
// 평소 100~300ms 인데 한 칸만 1840ms 인 자료. 평소 구간이 바닥에 눌리면 실패다.
const spiky = trendHtml({ id:"frontend-app", kind:"deploy", slots: holed });
const ys = [...spiky.matchAll(/class="ln-ms" d="([^"]+)"/g)]
  .flatMap((m) => [...m[1].matchAll(/[ML][\d.]+,([\d.]+)/g)].map((n) => Number(n[1])));
const ZERO = 56;
const normal = ys.filter((y) => y > 8);            // 꼭대기에 눌린 칸은 뺀다
const deepest = Math.min(...normal);               // 위로 가장 높이 간 평소 값
let bad2 = 0;
const ok2 = (name, cond, extra="") => { console.log((cond?"  통과  ":"  실패  ")+name+(cond?"":"  ← "+extra)); if(!cond) bad2++; };
ok2("평소 구간이 바닥에 눌리지 않는다", ZERO - deepest > (ZERO - 4) * 0.35,
    `평소 꼭대기가 높이의 ${Math.round((ZERO-deepest)/(ZERO-4)*100)}% 에 그침`);
ok2("눌러 담은 칸에 표를 찍는다", /class="over"/.test(spiky));
ok2("눌렀다고 글씨로 밝힌다", /눌러 담고/.test(spiky));
if (bad2) { console.log(`\n${bad2}개 실패`); process.exit(1); }

// ── 틀린 게 없는 구간에 빨간 줄을 깔지 않는가 ──
// 0 도 값이라 그냥 이으면 바닥에 빨간 줄이 길게 깔린다. 파인 곳 둘레만 남아야 한다.
const failPts = [...spiky.matchAll(/class="ln-fail" d="([^"]+)"/g)]
  .flatMap((m) => [...m[1].matchAll(/[ML][\d.]+,[\d.]+/g)]).length;
ok2("파인 곳 둘레만 빨갛게 긋는다", failPts > 0 && failPts <= 5, `빨간 선의 점이 ${failPts}개`);

// ── 색을 속성에 넣지 않았는가 ──
// SVG 의 stop-color 는 표현 속성이라 var(...) 를 조용히 무시한다. 면이 안 칠해지는데
// 아무 오류도 안 난다 — 눈으로만 보면 놓치기 딱 좋은 종류다.
ok2("색을 style 로 준다 (속성에 var 를 넣으면 조용히 안 칠해진다)",
    !spiky.includes('stop-color="var(') && spiky.includes('style="stop-color: var('));

// ── 좌표가 성한가 ──
// 두 수가 붙어 버리면(…,56 + 131.0 → 56131.0) 선이 화면 밖으로 나가는데 오류는
// 하나도 안 난다. 눈으로는 그냥 "색이 안 나오네" 로 보인다 — 실제로 그렇게 놓쳤다.
const dAll = [...spiky.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
const shaped = /^M-?[\d.]+,-?[\d.]+(L-?[\d.]+,-?[\d.]+)*Z?$/;
ok2("선과 면의 좌표가 성하다", dAll.length > 0 && dAll.every((d) => shaped.test(d)),
    (dAll.find((d) => !shaped.test(d)) || "").slice(0, 48));

// ── CPU 곡선 ──
// 서비스 줄과 **같은 그리기 코드**를 쓴다. 한쪽만 고쳐도 안 깨지는지 여기서 다시 본다.
const cpuSlot = (i, o = {}) => ({
  t: `2026-09-${String(8 + Math.floor(i / 6)).padStart(2, "0")}T${String((i % 6) * 4).padStart(2, "0")}`,
  state: "ok", n: 240, avg: 0.35, max: 0.6, ...o,
});
// 일부러 **한가한** 기간을 쓴다 — 눈금을 최고값에 맞추면 1.0 줄이 화면 밖으로 나간다.
const quiet = Array.from({ length: 42 }, (_, i) =>
  (i < 4 ? cpuSlot(i, { state: "none", avg: null, max: null, n: 0 })
         : cpuSlot(i, { avg: 0.3 + (i % 5) * 0.03, max: 0.5 + (i % 7) * 0.04 })));
const cpuSvg = cpuTrendHtml({ slots: quiet });

ok2("CPU 곡선도 못 잰 칸을 회색으로 덮는다", /class="gap"/.test(cpuSvg));
ok2("🔴 한가한 기간에도 1.0 줄이 화면 안에 있다", /class="ref"/.test(cpuSvg),
    "눈금이 최고값에 붙으면 1.0 이 화면 밖으로 나가 지금 값이 뜻을 잃는다");
ok2("평균은 면으로만, 최고는 선으로 그린다 (선이 둘이면 어느 게 최고인지 흐려진다)",
    /class="area"/.test(cpuSvg) && /class="ln-peak"/.test(cpuSvg) && !/class="ln-cpuavg"/.test(cpuSvg));
ok2("아래로 파이는 칸이 없으면 그림이 그만큼 낮다", /class="trend up-only"/.test(cpuSvg));
ok2("CPU 칸도 값을 말한다", (cpuSvg.match(/<title>/g) || []).length === 42);
ok2("CPU 도 점 사이를 휘게 하지 않는다",
    !/ d="[^"]*[CQSTAcqsta]/.test(cpuSvg.replace(/class="[^"]*"/g, "")));
ok2("안 쌓였으면 안 그린다 (빈 선을 그리지 않는다)", cpuTrendHtml({ slots: [] }) === "");

// 치솟은 칸이 있으면 눌러 담고 표를 찍는다 — 서비스 줄과 같은 약속이다.
const spike = quiet.map((d, i) => (i === 30 ? { ...d, avg: 2.2, max: 6.4 } : d));
const cpuSpiky = cpuTrendHtml({ slots: spike });
ok2("CPU 도 튄 칸을 눌러 담고 표를 찍는다", /class="over"/.test(cpuSpiky) && /눌러 담고/.test(cpuSpiky));

// ── 층이 둘 — 하루와 7일 ──
//
// 🔴 가장 위험한 실수는 **고운 파일이 없는데 "하루" 라고 적는 것**이다. 서버에
//    새 수집기가 아직 안 올라간 동안이 그렇다. 그때 7일 곡선을 그려 놓고 글씨만
//    "최근 24시간" 이라고 적으면, 보는 사람이 **7일치 사고를 오늘 일로 읽는다.**
//    오류는 하나도 안 난다.
const fineSvc = (id, n = 288) => ({
  id,
  slots: Array.from({ length: n }, (_, i) => ({
    t: `2026-09-14T${String(Math.floor(i / 12)).padStart(2, "0")}:${String((i % 12) * 5).padStart(2, "0")}`,
    state: "ok", up: 100, n: 5, avgMs: 120 + Math.round(Math.sin(i / 17) * 45),
  })),
});
const fineFile = {
  fineMinutes: 5,
  services: [fineSvc("frontend-app"), fineSvc("backend-app")],
  cpu: { slots: fineSvc("cpu").slots.map((s) => ({ t: s.t, state: "ok", n: 5, avg: 0.4, max: 0.7 })) },
};

// 고운 파일이 없을 때 — "하루" 를 골라 놔도 7일이 그려지고, 글씨도 7일이라고 쓴다
useFine(null); useSpan("day");
const noFine = trendHtml({ id: "frontend-app", kind: "deploy", slots: holed });
ok2("🔴 고운 파일이 없으면 글씨도 '7일' 이라고 쓴다 (고른 것이 아니라 그린 것을 적는다)",
    /최근 <b>7일<\/b>/.test(noFine) && !/24시간/.test(noFine));
ok2("고운 파일이 없으면 단추를 안 보여준다", spanPickHtml() === "");

// 고운 파일이 있을 때
useFine(fineFile, 5);
const dayS = trendHtml({ id: "frontend-app", kind: "deploy", slots: holed });
ok2("하루를 고르면 글씨가 '24시간' 이다", /최근 <b>24시간<\/b>/.test(dayS));
ok2("하루 곡선은 288칸을 그린다", (dayS.match(/<title>/g) || []).length === 288);
ok2("고운 칸은 분까지 말한다", /\d\d:\d\d–\d\d:\d\d/.test(dayS));
ok2("단추가 생기고 '하루' 가 눌려 있다",
    /data-span="day" aria-pressed="true"/.test(spanPickHtml()) && /곡선 기간/.test(spanPickHtml()));

useSpan("week");
const weekS = trendHtml({ id: "frontend-app", kind: "deploy", slots: holed });
// 🔴 곡선이 하루인데 바로 아래 막대는 7일이다. 회색 구간이 서로 다른 자리에
//    생기므로 곡선에 **제 눈금 글씨**가 있어야 어긋난 것으로 안 읽힌다.
ok2("기간이 다르면 곡선에 제 눈금 글씨가 붙는다", /24시간 전/.test(dayS));
ok2("눈금 글씨 둘이 서로 붙지 않는다 (밀어 줄 칸이 있다)",
    dayS.includes('class="right"') && !dayS.includes('24시간 전</span><span>지금'));
ok2("7일을 고르면 굵은 칸 42개로 돌아간다",
    (weekS.match(/<title>/g) || []).length === 42 && /최근 <b>7일<\/b>/.test(weekS));

// 고운 층이 없는 줄(MR 처럼)은 하루를 골라도 굵은 것으로 그린다 — 지어내지 않는다
useSpan("day");
const noSlotSvc = trendHtml({ id: "없는줄", kind: "deploy", slots: holed });
ok2("고운 층에 없는 줄은 하루를 골라도 7일로 그린다",
    (noSlotSvc.match(/<title>/g) || []).length === 42 && /최근 <b>7일<\/b>/.test(noSlotSvc));

// CPU 도 같이 따라간다
const cpuDay = cpuTrendHtml({ slots: quiet });
ok2("CPU 도 하루로 따라간다", (cpuDay.match(/<title>/g) || []).length === 288);

useFine(null); useSpan("day");   // 뒤 검사에 영향 안 가게 되돌린다

const total = bad + bad2;
console.log(total ? `\n${total}개 실패` : "\n전부 통과");
process.exit(total ? 1 : 0);
