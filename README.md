# DSH Policy Waiver Proof

An offline, deterministic evidence layer for temporary policy exceptions in DeepSeek Harness. It proves whether recorded uses stayed within an approved subject, revision, scope, action allowlist, time window, use limit, and compensating controls. It **does not grant** a waiver, change policy, approve a tool call, or execute an external command.

This is complementary to:

- `dsh-tool-policy`, which evaluates pre-execution policy rules.
- `dsh-policy-drift-proof`, which detects policy/configuration drift.
- `dsh-decision-effect-proof`, which reconciles a decision with a resulting effect.

Policy Waiver Proof instead verifies the bounded lifecycle of an already-issued temporary exception, including revocation or closure. Denied attempts are disclosed but do not consume the approved use limit. Reports contain only hashes, counts, booleans, public bounded IDs transformed to hashes, and machine-readable verdicts; raw business bodies and secret-shaped material are rejected.

## Install and compose

```bash
dsh plugin add github:dongsheng123132/dsh-policy-waiver-proof#COMMIT
```

The DSH bundle publishes two tools from one headless core:

- `dsh_policy_waiver_inspect`
- `dsh_policy_waiver_verify`

The independent MCP stdio server publishes `policy_waiver_inspect` and `policy_waiver_verify`. The CLI accepts `inspect` or `verify` followed by an explicit JSON manifest path.

## Manifest and verdict

See [`examples/contained.json`](examples/contained.json). Evidence is explicit and hash-addressed. Applied uses must be contiguous, occur before evaluation and within the waiver window, match all bindings, remain below `maxUses`, precede revocation/closure, and have fresh effective compensating controls. Any violation produces `breached`; missing or stale evidence is never silently inferred.

The DSH verify tool reads only a workspace-relative non-symlink manifest and writes only to an explicit workspace-relative `artifactDir`. Its deterministic report filename is the SHA-256 of canonical report bytes, created exclusively and verified by read-back.

## Verify locally

```bash
npm test
npm run check
npm run smoke:plugin
npm run smoke:mcp
python C:/Users/YOU/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .
```

Node.js 22 or newer is required. No runtime dependency or network access is used by the verifier.
