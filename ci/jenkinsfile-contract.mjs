// backend/Jenkinsfile 이 «배포를 실제로 돌릴 수 있는 모양인가» 를 본다 — S15P21E201-561.
//
// 🔴 이 검사는 2026-09-22 하루에 같은 파일이 «두 번» 운영을 멈춘 뒤에 생겼다.
//    두 번 다 사람이 리뷰했고, 두 번 다 아무도 못 봤다. 눈으로 찾는 종류가 아니다.
//
//    ① 셸 주석이 docker run 을 삼켰다
//       줄 끝 역슬래시는 다음 줄을 «붙인다». 붙인 뒤 #(주석)을 만나면 그 뒤가 전부 주석이다.
//       카프카 설명 주석이 명령 한가운데 있어서 이미지 이름까지 사라졌고,
//       `"docker run" requires at least 1 argument` 로 배포가 죽었다. 그런데 그 직전
//       `docker stop backend` 는 성공했으므로 «컨테이너가 사라진 채로» 남았다 —
//       API 전체가 502 가 되어 약 2시간 멈췄다.
//
//    ② 그것을 고치며 넣은 설명 주석이 Groovy 파싱을 깨뜨렸다
//       `sh ''' ... '''` 는 셸에게 가기 «전에» Groovy 문자열이다. Groovy 의 세 따옴표
//       문자열은 파이썬과 달리 역슬래시를 이스케이프로 처리한다. 주석 안에 쓴 역슬래시
//       한 글자가 `unexpected char` 로 파일 전체를 파싱 불가로 만들었다.
//
// 그래서 보는 것이 셋이다. 셋 다 그날의 «깨진 버전»에서 실제로 실패하는 것을 확인했다.
//
// 쓰는 법
//   node ci/jenkinsfile-contract.mjs                    (기본: backend/Jenkinsfile)
//   node ci/jenkinsfile-contract.mjs <경로>
//
// 종료 코드: 0 통과 · 1 파일을 못 읽음 · 2 계약 위반

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const BACKSLASH = String.fromCharCode(92)
const EXIT = { OK: 0, UNKNOWN: 1, VIOLATION: 2 }

/** 배포가 반드시 컨테이너까지 넘겨야 하는 값들. 빠지면 기능이 «조용히» 꺼진다. */
export const REQUIRED_ENV = [
  'GABOLLE_DB_URL',
  'GABOLLE_JWT_SECRET',
  'GABOLLE_KMA_SERVICE_KEY',
  'GABOLLE_TRANSIT_SERVICE_KEY',
  'GABOLLE_EXCHANGE_RATE_AUTH_KEY',
  'GABOLLE_INTERNAL_API_TOKEN',
  'GABOLLE_KAFKA_BOOTSTRAP_SERVERS',
]

/**
 * 셸이 줄 이음(역슬래시+개행)을 처리한 «뒤»의 명령을 만든다.
 *
 * 🔴 주석을 만나면 거기서 끊는다 — 셸이 실제로 그렇게 한다. 이 함수가 결함을
 *    «재현» 해야 검사가 뜻을 갖는다. 주석을 미리 걸러 내면 깨진 파일도 통과한다.
 */
export function joinShellCommand(lines) {
  const parts = []
  for (const raw of lines) {
    const line = raw.trim()
    const continues = line.endsWith(BACKSLASH)
    parts.push(continues ? line.slice(0, -1).trim() : line)
    if (!continues) break
  }
  const joined = parts.join(' ')
  const hash = joined.indexOf('#')
  return (hash >= 0 ? joined.slice(0, hash) : joined).trim()
}

/** `docker run` 으로 시작하는 블록들을 찾는다. 끝은 이미지 이름 줄이다. */
export function dockerRunBlocks(source, marker = 'docker run -d --name backend') {
  const lines = source.split('\n')
  const blocks = []
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes(marker)) continue
    // 끝을 역슬래시로 찾지 않는다 — 주석이 줄 이음을 끊어 놓았으면 첫 주석에서 멈춘다.
    let end = i
    while (end < lines.length && !/local-route-backend:[a-z]+/.test(lines[end])) end += 1
    blocks.push({ line: i + 1, lines: lines.slice(i, end + 1) })
  }
  return blocks
}

/** `sh ''' ... '''` 안에서 줄 끝이 아닌 자리에 있는 역슬래시를 찾는다 (Groovy 이스케이프). */
export function strayBackslashes(source) {
  const lines = source.split('\n')
  const found = []
  let inShell = false
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const fence = (line.match(/'''/g) || []).length
    if (!inShell) {
      if (fence % 2 === 1) inShell = true
      continue
    }
    if (fence % 2 === 1) { inShell = false; continue }
    // 줄 끝의 역슬래시는 «정상» 이다 (셸 줄 이음). 그것만 떼고 나머지에 남아 있으면 문제다.
    let body = line.replace(/\s+$/, '')
    if (body.endsWith(BACKSLASH)) body = body.slice(0, -1)
    if (body.includes(BACKSLASH)) found.push({ line: i + 1, text: line.trim() })
  }
  return found
}

export function check(source) {
  const problems = []

  for (const block of dockerRunBlocks(source)) {
    const command = joinShellCommand(block.lines)
    const last = command.split(/\s+/).pop() || ''
    if (!/^local-route-backend:[a-z]+$/.test(last)) {
      problems.push({
        line: block.line,
        what: `docker run 이 이미지 이름으로 끝나지 않습니다 (마지막 인자: ${last || '(없음)'})`,
        why: '셸이 줄을 붙인 뒤 주석을 만나 그 뒤가 사라졌을 때 이렇게 됩니다. 이대로 배포하면 '
          + '"docker run requires at least 1 argument" 로 죽고, 그 전에 docker stop 은 이미 '
          + '성공했으므로 서버가 «없는 채로» 남습니다.',
      })
    }
    for (const name of REQUIRED_ENV) {
      if (!command.includes(name)) {
        problems.push({
          line: block.line,
          what: `${name} 이(가) docker run 에 없습니다`,
          why: '값을 Jenkins 에 넣어도 컨테이너 안까지 안 갑니다. 그 기능만 조용히 꺼집니다.',
        })
      }
    }
    for (const [offset, raw] of block.lines.entries()) {
      if (offset > 0 && raw.trim().startsWith('#')) {
        problems.push({
          line: block.line + offset,
          what: 'docker run «안»에 셸 주석이 있습니다',
          why: '줄 이음이 이 줄을 앞줄에 붙이므로 여기부터 끝까지 전부 주석이 됩니다. '
            + '설명은 명령이 시작되기 «전»에 적습니다.',
        })
        break
      }
    }
  }

  for (const stray of strayBackslashes(source)) {
    problems.push({
      line: stray.line,
      what: `sh ''' ''' 안에 줄 끝이 아닌 역슬래시가 있습니다: ${stray.text.slice(0, 80)}`,
      why: "sh ''' ... ''' 는 셸에게 가기 «전에» Groovy 문자열입니다. Groovy 는 세 따옴표 "
        + '문자열에서도 역슬래시를 이스케이프로 처리해서, 파일 전체가 파싱 불가가 됩니다. '
        + '주석에 역슬래시를 쓰지 말고 「역슬래시」라고 말로 적으십시오.',
    })
  }

  return problems
}

function main() {
  const path = process.argv[2] || 'backend/Jenkinsfile'
  let source
  try {
    source = readFileSync(path, 'utf8')
  }
  catch (error) {
    console.error(`읽지 못했습니다: ${path} — ${error.message}`)
    return EXIT.UNKNOWN
  }

  const blocks = dockerRunBlocks(source)
  if (blocks.length === 0) {
    // 🔴 조용히 통과시키지 않는다. 볼 것을 못 찾은 것은 «통과»가 아니다.
    console.error(`${path} 에서 docker run 블록을 하나도 못 찾았습니다. 검사가 꺼진 것과 같습니다.`)
    return EXIT.UNKNOWN
  }

  const problems = check(source)
  if (problems.length === 0) {
    console.log(`🟢 ${path} — docker run 블록 ${blocks.length}개가 모두 이미지 이름으로 끝나고,`)
    console.log(`   필수 환경변수 ${REQUIRED_ENV.length}개가 전부 들어 있으며, Groovy 이스케이프 문제도 없습니다.`)
    return EXIT.OK
  }

  console.error(`🔴 ${path} — ${problems.length}건`)
  for (const p of problems) {
    console.error('')
    console.error(`  ${p.line}행: ${p.what}`)
    console.error(`     ${p.why}`)
  }
  console.error('')
  console.error('  이 검사는 2026-09-22 에 같은 파일이 두 번 운영을 멈춘 뒤에 생겼습니다 (S15P21E201-561).')
  return EXIT.VIOLATION
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main())
}
