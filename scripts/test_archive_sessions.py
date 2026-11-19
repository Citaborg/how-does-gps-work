"""Regression cases for public trace redaction and bounded attribution."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('gps_archive', Path(__file__).with_name('archive-sessions.py'))
archive = importlib.util.module_from_spec(spec)
spec.loader.exec_module(archive)


class ArchiveTests(unittest.TestCase):
    def test_public_urls_are_preserved(self):
        text = '[UiO](https://www.uio.no/gps(1).html) http://127.0.0.1:4176/ https://host/x:/example'
        self.assertEqual(archive.public_text(text), text)

    def test_private_paths_and_markdown_delimiters(self):
        text = '[file](C:/Users/owner/file.txt) `X:\\repos\\app` [file](file:///Y:/site/index.html)'
        self.assertEqual(archive.public_text(text), '[file]([local-path]) `[local-path]` [file]([local-path])')
        self.assertEqual(archive.public_text('[share](\\\\server\\private\\file.txt)'), '[share]([network-path])')

    def test_likely_credentials_stop_export(self):
        with self.assertRaises(ValueError):
            archive.public_text('Bearer ' + 'a' * 30)

    def test_models_include_effective_context_and_only_bounded_switches(self):
        context = lambda model: {'type': 'turn_context', 'payload': {'model': model}}
        rows = [context('old'), context('creation'), {}, context('within'), {}, context('later')]
        self.assertEqual(archive.codex_models(rows, 3, 5), {'creation', 'within'})
        self.assertEqual(archive.codex_models(rows, 2, 3), {'creation'})

    def test_agy_usage_sums_bounded_planner_responses_only(self):
        rows = [
            {'step_index': 0, 'type': 'USER_INPUT'},
            {'step_index': 1, 'type': 'PLANNER_RESPONSE', 'input_tokens': 10, 'output_tokens': 5, 'cache_read_tokens': 0},
            {'step_index': 2, 'type': 'GENERIC', 'input_tokens': 99},
            {'step_index': 3, 'type': 'PLANNER_RESPONSE', 'input_tokens': 20, 'output_tokens': 7, 'cache_read_tokens': 100},
            {'step_index': 4, 'type': 'PLANNER_RESPONSE', 'input_tokens': 1, 'output_tokens': 1, 'cache_read_tokens': 1},
        ]
        self.assertEqual(archive.agy_usage(rows, 0, 3), {'input_tokens': 30, 'output_tokens': 12, 'cache_read_tokens': 100})
        self.assertIsNone(archive.agy_usage([{'step_index': 1, 'type': 'PLANNER_RESPONSE', 'content': 'x'}], 0, None))


if __name__ == '__main__':
    unittest.main()
