"""Export bounded, public dialogue traces from privately held creation sessions.

Python 3.14+ (stdlib zstd). Run locally; private originals never enter the repo.
Tool bodies, reasoning, system instructions and environment metadata are omitted.
"""
import argparse
import compression.zstd
import hashlib
import json
import pathlib
import re
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parents[1]
RUNS = [
    # folder, export name, source kind, native ID, inclusive native record bounds
    ('Fable-5.1-xhigh', 'creation', 'claude', 'a1deae02-3a26-4f8c-810a-e295ba56ab1f', 1, 553),
    ('Fable-5.1-xhigh', 'aborted-attempt', 'claude', 'f5fdb997-9f68-44aa-ae38-5e2c728c4b68', 1, None),
    ('Gemini-3.8-Flash', 'creation', 'agy', 'c27dd0de-6983-4b56-bd08-d462cc3b7b28', 0, 73),
    ('Gemini-3.8-Flash', 'earlier-attempt', 'agy', 'bbff562d-ae2f-4f60-bcbf-7d4d8168a4ee', 0, 72),
    ('Gemini-3.8-Flash-interactive', 'creation', 'agy', 'd6a40e75-cd18-480a-b172-7b4ba7dbd1f2', 0, 501),
    ('Agy-Argon4', 'blocked-attempt', 'agy', 'ac9d0fe4-8136-44bb-a4d9-c8acc2c5e625', 0, 7),
    ('Agy-Argon4', 'creation', 'agy', 'ac9d0fe4-8136-44bb-a4d9-c8acc2c5e625', 8, 15),
    ('GPT6-Astra-xhigh', 'creation', 'codex', '01a0c8c2-69f6-7d20-b42c-d6c3f0438d7f', 17, 539),
    ('GPT6-Astra-xhigh', 'geometry-agent', 'codex', '01a0c8c5-6128-70e1-a582-497205f2403b', 1, 181),
    ('GPT6-Astra-xhigh', 'review-agent', 'codex', '01a0c8d2-3258-7c31-a06f-cc49765da199', 1, 251),
    ('GPT-6.1-Sol-high', 'creation', 'codex', '01a1888d-aa91-7aa1-baef-221be4faf608', 15, 244),
]


def sha(b):
    return hashlib.sha256(b).hexdigest()


def public_text(s):
    # Public traces deliberately redact machine-specific paths, even inside links.
    s = re.sub(r'(?<![\w:/\\])(?:file:///)?[A-Za-z]:[\\/][^\s<>"\n`\])]*', '[local-path]', s)
    s = re.sub(r'\\\\[^\s<>"\n`\])]+', '[network-path]', s)
    # Refuse likely credentials instead of guessing a safe replacement.
    if re.search(r'(?i)(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{24,}|Bearer\s+[A-Za-z0-9._-]{20,})', s):
        raise ValueError('Possible credential: export stopped; private original retained')
    return s


def codex_models(rows, lo, hi):
    """Include the context effective at lo, then changes within the excerpt."""
    models, previous = set(), None
    for line, row in enumerate(rows, 1):
        if hi is not None and line > hi:
            break
        if row.get('type') != 'turn_context':
            continue
        model = row.get('payload', {}).get('model')
        if not model:
            continue
        if line < lo:
            previous = model
        else:
            if line == lo:
                previous = None
            models.add(model)
    if previous:
        models.add(previous)
    return models


def native_path(home, kind, sid):
    if kind == 'agy':
        return home / '.gemini/antigravity-cli/brain' / sid / '.system_generated/logs/transcript_full.jsonl'
    base = home / ('.claude/projects' if kind == 'claude' else '.codex')
    matches = list(base.rglob(sid + '.jsonl' if kind == 'claude' else '*' + sid + '.jsonl*'))
    if len(matches) != 1:
        raise ValueError(f'Expected one source for {sid}, found {len(matches)}')
    return matches[0]


def export(home, private, spec):
    folder, name, kind, sid, lo, hi = spec
    p = native_path(home, kind, sid)
    raw = p.read_bytes()
    original = private / (sid + ('.jsonl.zst' if p.suffix == '.zst' else '.jsonl'))
    if not original.exists():
        original.write_bytes(raw)
    elif sha(original.read_bytes()) != sha(raw):
        # A still-active session may have grown. Preserve a separate exact snapshot.
        original = private / (sid + '-' + sha(raw)[:12] + p.suffix)
        original.write_bytes(raw)
    assert sha(original.read_bytes()) == sha(raw)
    data = compression.zstd.decompress(raw) if p.suffix == '.zst' else raw
    rows = [json.loads(x) for x in data.decode('utf-8-sig').splitlines()]
    events, models, usage = [], codex_models(rows, lo, hi) if kind == 'codex' else set(), None
    claude_usage = {}
    for r in rows:
        if kind == 'agy' and (hi is None or r.get('step_index', 0) <= hi):
            models.update(re.findall(r'`Model Selection` from .*? to (.+?)\. No need', r.get('content', '')))
    start, end, bounded_end = None, None, None
    for line, r in enumerate(rows, 1):
        ix = r.get('step_index', line)
        if ix < lo or hi is not None and ix > hi:
            continue
        ts = r.get('created_at') if kind == 'agy' else r.get('timestamp')
        bounded_end = ts or bounded_end
        if kind == 'codex':
            v = r.get('payload', {})
            if r['type'] == 'event_msg' and v.get('type') == 'token_count':
                usage = v.get('info', {}).get('total_token_usage', usage)
            if r['type'] == 'turn_context':
                models.add(str(v.get('model')))
            if r['type'] != 'response_item':
                continue
            role = v.get('role')
            content = '\n'.join(x.get('text', '') for x in v.get('content', [])) if v.get('type') == 'message' else ''
            tools = [v.get('name')] if v.get('type') in ('function_call', 'custom_tool_call') else []
        elif kind == 'claude':
            v = r.get('message', {})
            if not isinstance(v, dict):
                continue
            if v.get('model'):
                models.add(v['model'])
            if v.get('role') == 'assistant' and v.get('usage'):
                claude_usage[v.get('id', r.get('uuid'))] = v['usage']
            role = v.get('role')
            body = v.get('content', [])
            if isinstance(body, str):
                content, tools = body, []
            else:
                content = '\n'.join(x.get('text', '') for x in body if x.get('type') == 'text')
                tools = [x.get('name') for x in body if x.get('type') == 'tool_use']
        else:
            role = 'user' if r['type'] == 'USER_INPUT' else 'assistant' if r['type'] == 'PLANNER_RESPONSE' else 'tool'
            content = r.get('content', '') if role in ('user', 'assistant') else ''
            if role == 'user':
                m = re.search(r'<USER_REQUEST>(.*?)</USER_REQUEST>', content, re.S)
                if m:
                    content = m[1].strip()
            tools = [x.get('name') for x in r.get('tool_calls', [])]
        if role not in ('user', 'assistant') and not tools:
            continue
        # Imported instructions are not the owner's app request.
        if role == 'user' and (content.startswith('# AGENTS.md') or '<environment_context>' in content or content.startswith('<external_codex_apps')):
            continue
        if not content and not tools:
            continue
        content = public_text(content)
        event = {'source_record': ix, 'timestamp': ts, 'role': role or 'assistant'}
        if content:
            event['text'] = content
        if tools:
            event['tools'] = tools
        events.append(event)
        start = start or ts
        end = ts or end
    target = ROOT / folder / 'sessions'
    target.mkdir(parents=True, exist_ok=True)
    trace = ''.join(json.dumps(e, ensure_ascii=False) + '\n' for e in events).encode()
    (target / (name + '.jsonl')).write_bytes(trace)
    if claude_usage:
        usage = {}
        for item in claude_usage.values():
            for key, value in item.items():
                if isinstance(value, int):
                    usage[key] = usage.get(key, 0) + value
    manifest = {
        'session_id': sid, 'source_kind': kind, 'source_filename': p.name,
        'source_sha256': sha(raw), 'decoded_source_sha256': sha(data),
        'source_record_bounds_inclusive': [lo, hi or len(rows)],
        'trace_sha256': sha(trace), 'events': len(events), 'models_observed': sorted(models),
        'first_dialogue_at': start, 'last_dialogue_at': end,
        'last_cumulative_token_usage': usage,
        'usage_method': 'sum last usage per unique assistant message ID' if kind == 'claude' else 'last cumulative counter' if kind == 'codex' else 'unavailable',
        'bounded_source_end_at': bounded_end,
        'omitted': ['system/developer/environment instructions', 'private reasoning', 'tool arguments and outputs', 'binary data'],
        'redacted': ['absolute local and network paths'],
        'prompt': '../../USER_PROMPTS.md',
    }
    (target / (name + '.manifest.json')).write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(folder, name, len(events), start, end, 'tokens', usage)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--home', type=pathlib.Path, default=pathlib.Path.home())
    ap.add_argument('--private-backup', type=pathlib.Path, required=True)
    args = ap.parse_args()
    private = args.private_backup.resolve()
    if private.is_relative_to(ROOT):
        raise ValueError('Private backup must be outside the checkout')
    private.mkdir(parents=True, exist_ok=True)
    for spec in RUNS:
        export(args.home, private, spec)
