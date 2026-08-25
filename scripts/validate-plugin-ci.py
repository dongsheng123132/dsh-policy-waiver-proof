from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / '.codex-plugin' / 'plugin.json').read_text(encoding='utf-8'))
assert manifest['name'] == 'dsh-policy-waiver-proof'
assert manifest['mcpServers'] == './.mcp.json'
assert (root / '.mcp.json').is_file()
print('portable plugin validation passed')
