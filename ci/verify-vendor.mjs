#!/usr/bin/env node
/**
 * `ci/axmap/` 의 사본이 **손으로 바뀌지 않았는지** 본다.
 *
 * 사본(**벤더링** vendoring — 남의 저장소 코드를 우리 저장소 안에 복사해 두고 그
 * 사본으로 돌리는 것)은 편집할 수 있는 자리에 놓인다. 편하니까 급할 때 여기서
 * 바로 고치게 되고, 그러면 다음 복사에서 **말없이 덮여 사라진다.** 고친 사람은
 * 자기 수정이 사라진 것을 몇 주 뒤 버그로 다시 만난다.
 *
 *   node ci/verify-vendor.mjs
 *
 * 종료 코드: 0 일치 · 1 그 밖 전부
 *
 * 🔴 **1 은 "불일치" 와 "판정 불가" 를 함께 쓴다.** manifest 가 없거나 읽히지
 *    않으면 통과가 아니라 실패다. 못 재는 것을 통과로 세면, 검사기를 무력화하는
 *    가장 쉬운 방법이 "검사 대상을 지우는 것" 이 된다.
 *
 * ── 이 검사기가 막을 수 있는 것 ─────────────────────────────────────────────
 *
 *   · 사본의 파일을 열어서 한 줄 고친 것
 *   · 사본에 파일을 몰래 하나 더 넣은 것 (목록에 없는 파일)
 *   · 사본에서 파일을 지운 것
 *
 * ── 이 검사기가 막을 수 **없는** 것 ─────────────────────────────────────────
 *
 * 🔴 **사본을 고치고 `manifest.sha256` 까지 다시 만들면 이 검사는 통과한다.**
 *    해시 목록이 사본 옆에 같이 있는 한 그건 원리적으로 막을 수 없다 —
 *    검사 대상과 정답이 같은 사람 손에 있기 때문이다.
 *
 *    그래서 이것은 **강제 장치가 아니라 부인 불가능성**(non-repudiation —
 *    "나는 그런 적 없다" 고 말할 수 없게 만드는 성질) **장치다.**
 *    `axmap/governance/GOVERNANCE.md` 가 합의 층을 두고 하는 말과 같다.
 *
 *    통과시키려면 `manifest.sha256` 을 반드시 함께 바꿔야 하고, 그 변경은 MR 의
 *    diff 에 뜬다. 리뷰어는 거기서 **"SOURCE.json 의 업스트림 커밋은 그대로인데
 *    사본과 해시만 바뀌었다"** 를 본다. 그건 정상적인 벤더링에서는 나올 수 없는
 *    모양이다 — 진짜로 다시 떠 왔다면 커밋 sha 도 같이 바뀐다.
 *
 *    막는 것이 아니라 **숨길 수 없게** 만드는 것이 이 파일의 일이다.
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/**
 * 🔴 이 파일은 사본 **밖**에 있다. 자기 자신을 검사하는 검사기는 검사기가 아니다 —
 *    사본 안에 있으면 사본을 갈아치우는 사람이 검사기도 같이 갈아치울 수 있다.
 */
const VENDOR = path.join(HERE, 'axmap')
const MANIFEST = path.join(VENDOR, 'manifest.sha256')

/** 자기 해시를 자기 안에 적을 수는 없으므로 manifest 만 대조에서 뺀다. */
const MANIFEST_NAME = 'manifest.sha256'

const HOW_TO_FIX = [
  '',
  '고치는 법 — 사본을 직접 고치지 마세요.',
  '  1. axMap 저장소에서 고치고 커밋합니다',
  '  2. 거기서  node tools/vendor.mjs --to <이 저장소의 루트>  를 다시 돌립니다',
  '  3. 여기 생긴 변경을 MR 로 올립니다',
  '',
  '  왜: 여기서 고친 것은 다음 복사에서 말없이 덮여 사라집니다.',
  '      사라진 수정은 몇 주 뒤에 버그로 돌아옵니다.',
  `  자세히: ${path.posix.join('ci', 'axmap', 'README.md')}`,
].join('\n')

function fail(lines) {
  for (const l of [].concat(lines)) console.error(l)
  console.error(HOW_TO_FIX)
  process.exit(1)
}

// ── 잴 수 있는 상태인가 ───────────────────────────────────────────────────

if (!fs.existsSync(VENDOR) || !fs.statSync(VENDOR).isDirectory()) {
  fail([`사본 폴더가 없습니다: ${VENDOR}`, '  잴 것이 없는 것을 통과로 세지 않습니다.'])
}
if (!fs.existsSync(MANIFEST)) {
  fail([
    `해시 목록이 없습니다: ${MANIFEST}`,
    '  이것이 없으면 사본이 맞는지 판정할 수 없습니다. 판정 불가는 통과가 아닙니다.',
  ])
}

// ── manifest 읽기 ─────────────────────────────────────────────────────────

/** @type {Map<string, string>} 상대 경로 → 기대 해시 */
const expected = new Map()
const badLines = []

const rawManifest = fs.readFileSync(MANIFEST, 'utf8')
rawManifest.split(/\r?\n/).forEach((line, i) => {
  if (line.trim() === '' || line.startsWith('#')) return
  // `sha256sum` 과 같은 모양: 해시, 공백 두 칸, 경로. 경로에 공백이 있어도 살아남는다.
  const m = /^([0-9a-f]{64}) {2}(.+)$/.exec(line)
  if (!m) {
    badLines.push(`  ${i + 1}행: ${line}`)
    return
  }
  const [, hash, rel] = m
  // 🔴 목록이 사본 밖을 가리키면 잴 대상이 무엇인지부터 모르는 것이다.
  if (rel.startsWith('/') || rel.includes('\\') || rel.split('/').includes('..')) {
    badLines.push(`  ${i + 1}행: 사본 밖을 가리킵니다 — ${rel}`)
    return
  }
  if (expected.has(rel)) {
    badLines.push(`  ${i + 1}행: 같은 경로가 두 번 나옵니다 — ${rel}`)
    return
  }
  expected.set(rel, hash)
})

if (badLines.length > 0) {
  fail([`해시 목록을 읽을 수 없습니다: ${MANIFEST}`, ...badLines, '', '  판정 불가는 통과가 아닙니다.'])
}
if (expected.size === 0) {
  fail([`해시 목록이 비어 있습니다: ${MANIFEST}`, '  잴 것이 없는 것을 통과로 세지 않습니다.'])
}

// ── 실제 파일 ─────────────────────────────────────────────────────────────

function walk(root, rel = '') {
  const dir = rel ? path.join(root, ...rel.split('/')) : root
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const child = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) out.push(...walk(root, child))
    else out.push(child)
  }
  return out
}

const actual = walk(VENDOR).filter((rel) => rel !== MANIFEST_NAME).sort()

// ── 대조 ──────────────────────────────────────────────────────────────────

const mismatched = [] // 목록에도 있고 파일도 있는데 내용이 다르다
const unlisted = [] // 파일은 있는데 목록에 없다
const gone = [] // 목록에는 있는데 파일이 없다

for (const rel of actual) {
  if (!expected.has(rel)) {
    unlisted.push(rel)
    continue
  }
  const buf = fs.readFileSync(path.join(VENDOR, ...rel.split('/')))
  const got = crypto.createHash('sha256').update(buf).digest('hex')
  if (got !== expected.get(rel)) mismatched.push({ rel, want: expected.get(rel), got })
}

const actualSet = new Set(actual)
for (const rel of expected.keys()) {
  if (!actualSet.has(rel)) gone.push(rel)
}

// ── 보고 ──────────────────────────────────────────────────────────────────

if (mismatched.length === 0 && unlisted.length === 0 && gone.length === 0) {
  console.log(`사본이 해시 목록과 일치합니다: ${path.posix.join('ci', 'axmap')}`)
  for (const rel of actual) console.log(`  ok  ${rel}`)
  process.exit(0)
}

const lines = [`사본이 해시 목록과 다릅니다: ${VENDOR}`, '']

if (mismatched.length > 0) {
  lines.push('내용이 바뀐 파일 — 사본을 직접 고쳤을 때 나옵니다.')
  for (const { rel, want, got } of mismatched) {
    lines.push(`  🔴 ${rel}`)
    lines.push(`       목록 ${want}`)
    lines.push(`       실제 ${got}`)
  }
  lines.push('')
}

if (unlisted.length > 0) {
  lines.push('목록에 없는 파일 — 사본에 무언가를 더 넣었을 때 나옵니다.')
  for (const rel of unlisted) lines.push(`  🔴 ${rel}`)
  lines.push('  사본에 손으로 파일을 더하면 다음 복사에서 사라집니다.')
  lines.push('')
}

if (gone.length > 0) {
  lines.push('없어진 파일 — 목록에는 있는데 실제로 없습니다.')
  for (const rel of gone) lines.push(`  🔴 ${rel}`)
  lines.push('  CI 가 이 파일을 부릅니다. 없으면 파이프라인이 죽습니다.')
  lines.push('')
}

fail(lines)
