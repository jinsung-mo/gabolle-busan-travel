/*
  flow.js — 데이터 흐름도를 그린다

  🔴 라이브러리를 하나도 안 받는다. 이 페이지는 인터넷이 죽은 날에도 떠야 하고,
     그 규칙을 여기서 깨면 페이지 전체의 존재 이유가 없어진다. 입체로 보이는 것은
     WebGL 이 아니라 **평면 캔버스에 좌표를 직접 찍은 것**이다 (3절).

  이 파일이 아는 것은 `graph.json` 하나뿐이다. 어떤 칸이 있고 무엇이 무엇으로
  흐르는지는 전부 거기서 온다 — 이 파일에는 우리 프로젝트 이야기가 한 줄도 없다.
  파트가 늘어도 여기는 안 고친다. 그게 이 구조의 요점이다.

  쓰는 법:
      GabolleFlow.mount(붙일자리, graph);
*/
(function () {
  'use strict';

  // ───────────────────────────────────────────────────────────────────────────
  // 1. 색 — 파트마다 하나, 상태마다 하나
  // ───────────────────────────────────────────────────────────────────────────
  // 파트 색은 "이게 누구 것인가", 상태 색은 "이어져 있나" 를 말한다. 둘이 겹치면
  // 안 되므로 **칸의 몸통은 파트 색, 테두리와 화살표는 상태 색**으로 가른다.
  var PART_COLORS = {
    bigData:            ['#12a594', '#2ec4b6'],
    backend:            ['#2f6fd0', '#6aa3f0'],
    frontend:           ['#7a5af5', '#a48bff'],
    ai:                 ['#d98207', '#e0a13c'],
    'survey-place':     ['#c2508f', '#e07ab0'],
    'survey-recommend': ['#9b4dca', '#bd7ae0'],
    infra:              ['#6b7b8c', '#93a3b4'],
    eval:               ['#1f9d55', '#46c07a'],
  };
  var FALLBACK_PART = ['#6b7b8c', '#93a3b4'];

  var STATE_COLORS = {
    ok:      ['#1f9d55', '#46c07a'],
    partial: ['#d98207', '#e0a13c'],
    broken:  ['#d64545', '#e86a6a'],
    planned: ['#9aa4b2', '#6f7987'],
    unknown: ['#9aa4b2', '#6f7987'],
  };

  var STATE_LABEL = {
    ok:      '이어짐',
    partial: '반쪽',
    broken:  '끊김',
    planned: '계획',
    unknown: '모름',
  };

  var STATE_MEANING = {
    ok:      '지금 실제로 데이터가 지나간다',
    partial: '지나가기는 하는데 일부만 지나간다',
    broken:  '여기서 멈춘다. 뒤로 아무것도 안 간다',
    planned: '만들기로 했고 아직 안 만들었다',
    unknown: '아무도 확인하지 않았다',
  };

  var KIND_LABEL = {
    external: '바깥',
    batch:    '배치',
    file:     '파일',
    db:       '데이터베이스',
    service:  '서비스',
    screen:   '화면',
    step:     '단계',
  };

  function dark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function pick(pair) { return dark() ? pair[1] : pair[0]; }
  function partColor(id) { return pick(PART_COLORS[id] || FALLBACK_PART); }
  function stateColor(s) { return pick(STATE_COLORS[s] || STATE_COLORS.unknown); }

  // 색을 섞는다 — 면마다 밝기를 달리해야 입체로 보인다
  function shade(hex, amount) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var t = amount < 0 ? 0 : 255;
    var p = Math.abs(amount);
    r = Math.round((t - r) * p + r);
    g = Math.round((t - g) * p + g);
    b = Math.round((t - b) * p + b);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function fade(hex, alpha) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. 자리 잡기 — 단계는 가로, 같은 단계 안에서는 세로
  // ───────────────────────────────────────────────────────────────────────────
  //
  // 순서를 선언한 대로 두면 화살표가 사방으로 엇갈려서 아무것도 안 보인다.
  // 그래서 **이웃의 평균 높이로 옮겨 앉히기를 몇 번 반복한다** — 서로 이어진 칸이
  // 가까이 모이고 선이 덜 꼬인다. 층으로 나눠 그리는 그림에서 흔히 쓰는 방법이고,
  // 완벽한 답을 찾는 것이 아니라 **몇 번 쓸어서 눈에 띄게 나아지면 멈춘다.**
  var SX = 190;   // 단계 사이 거리
  var SY = 58;    // 같은 단계 안에서 칸 사이 거리
  var NW = 128;   // 칸의 가로
  var ND = 34;    // 칸의 세로(깊이)
  var NH = 13;    // 칸의 두께

  function layout(graph) {
    var stageIndex = {};
    graph.stages.forEach(function (s, i) { stageIndex[s.id] = i; });

    var layers = graph.stages.map(function () { return []; });
    graph.nodes.forEach(function (n) { layers[stageIndex[n.stage]].push(n); });

    var neighbors = {};
    graph.nodes.forEach(function (n) { neighbors[n.id] = []; });
    graph.edges.forEach(function (e) {
      if (neighbors[e.from] && neighbors[e.to]) {
        neighbors[e.from].push(e.to);
        neighbors[e.to].push(e.from);
      }
    });

    var row = {};
    layers.forEach(function (layer) { layer.forEach(function (n, i) { row[n.id] = i; }); });

    for (var pass = 0; pass < 6; pass++) {
      var order = pass % 2 === 0 ? layers : layers.slice().reverse();
      order.forEach(function (layer) {
        layer.forEach(function (n) {
          var ns = neighbors[n.id];
          if (!ns.length) return;
          var sum = 0;
          for (var i = 0; i < ns.length; i++) sum += row[ns[i]];
          n._want = sum / ns.length;
        });
        layer.sort(function (a, b) {
          var av = a._want === undefined ? row[a.id] : a._want;
          var bv = b._want === undefined ? row[b.id] : b._want;
          return av - bv;
        });
        layer.forEach(function (n, i) { row[n.id] = i; });
      });
    }

    var tallest = Math.max.apply(null, layers.map(function (l) { return l.length; }));
    layers.forEach(function (layer, li) {
      var offset = (tallest - layer.length) / 2;
      layer.forEach(function (n, i) {
        n.x = li * SX;
        n.y = (i + offset) * SY;
        n.z = 0;
        delete n._want;
      });
    });

    return graph;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. 입체로 보이게 하는 계산 — 이게 전부다
  // ───────────────────────────────────────────────────────────────────────────
  //
  // 3차원 좌표 (x, y, z) 를 평면 위의 점 하나로 옮긴다. 원근(멀수록 작아지는 것)은
  // 안 쓴다 — 안 쓰면 **같은 크기의 칸이 어디 있든 같은 크기로 보여서** 비교가 된다.
  // 설계도를 그릴 때 쓰는 방식이고, 여기서도 그게 맞다. 보여주려는 것이 풍경이
  // 아니라 구조라서 그렇다.
  //
  //   1) yaw 만큼 수평으로 돌린다  (마우스로 끌면 이 각이 바뀐다)
  //   2) 세로를 TILT 배로 눌러 납작하게 만든다  (위에서 비스듬히 내려다보는 효과)
  //   3) 높이 z 는 그냥 위로 올린다
  //
  // 어느 것을 먼저 그릴지는 **뒤에 있는 것부터**다. 돌린 뒤의 세로값이 곧 깊이라
  // 그것으로 줄을 세우면 앞의 칸이 뒤의 칸을 자연스럽게 가린다.
  var TILT = 0.52;

  function Camera() {
    this.yaw = 0.34;
    this.scale = 1;
    this.ox = 0;
    this.oy = 0;
  }
  Camera.prototype.project = function (x, y, z) {
    var c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    var rx = x * c - y * s;
    var ry = x * s + y * c;
    return {
      x: rx * this.scale + this.ox,
      y: ry * this.scale * TILT - z * this.scale + this.oy,
      depth: ry,
    };
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4. 어디가 어디로 이어지나 — 길 따라가기
  // ───────────────────────────────────────────────────────────────────────────
  // 칸 하나를 고르면 "여기서 흘러 나가는 끝까지" 와 "여기로 흘러 들어온 처음까지"
  // 를 모두 밝힌다. 진입점을 고르면 앞의 것만 있으므로 자연히 아래로만 뻗는다.
  function reachable(graph, startId) {
    var out = {}, into = {};
    graph.nodes.forEach(function (n) { out[n.id] = []; into[n.id] = []; });
    graph.edges.forEach(function (e) {
      if (out[e.from]) out[e.from].push(e);
      if (into[e.to]) into[e.to].push(e);
    });

    var nodes = {}, edges = {};
    function walk(id, map, next) {
      if (nodes[id] && map[id]) return;
      map[id] = true;
      nodes[id] = true;
      (next[id] || []).forEach(function (e) {
        edges[e.from + '|' + e.to] = true;
        walk(e.from === id ? e.to : e.from, map, next);
      });
    }
    walk(startId, {}, out);
    walk(startId, {}, into);
    return { nodes: nodes, edges: edges };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. 그리기
  // ───────────────────────────────────────────────────────────────────────────
  function mount(host, graph) {
    layout(graph);

    var byId = {};
    graph.nodes.forEach(function (n) { byId[n.id] = n; });
    graph.edges.forEach(function (e) { e.a = byId[e.from]; e.b = byId[e.to]; });
    graph.edges = graph.edges.filter(function (e) { return e.a && e.b; });

    var partName = {};
    graph.parts.forEach(function (p) { partName[p.id] = p.label; });
    var stageName = {};
    graph.stages.forEach(function (s) { stageName[s.id] = s.label; });

    // ── 판 짜기 ──
    host.innerHTML = '';
    var wrap = el('div', 'flow-wrap');

    var chips = el('div', 'flow-chips');
    wrap.appendChild(chips);

    // 단계 설명은 목록으로 적는다. 화면 위에 5칸으로 나눠 적으면 그림의 칸과
    // 맞는 것처럼 보이는데, 그림은 돌아가 있어서 실제로는 안 맞는다.
    // 이름 자체는 그림 안에 같이 찍힌다 (draw 참고).
    var stageRow = el('div', 'flow-stages');
    stageRow.innerHTML = graph.stages.map(function (s, i) {
      return '<span class="flow-stagekey"><b>' + esc(s.label) + '</b> ' + esc(s.hint) + '</span>';
    }).join('<span class="flow-arrow">→</span>');
    wrap.appendChild(stageRow);

    var stage = el('div', 'flow-stage-box');
    var canvas = document.createElement('canvas');
    canvas.className = 'flow-canvas';
    stage.appendChild(canvas);
    var tip = el('div', 'flow-tip');
    tip.hidden = true;
    stage.appendChild(tip);
    var hint = el('div', 'flow-hint');
    hint.textContent = '끌어서 돌리기 · 휠로 확대 · 칸을 누르면 그 길만';
    stage.appendChild(hint);
    wrap.appendChild(stage);

    var legend = el('div', 'flow-legend');
    ['ok', 'partial', 'broken', 'planned'].forEach(function (s) {
      var d = el('span', 'flow-key');
      d.innerHTML = '<i style="background:' + stateColor(s) + '"></i>' +
        '<b>' + STATE_LABEL[s] + '</b> ' + esc(STATE_MEANING[s]);
      legend.appendChild(d);
    });
    wrap.appendChild(legend);

    var panel = el('div', 'flow-panel');
    panel.hidden = true;
    wrap.appendChild(panel);

    var breaks = el('div', 'flow-breaks');
    wrap.appendChild(breaks);

    host.appendChild(wrap);

    // ── 진입점 칩 ──
    // "각 진입점마다 데이터가 어디로 가나" 에 답하는 자리다. 누르면 그 하나에서
    // 뻗어 나가는 길만 남고 나머지는 흐려진다.
    var focus = null;      // {nodes:{}, edges:{}} 또는 null
    var focusId = null;

    var allChip = el('button', 'flow-chip on');
    allChip.textContent = '전체';
    allChip.onclick = function () { setFocus(null); };
    chips.appendChild(allChip);

    var brokenChip = el('button', 'flow-chip');
    brokenChip.textContent = '끊긴 곳만';
    brokenChip.onclick = function () { setBrokenOnly(!brokenOnly); };
    chips.appendChild(brokenChip);

    var sep = el('span', 'flow-chip-sep');
    sep.textContent = '진입점';
    chips.appendChild(sep);

    var entryChips = [];
    graph.nodes.filter(function (n) { return n.stage === 'source'; }).forEach(function (n) {
      var b = el('button', 'flow-chip');
      b.textContent = n.label;
      b.style.borderColor = fade(partColor(n.part), 0.55);
      b.onclick = function () { setFocus(focusId === n.id ? null : n.id); };
      b._nodeId = n.id;
      entryChips.push(b);
      chips.appendChild(b);
    });

    var brokenOnly = false;
    function setBrokenOnly(v) {
      brokenOnly = v;
      brokenChip.className = 'flow-chip' + (v ? ' on' : '');
      start();
    }
    function setFocus(id) {
      focusId = id;
      focus = id ? reachable(graph, id) : null;
      allChip.className = 'flow-chip' + (id ? '' : ' on');
      entryChips.forEach(function (b) {
        b.className = 'flow-chip' + (b._nodeId === id ? ' on' : '');
      });
      showPanel(id ? byId[id] : null);
      start();          // 멈춰 있어도 바뀐 모습을 한 장 그린다
    }

    // ── 고른 칸 설명 ──
    function showPanel(n) {
      if (!n) { panel.hidden = true; return; }
      panel.hidden = false;
      var ins = graph.edges.filter(function (e) { return e.to === n.id; });
      var outs = graph.edges.filter(function (e) { return e.from === n.id; });
      panel.innerHTML =
        '<div class="flow-panel-head">' +
          '<span class="flow-dot" style="background:' + partColor(n.part) + '"></span>' +
          '<b>' + esc(n.label) + '</b>' +
          '<span class="flow-tag">' + esc(partName[n.part] || n.part) + '</span>' +
          '<span class="flow-tag">' + esc(stageName[n.stage] || n.stage) + '</span>' +
          '<span class="flow-tag">' + esc(KIND_LABEL[n.kind] || n.kind) + '</span>' +
          badge(n) +
        '</div>' +
        (n.why ? '<p class="flow-why">' + esc(n.why) + '</p>' : '') +
        (n.note ? '<p class="flow-note">' + esc(n.note) + '</p>' : '') +
        evidenceLine(n) +
        '<div class="flow-io">' +
          '<div><h4>들어오는 것</h4>' + ioList(ins, 'from') + '</div>' +
          '<div><h4>나가는 것</h4>' + ioList(outs, 'to') + '</div>' +
        '</div>';
    }
    function ioList(list, side) {
      if (!list.length) return '<p class="flow-none">없다</p>';
      return '<ul>' + list.map(function (e) {
        var other = byId[e[side]];
        return '<li><i style="background:' + stateColor(e.state) + '"></i>' +
          '<span>' + esc(other ? other.label : e[side]) + '</span>' +
          (e.label ? '<em>' + esc(e.label) + '</em>' : '') +
          (e.state !== 'ok' ? '<b>' + STATE_LABEL[e.state] + '</b>' : '') +
          '</li>';
      }).join('') + '</ul>';
    }
    function badge(x) {
      var by = x.by === 'measured' ? '잼' : (x.by === 'stated' ? '적음' : '근거 없음');
      return '<span class="flow-state" style="color:' + stateColor(x.state) + ';border-color:' +
        fade(stateColor(x.state), 0.5) + '">' + STATE_LABEL[x.state] + ' · ' + by + '</span>';
    }
    function evidenceLine(x) {
      if (!x.evidence) return '';
      var what = x.by === 'measured'
        ? (x.state === 'broken' ? '없는 것을 확인한 파일' : '있는 것을 확인한 파일')
        : '근거';
      return '<p class="flow-ev">' + esc(what) + ' · <code>' + esc(x.evidence) + '</code></p>';
    }

    // ── 끊긴 곳 목록 ──
    // 🔴 그림이 안 떠도 이건 보여야 한다. 사람이 알고 싶은 것은 그림이 아니라
    //    "어디가 끊겼나" 이고, 그 답은 글자로도 읽을 수 있어야 한다.
    (function renderBreaks() {
      var bad = [];
      graph.nodes.forEach(function (n) {
        if (n.state === 'broken' || n.state === 'partial') bad.push({ x: n, name: n.label, node: true });
      });
      graph.edges.forEach(function (e) {
        if (e.state === 'broken' || e.state === 'partial') {
          bad.push({ x: e, name: (e.a ? e.a.label : e.from) + ' → ' + (e.b ? e.b.label : e.to) });
        }
      });
      bad.sort(function (a, b) {
        var w = { broken: 0, partial: 1 };
        return w[a.x.state] - w[b.x.state];
      });
      if (!bad.length) {
        breaks.innerHTML = '<h3>끊긴 곳</h3><p class="flow-none">없다.</p>';
        return;
      }
      breaks.innerHTML = '<h3>끊기거나 반쪽인 곳 ' + bad.length + '</h3>' +
        '<ul class="flow-breaklist">' + bad.map(function (b) {
          return '<li class="flow-break ' + b.x.state + '">' +
            '<span class="flow-break-state" style="color:' + stateColor(b.x.state) + '">' +
              STATE_LABEL[b.x.state] + '</span>' +
            '<span class="flow-break-name"' + (b.node ? ' data-node="' + esc(b.x.id) + '"' : '') + '>' +
              esc(b.name) + '</span>' +
            '<span class="flow-break-by">' + (b.x.by === 'measured' ? '파일로 확인' : '사람이 적음') + '</span>' +
            (b.x.why ? '<p>' + esc(b.x.why) + '</p>' : '') +
            '</li>';
        }).join('') + '</ul>';
      breaks.querySelectorAll('[data-node]').forEach(function (s) {
        s.style.cursor = 'pointer';
        s.onclick = function () {
          setFocus(s.getAttribute('data-node'));
          stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
      });
    })();

    // ── 카메라와 크기 ──
    var spanY = 0;
    graph.nodes.forEach(function (n) { if (n.y > spanY) spanY = n.y; });
    var cam = new Camera();
    var ctx = canvas.getContext('2d');
    var dpr = 1, W = 0, H = 0;

    function fit() {
      var rect = stage.getBoundingClientRect();
      W = Math.max(320, Math.round(rect.width));
      H = Math.max(360, Math.round(rect.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      reframe();
      // 캔버스 크기를 바꾸면 내용이 지워진다. 멈춰 있을 때는 아무도 다시 안
      // 그려 주므로 여기서 직접 부른다.
      if (typeof start === 'function') start();
    }

    // 전체가 화면에 들어오도록 배율과 가운데를 다시 잡는다
    function reframe() {
      cam.scale = 1; cam.ox = 0; cam.oy = 0;
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      function see(p) {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      }
      graph.nodes.forEach(function (n) {
        // 칸의 네 귀퉁이를 다 본다. 돌아가 있어서 어느 귀퉁이가 끝인지가 각도마다 다르다
        [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [-1, -1, NH], [1, 1, NH]].forEach(function (c) {
          see(cam.project(n.x + c[0] * NW / 2, n.y + c[1] * ND / 2, c[2]));
        });
      });
      // 🔴 단계 이름도 그림의 일부다. 칸만 재고 맞추면 이름이 밖으로 잘려 나간다 —
      //    실제로 "화면" 이 잘렸다. 이름이 붙는 자리까지 넣어서 잰다.
      // 이름이 붙는 **위쪽 끝만** 잰다. 구분선의 아래끝까지 넣으면 아무 글자도
      // 없는 선 때문에 그림 전체가 작아지고 위로 쏠린다. 선은 잘려도 된다.
      graph.stages.forEach(function (st, i) {
        see(cam.project(i * SX, -SY * 1.25, 0));
      });
      var pad = 30;
      var s = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxY - minY));
      cam.scale = Math.min(1.7, s);
      cam.ox = W / 2 - ((minX + maxX) / 2) * cam.scale;
      cam.oy = H / 2 - ((minY + maxY) / 2) * cam.scale;
      userScale = cam.scale;
      baseOx = cam.ox; baseOy = cam.oy;
    }
    var userScale = 1, baseOx = 0, baseOy = 0;

    // ── 칸 하나의 여섯 점 ──
    function corners(n) {
      var hw = NW / 2, hd = ND / 2;
      return {
        top: [
          cam.project(n.x - hw, n.y - hd, NH),
          cam.project(n.x + hw, n.y - hd, NH),
          cam.project(n.x + hw, n.y + hd, NH),
          cam.project(n.x - hw, n.y + hd, NH),
        ],
        bot: [
          cam.project(n.x - hw, n.y - hd, 0),
          cam.project(n.x + hw, n.y - hd, 0),
          cam.project(n.x + hw, n.y + hd, 0),
          cam.project(n.x - hw, n.y + hd, 0),
        ],
      };
    }

    function dim(id, isEdge) {
      if (brokenOnly) {
        var x = isEdge ? edgeById(id) : byId[id];
        if (x && x.state !== 'broken' && x.state !== 'partial') return true;
      }
      if (!focus) return false;
      return isEdge ? !focus.edges[id] : !focus.nodes[id];
    }
    var edgeMap = {};
    graph.edges.forEach(function (e) { edgeMap[e.from + '|' + e.to] = e; });
    function edgeById(k) { return edgeMap[k]; }

    // ── 한 장 그리기 ──
    var t0 = performance.now();
    var lastT = 0;
    function paint(t) {
      lastT = t;
      ctx.clearRect(0, 0, W, H);

      // 바닥의 단계 구분선과 이름
      //
      // 🔴 단계 이름을 화면 위쪽에 가로로 5칸 나눠 적으면 **거짓말이 된다.** 그림이
      //    비스듬히 돌아가 있어서 "원천" 칸이 화면 왼쪽 1/5 에 있지 않기 때문이다.
      //    그래서 이름을 그림과 **같은 좌표계 안에** 찍는다 — 돌리면 이름도 같이 돈다.
      ctx.lineWidth = 1;
      graph.stages.forEach(function (s, i) {
        var x = i * SX;
        var a = cam.project(x, -SY * 1.1, 0), b = cam.project(x, spanY + SY * 1.1, 0);
        ctx.strokeStyle = dark() ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

        ctx.save();
        ctx.fillStyle = dark() ? 'rgba(255,255,255,.34)' : 'rgba(0,0,0,.32)';
        ctx.font = '700 ' + Math.max(10, 12 * Math.min(1, cam.scale)) + 'px Pretendard, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(s.label, a.x, a.y - 4);
        ctx.restore();
      });

      // 화살표 먼저 — 칸이 그 위에 앉아야 선이 칸을 안 가린다
      graph.edges.forEach(function (e) {
        drawEdge(e, t, dim(e.from + '|' + e.to, true));
      });

      // 칸은 뒤에 있는 것부터
      var sorted = graph.nodes.slice().sort(function (a, b) {
        return cam.project(a.x, a.y, 0).depth - cam.project(b.x, b.y, 0).depth;
      });
      sorted.forEach(function (n) { drawNode(n, dim(n.id, false), t); });
    }

    // ── 언제 그리나 ────────────────────────────────────────────────────────────
    //
    // 🔴 **멈추는 것은 움직임뿐이고, 그림은 항상 한 장 그려져 있다.**
    //    이 둘을 안 가르면 탭을 뒤에 두고 연 사람에게는 빈 칸이 보이고, 인쇄하거나
    //    화면을 찍어도 빈 종이가 나온다. 흐르는 점이 안 움직이는 것은 괜찮지만
    //    그림 자체가 없는 것은 안 괜찮다.
    //
    // 🔴 그리고 안 보일 때는 **안 움직인다.** 이건 켜 두는 페이지다 — 탭을 띄워
    //    놓고 다른 일을 하는 동안 화면 밖의 그림이 초당 60번 다시 그려지면,
    //    가동 상태를 보려고 연 페이지가 그 PC 의 부하가 된다. 이 페이지가 재려는
    //    바로 그 숫자를 자기가 올리는 일이 된다.
    var running = false, visible = true;
    function awake() { return visible && !document.hidden; }

    function frame(now) {
      paint((now - t0) / 1000);
      if (awake()) requestAnimationFrame(frame);
      else running = false;
    }
    function start() {
      if (running) return;
      if (!awake()) { paint(lastT); return; }   // 멈춰 있어도 한 장은 그린다
      running = true;
      requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', start);
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        start();
      }, { threshold: 0 }).observe(stage);
    }

    function drawEdge(e, t, dimmed) {
      var a = e.a, b = e.b;
      var p0 = cam.project(a.x + NW / 2, a.y, NH / 2);
      var p1 = cam.project(b.x - NW / 2, b.y, NH / 2);
      // 뒤로 가는 화살표는 칸을 뚫지 않게 옆으로 크게 돌린다
      var backwards = b.x <= a.x;
      var midx = (p0.x + p1.x) / 2;
      var midy = (p0.y + p1.y) / 2 + (backwards ? -66 : (b.y - a.y) * 0.06);

      var col = stateColor(e.state);
      var alpha = dimmed ? 0.07 : (e.state === 'planned' ? 0.4 : 0.75);

      ctx.save();
      ctx.lineWidth = e.state === 'broken' ? 2 : 1.6;
      ctx.strokeStyle = fade(col, alpha);
      if (e.state === 'planned') ctx.setLineDash([3, 5]);
      if (e.state === 'broken') ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(midx, midy, p1.x, p1.y);
      ctx.stroke();
      ctx.restore();

      if (dimmed) return;

      if (e.state === 'broken') {
        // 끊긴 자리에 ✕ 를 찍는다. 색만으로는 색을 못 가리는 사람이 못 읽는다
        var m = curveAt(p0, { x: midx, y: midy }, p1, 0.5);
        ctx.save();
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x - 5, m.y - 5); ctx.lineTo(m.x + 5, m.y + 5);
        ctx.moveTo(m.x + 5, m.y - 5); ctx.lineTo(m.x - 5, m.y + 5);
        ctx.stroke();
        ctx.restore();
        return;
      }
      if (e.state === 'planned') return;

      // 흐르는 점 — 이어진 곳에만 흐른다. 반쪽이면 드물게 흐른다
      var count = e.state === 'partial' ? 1 : 2;
      var speed = e.state === 'partial' ? 0.18 : 0.34;
      for (var i = 0; i < count; i++) {
        var u = ((t * speed) + i / count) % 1;
        var q = curveAt(p0, { x: midx, y: midy }, p1, u);
        ctx.fillStyle = fade(col, 0.95);
        ctx.beginPath();
        ctx.arc(q.x, q.y, e.state === 'partial' ? 1.8 : 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function curveAt(p0, c, p1, u) {
      var v = 1 - u;
      return {
        x: v * v * p0.x + 2 * v * u * c.x + u * u * p1.x,
        y: v * v * p0.y + 2 * v * u * c.y + u * u * p1.y,
      };
    }

    function drawNode(n, dimmed, t) {
      var c = corners(n);
      var base = partColor(n.part);
      var sc = stateColor(n.state);
      var a = dimmed ? 0.12 : 1;

      // 옆면 둘 — 밝기를 달리 줘야 덩어리로 보인다
      face(c.bot.slice(1, 3).concat(c.top.slice(1, 3).reverse()), shade(base, -0.3), a);
      face([c.bot[2], c.bot[3], c.top[3], c.top[2]], shade(base, -0.48), a);
      // 윗면 — 이름을 여기에 얹으므로 글자와 대비가 나와야 한다.
      // 밝은 테마에서는 흰 쪽으로 많이 섞어 **연한 바탕에 검은 글자**로 만들고,
      // 어두운 테마에서는 그대로 둔다. 파트 색은 옆면에 진하게 남아 있어서
      // 윗면을 연하게 해도 "누구 것인가" 는 안 흐려진다.
      face(c.top, shade(base, dark() ? -0.05 : 0.62), a);

      // 상태 테두리 — 몸통 색과 겹치지 않게 윗면 둘레에만 두른다
      ctx.save();
      ctx.globalAlpha = dimmed ? 0.14 : 1;
      ctx.lineWidth = n.state === 'ok' ? 1 : 2;
      ctx.strokeStyle = n.state === 'ok' ? fade(base, 0.65) : sc;
      if (n.state === 'planned') ctx.setLineDash([3, 4]);
      ctx.beginPath();
      c.top.forEach(function (p, i) { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.closePath(); ctx.stroke();

      // 고른 칸은 위에 빛을 얹는다
      if (focusId === n.id || hoverId === n.id) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = dark() ? '#fff' : '#16181d';
        ctx.stroke();
      }
      ctx.restore();

      // 이름
      var mid = cam.project(n.x, n.y, NH);
      ctx.save();
      ctx.globalAlpha = dimmed ? 0.2 : 1;
      ctx.fillStyle = dark() ? '#f2f5f9' : '#14171c';
      ctx.font = '600 ' + Math.max(9.5, 11.5 * Math.min(1, cam.scale)) + 'px Pretendard, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var label = n.label;
      var maxw = NW * cam.scale - 14;
      while (ctx.measureText(label).width > maxw && label.length > 3) {
        label = label.slice(0, -2) + '…';
      }
      ctx.fillText(label, mid.x, mid.y);
      ctx.restore();

      // 끊기거나 반쪽인 칸에는 표를 하나 더 — 색을 못 가려도 읽히게
      if (!dimmed && (n.state === 'broken' || n.state === 'partial')) {
        var tag = cam.project(n.x + NW / 2, n.y - ND / 2, NH);
        ctx.save();
        ctx.fillStyle = sc;
        ctx.beginPath(); ctx.arc(tag.x, tag.y, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '700 9px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n.state === 'broken' ? '!' : '½', tag.x, tag.y + 0.5);
        ctx.restore();
      }
    }

    function face(pts, color, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      pts.forEach(function (p, i) { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ── 마우스 ──
    var hoverId = null;
    var dragging = false, lastX = 0, lastY = 0, moved = 0;

    function at(ev) {
      var r = canvas.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }
    function hit(pt) {
      // 앞에 있는 것부터 본다 — 겹쳤을 때 눈에 보이는 쪽이 잡혀야 한다
      var sorted = graph.nodes.slice().sort(function (a, b) {
        return cam.project(b.x, b.y, 0).depth - cam.project(a.x, a.y, 0).depth;
      });
      for (var i = 0; i < sorted.length; i++) {
        if (inside(pt, corners(sorted[i]).top)) return sorted[i];
      }
      return null;
    }
    function inside(p, poly) {
      var yes = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var a = poly[i], b = poly[j];
        if ((a.y > p.y) !== (b.y > p.y) &&
            p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) yes = !yes;
      }
      return yes;
    }

    canvas.addEventListener('pointerdown', function (ev) {
      dragging = true; moved = 0;
      lastX = ev.clientX; lastY = ev.clientY;
      canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener('pointermove', function (ev) {
      if (dragging) {
        var dx = ev.clientX - lastX, dy = ev.clientY - lastY;
        moved += Math.abs(dx) + Math.abs(dy);
        if (ev.shiftKey) {                       // 시프트를 누르면 옮긴다
          cam.ox += dx; cam.oy += dy;
          baseOx += dx; baseOy += dy;
        } else {
          cam.yaw += dx * 0.005;                 // 그냥 끌면 돌린다
          cam.oy += dy * 0.5; baseOy += dy * 0.5;
        }
        lastX = ev.clientX; lastY = ev.clientY;
        tip.hidden = true;
        start();
        return;
      }
      var pt = at(ev);
      var n = hit(pt);
      hoverId = n ? n.id : null;
      canvas.style.cursor = n ? 'pointer' : 'grab';
      if (n) {
        tip.hidden = false;
        tip.innerHTML = '<b>' + esc(n.label) + '</b>' +
          '<span style="color:' + stateColor(n.state) + '">' + STATE_LABEL[n.state] + '</span>' +
          '<em>' + esc(partName[n.part] || n.part) + '</em>';
        var tw = tip.offsetWidth, th = tip.offsetHeight;
        tip.style.left = Math.min(W - tw - 8, Math.max(8, pt.x - tw / 2)) + 'px';
        tip.style.top = Math.max(8, pt.y - th - 14) + 'px';
      } else {
        tip.hidden = true;
      }
    });
    canvas.addEventListener('pointerup', function (ev) {
      dragging = false;
      if (moved < 5) {
        var n = hit(at(ev));
        setFocus(n ? (focusId === n.id ? null : n.id) : null);
      }
    });
    canvas.addEventListener('pointerleave', function () { tip.hidden = true; hoverId = null; });
    canvas.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var k = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
      var pt = at(ev);
      cam.ox = pt.x - (pt.x - cam.ox) * k;
      cam.oy = pt.y - (pt.y - cam.oy) * k;
      baseOx = cam.ox; baseOy = cam.oy;
      cam.scale *= k;
      userScale = cam.scale;
      start();
    }, { passive: false });
    canvas.addEventListener('dblclick', function () { cam.yaw = 0.34; reframe(); start(); });

    window.addEventListener('resize', fit);
    fit();
    start();

    return { reframe: reframe, setFocus: setFocus };
  }

  // ── 자잘한 것 ──
  function el(tag, cls) { var d = document.createElement(tag); d.className = cls; return d; }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.GabolleFlow = { mount: mount };
})();
