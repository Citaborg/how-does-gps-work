"""Exercise publication against disposable local files, never the live website."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('gps_publish', Path(__file__).with_name('publish.py'))
publish = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publish)


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.web = self.root / 'web'
        patches = json.loads((publish.ROOT / 'site/bredland-patches.json').read_text(encoding='utf-8'))['patches']
        for target in publish.TEXT_TARGETS:
            dest = self.web / target
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes('\n'.join(p['before'] for p in patches if p['target'] == target).encode())
        (self.web / 'gps').mkdir()
        (self.web / 'gps/index.html').write_bytes(b'old comparison')
        (self.web / 'gps/unrelated.txt').write_bytes(b'preserve other applications')

    def snapshot(self):
        return {p.relative_to(self.web).as_posix(): p.read_bytes() for p in self.web.rglob('*') if p.is_file()}

    def test_preview_does_not_write_website(self):
        before = self.snapshot()
        publish.run(self.web, self.root / 'preview')
        self.assertEqual(self.snapshot(), before)
        self.assertIn('Unity-teamet', (self.root / 'preview/prosjekter/index.html').read_text(encoding='utf-8'))
        self.assertTrue((self.root / 'preview/gps/gpt-61-sol-high/app.js').is_file())

    def test_apply_preserves_recoverable_backup_and_unrelated_files(self):
        before = self.snapshot()
        expected, _ = publish.plan(self.web)
        backup = self.root / 'backup'
        publish.run(self.web, self.root / 'preview', apply=True, backup=backup)
        manifest = json.loads((backup / 'manifest.json').read_text())
        for target, data in expected.items():
            self.assertEqual((self.web / target).read_bytes(), data)
            self.assertEqual(manifest[target]['after'], publish.digest(data))
            if target in before:
                self.assertEqual((backup / target).read_bytes(), before[target])
            else:
                self.assertIsNone(manifest[target]['before'])
        self.assertEqual((self.web / 'gps/unrelated.txt').read_bytes(), before['gps/unrelated.txt'])
        self.assertFalse(any(self.web.rglob('*.gps-update-tmp')))

    def test_changed_baseline_stops_before_any_website_write(self):
        (self.web / 'index.html').write_bytes(b'changed by another editor')
        before = self.snapshot()
        with self.assertRaisesRegex(ValueError, 'Baseline changed'):
            publish.run(self.web, self.root / 'preview', apply=True, backup=self.root / 'backup')
        self.assertEqual(self.snapshot(), before)

    def test_existing_backup_is_never_overwritten(self):
        backup = self.root / 'backup'
        backup.mkdir()
        (backup / 'keep.txt').write_bytes(b'existing recovery snapshot')
        before = self.snapshot()
        with self.assertRaises(FileExistsError):
            publish.run(self.web, self.root / 'preview', apply=True, backup=backup)
        self.assertEqual(self.snapshot(), before)
        self.assertEqual((backup / 'keep.txt').read_bytes(), b'existing recovery snapshot')


if __name__ == '__main__':
    unittest.main()
