"""Local malformed-payload tests; no build or publication."""

import hashlib
import io
import tarfile
import tempfile
import unittest
from pathlib import Path

from tool_site_payload import unpack, verify_tree


class PayloadTests(unittest.TestCase):
    def setUp(self):
        work = Path(".work/payload-tests")
        work.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=work)
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def archive(self, names):
        archive = self.root / "payload.tar.gz"
        with tarfile.open(archive, "w:gz") as out:
            for name in names:
                data = b"reviewed bytes"
                item = tarfile.TarInfo(name)
                item.size = len(data)
                out.addfile(item, io.BytesIO(data))
        return archive, hashlib.sha256(archive.read_bytes()).hexdigest()

    def test_exact_archive_and_whole_tree(self):
        archive, sha = self.archive(["index.html"])
        destination = self.root / "site"
        self.assertEqual(unpack(archive, sha, destination), 1)
        manifest = hashlib.sha256(b"reviewed bytes").hexdigest() + "  index.html\n"
        expected = hashlib.sha256(manifest.encode()).hexdigest()
        self.assertEqual(verify_tree(destination, expected, 1), expected)
        (destination / "unexpected.txt").write_text("extra")
        with self.assertRaises(ValueError):
            verify_tree(destination, expected, 1)

    def test_wrong_archive_hash_fails_before_extraction(self):
        archive, _ = self.archive(["index.html"])
        with self.assertRaises(ValueError):
            unpack(archive, "0" * 64, self.root / "site")
        self.assertFalse((self.root / "site").exists())

    def test_traversal_and_duplicate_paths_are_rejected(self):
        for names in [
            ["../outside"], ["/outside"], ["index.html", "index.html"],
            ["index.html", "./index.html"],
        ]:
            with self.subTest(names=names):
                archive, sha = self.archive(names)
                with self.assertRaises(ValueError):
                    unpack(
                        archive, sha, self.root / str(len(list(self.root.iterdir())))
                    )

    def test_unresolved_tree_pin_is_not_a_pass(self):
        self.root.joinpath("index.html").write_text("site")
        with self.assertRaises(ValueError):
            verify_tree(self.root, "__SITE_SHA256__", 1)


if __name__ == "__main__":
    unittest.main()
