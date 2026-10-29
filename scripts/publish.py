"""Prepare or publish only the explicitly listed GPS and bredland text changes.

Default: write a local preview. --apply requires a private backup directory.
Run only from an approved, merged revision. No remote Git or web APIs are used.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ('index.html', 'style.css', 'app.js', 'geometry.js', 'spheres.js')
IMAGES = ('sol-1-2d.jpg', 'sol-2-3d.jpg', 'sol-3-ekko.jpg')
TEXT_TARGETS = ('index.html', 'prosjekter/index.html')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def plan(web_root):
    changes, baselines = {}, {}
    for target in TEXT_TARGETS:
        raw = (web_root / target).read_bytes()
        baselines[target] = raw
        changes[target] = raw.decode('utf-8').replace('\r\n', '\n')
    patch_set = json.loads((ROOT / 'site/bredland-patches.json').read_text(encoding='utf-8'))
    for patch in patch_set['patches']:
        target = patch['target']
        if target not in TEXT_TARGETS:
            raise ValueError('Unexpected text target')
        if changes[target].count(patch['before']) != 1:
            raise ValueError(f'Baseline changed or patch already applied: {target}')
        changes[target] = changes[target].replace(patch['before'], patch['after'], 1)
    changes = {k: v.encode('utf-8') for k, v in changes.items()}
    changes['gps/index.html'] = (ROOT / 'site/index.html').read_bytes()
    for name in RUNTIME:
        changes['gps/gpt-61-sol-high/' + name] = (ROOT / 'GPT-6.1-Sol-high' / name).read_bytes()
    for name in IMAGES:
        changes['gps/img/' + name] = (ROOT / 'site/img' / name).read_bytes()
    for target in changes:
        if target not in baselines:
            p = web_root / target
            baselines[target] = p.read_bytes() if p.exists() else None
    return changes, baselines


def run(web_root, output, apply=False, backup=None):
    web_root = web_root.resolve()
    if output.resolve() == web_root or output.resolve().is_relative_to(web_root):
        raise ValueError('Preview directory must be outside the web root')
    changes, before = plan(web_root)
    if apply:
        backup = backup.resolve()
        if backup.is_relative_to(ROOT) or backup.is_relative_to(web_root):
            raise ValueError('Backup must be private and outside checkout/web root')
        # A fresh directory prevents overwriting a previous recovery snapshot.
        backup.mkdir(parents=True, exist_ok=False)
        for target, raw in before.items():
            if raw is not None:
                dest = backup / target
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(raw)
                assert digest(dest.read_bytes()) == digest(raw)
        manifest = {target: {'before': digest(before[target]) if before[target] is not None else None,
                             'after': digest(raw)} for target, raw in changes.items()}
        (backup / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8', newline='\n')
        # Complete preflight before writing anything to the website.
        for target, raw in before.items():
            p = web_root / target
            current = p.read_bytes() if p.exists() else None
            if current != raw:
                raise ValueError(f'Website changed since preparation: {target}')
    dest_root = web_root if apply else output
    # Assets first, then Sol, comparison and homepage/project HTML last.
    ordered = sorted(changes, key=lambda name: (name.endswith('.html'), name))
    for target in ordered:
        dest = dest_root / target
        if apply:
            current = dest.read_bytes() if dest.exists() else None
            if current != before[target]:
                raise ValueError(f'Website changed during publication: {target}; restore from backup if needed')
        dest.parent.mkdir(parents=True, exist_ok=True)
        temporary = dest.with_name(dest.name + '.gps-update-tmp')
        if temporary.exists():
            raise ValueError('Temporary publication file already exists')
        temporary.write_bytes(changes[target])
        assert digest(temporary.read_bytes()) == digest(changes[target])
        os.replace(temporary, dest)
        assert digest(dest.read_bytes()) == digest(changes[target])
    print(('Published' if apply else 'Prepared preview:'), len(changes), 'files; file hashes verified')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--web-root', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=ROOT / '.local/preview')
    parser.add_argument('--backup-dir', type=Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if args.apply and args.backup_dir is None:
        parser.error('--apply requires --backup-dir')
    run(args.web_root, args.output, args.apply, args.backup_dir)
