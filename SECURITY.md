# Security

Report vulnerabilities privately through GitHub Security Advisories for this repository. Do not include real credentials, authorization headers, cookies, private keys, or original business payloads in reports or fixtures.

The verifier is offline and non-authorizing. It rejects path traversal, symlink input paths, secret-shaped values, sensitive raw/body/content fields, oversized manifests, duplicate evidence IDs, and malformed hashes. Artifact writes are restricted to an explicit workspace-relative directory and verified by read-back.
