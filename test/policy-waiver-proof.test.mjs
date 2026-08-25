import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { evaluatePolicyWaiverManifest, inspectPolicyWaiverManifestJson, verifyPolicyWaiverManifest } from '../lib/policy-waiver-proof.mjs'
import { fixture, json } from './helpers.mjs'

test('contained fixture produces a body-free containment verdict', async () => {
  const result = evaluatePolicyWaiverManifest(json(await fixture()))
  assert.equal(result.verdict, 'contained')
  assert.equal(result.grantsWaiver, false)
  assert.equal(JSON.stringify(result).includes('use-001'), false)
})

test('inspect exposes only bounded hashes and counts', async () => {
  const result = inspectPolicyWaiverManifestJson(json(await fixture()))
  assert.equal(result.recordedUseCount, 2)
  assert.equal(result.requiredControlCount, 2)
  assert.equal(result.executesExternalCommands, false)
})

test('an applied action outside the allowlist breaches containment', async () => {
  const value = await fixture(); value.uses[0].actionSha256 = '7'.repeat(64)
  assert.equal(evaluatePolicyWaiverManifest(json(value)).verdict, 'breached')
})

test('an applied use with the wrong scope breaches containment', async () => {
  const value = await fixture(); value.uses[0].scopeSha256 = '7'.repeat(64)
  assert.equal(evaluatePolicyWaiverManifest(json(value)).checks.allAppliedUsesContained, false)
})

test('subject and target revision are both bound', async () => {
  const subject = await fixture(); subject.uses[0].subjectHash = '7'.repeat(64)
  const revision = await fixture(); revision.uses[0].targetRevision = 'revision-43'
  assert.equal(evaluatePolicyWaiverManifest(json(subject)).verdict, 'breached')
  assert.equal(evaluatePolicyWaiverManifest(json(revision)).verdict, 'breached')
})

test('applied use count cannot exceed maxUses', async () => {
  const value = await fixture(); value.waiver.maxUses = 1
  assert.equal(evaluatePolicyWaiverManifest(json(value)).checks.useLimitSatisfied, false)
})

test('sequence must be contiguous and monotonic', async () => {
  const value = await fixture(); value.uses[1].sequence = 3
  assert.equal(evaluatePolicyWaiverManifest(json(value)).checks.sequenceMonotonic, false)
})

test('stale compensating evidence breaches containment', async () => {
  const value = await fixture(); value.compensatingControls[0].observedAt = '2026-08-25T00:00:00.000Z'
  assert.equal(evaluatePolicyWaiverManifest(json(value)).checks.compensatingControlsValid, false)
})

test('missing or failed compensating control breaches containment', async () => {
  const missing = await fixture(); missing.compensatingControls.pop()
  const failed = await fixture(); failed.compensatingControls[0].status = 'failed'
  assert.equal(evaluatePolicyWaiverManifest(json(missing)).verdict, 'breached')
  assert.equal(evaluatePolicyWaiverManifest(json(failed)).verdict, 'breached')
})

test('an applied use after expiry breaches containment', async () => {
  const value = await fixture(); value.uses[1].occurredAt = '2026-08-26T08:00:00.000Z'
  assert.equal(evaluatePolicyWaiverManifest(json(value)).verdict, 'breached')
})

test('an applied use after revocation breaches containment', async () => {
  const value = await fixture(); value.waiver.status = 'revoked'; value.waiver.revokedAt = '2026-08-26T04:30:00.000Z'
  assert.equal(evaluatePolicyWaiverManifest(json(value)).verdict, 'breached')
})

test('a denied out-of-scope attempt is disclosed but does not consume or breach a waiver', async () => {
  const value = await fixture(); value.uses[0].result = 'denied'; value.uses[0].actionSha256 = '7'.repeat(64); value.waiver.maxUses = 1
  const result = evaluatePolicyWaiverManifest(json(value))
  assert.equal(result.verdict, 'contained')
  assert.equal(result.disclosures.appliedUseCount, 1)
})

test('secret-shaped values and sensitive payload fields are rejected', async () => {
  const secretValue = await fixture(); secretValue.note = 'Bearer abcdefghijklmnop'
  const rawBody = await fixture(); rawBody.raw = 'business text'
  assert.throws(() => evaluatePolicyWaiverManifest(json(secretValue)), { code: 'SECRET_MATERIAL' })
  assert.throws(() => evaluatePolicyWaiverManifest(json(rawBody)), { code: 'SECRET_MATERIAL' })
})

test('content-addressed artifact is replay-safe and read back', async () => {
  const root = await mkdtemp(join(tmpdir(), 'waiver-proof-'))
  await writeFile(join(root, 'manifest.json'), json(await fixture()))
  const first = await verifyPolicyWaiverManifest({ workspaceRoot: root, manifestPath: 'manifest.json', artifactDir: 'artifacts' })
  const second = await verifyPolicyWaiverManifest({ workspaceRoot: root, manifestPath: 'manifest.json', artifactDir: 'artifacts' })
  assert.deepEqual(second.artifact, first.artifact)
  assert.equal(first.artifact.verifiedByReadBack, true)
  assert.equal(JSON.parse(await readFile(join(root, first.artifact.path), 'utf8')).verdict, 'contained')
})

test('path traversal and symlink inputs are rejected', async t => {
  const root = await mkdtemp(join(tmpdir(), 'waiver-path-'))
  await assert.rejects(verifyPolicyWaiverManifest({ workspaceRoot: root, manifestPath: '../outside.json', artifactDir: 'artifacts' }), { code: 'PATH_ESCAPE' })
  if (process.platform === 'win32') return t.skip('unprivileged Windows symlink creation is not portable')
  const outside = await mkdtemp(join(tmpdir(), 'waiver-out-')); await writeFile(join(outside, 'manifest.json'), json(await fixture())); await mkdir(join(root, 'links')); await symlink(join(outside, 'manifest.json'), join(root, 'links', 'manifest.json'))
  await assert.rejects(verifyPolicyWaiverManifest({ workspaceRoot: root, manifestPath: 'links/manifest.json', artifactDir: 'artifacts' }), { code: 'UNSAFE_MANIFEST' })
})
