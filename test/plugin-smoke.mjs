import assert from 'node:assert/strict'
import { createDefinitions } from '../index.js'
import { fixture, json } from './helpers.mjs'

const definitions = createDefinitions({}, { workspaceRoot: process.cwd() })
assert.deepEqual(definitions.map(row => row.name), ['dsh_policy_waiver_inspect', 'dsh_policy_waiver_verify'])
const result = await definitions[0].execute({ manifestJson: json(await fixture()) })
assert.equal(result.grantsWaiver, false)
process.stdout.write('plugin smoke passed: 2 tools\n')
