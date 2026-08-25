import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fixture, json } from './helpers.mjs'

const child = spawn(process.execPath, ['mcp-server.mjs'], { cwd: new URL('..', import.meta.url), stdio: ['pipe', 'pipe', 'inherit'], shell: false })
let output = ''; child.stdout.setEncoding('utf8'); child.stdout.on('data', chunk => { output += chunk })
const request = (id, method, params) => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
request(1, 'initialize', {})
request(2, 'tools/list', {})
request(3, 'tools/call', { name: 'policy_waiver_verify', arguments: { manifestJson: json(await fixture()) } })
await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('MCP smoke timed out')), 5000); const poll = setInterval(() => { if (output.trim().split('\n').length >= 3) { clearTimeout(timer); clearInterval(poll); resolve() } }, 10) })
child.kill()
const rows = output.trim().split('\n').map(JSON.parse)
assert.equal(rows[1].result.tools.length, 2)
assert.equal(rows[2].result.structuredContent.verdict, 'contained')
process.stdout.write('mcp smoke passed: initialize, list, call\n')
