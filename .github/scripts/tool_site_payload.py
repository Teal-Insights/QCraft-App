"""Verify pinned release archives and complete site-file manifests."""
import argparse
import hashlib
import re
import tarfile
from pathlib import Path, PurePosixPath


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def unpack(archive, expected, destination):
    if not re.fullmatch(r'[a-f0-9]{64}', expected) or digest(archive) != expected:
        raise ValueError('Archive checksum differs from the reviewed fixed pin.')
    destination.mkdir(parents=True, exist_ok=False)
    with tarfile.open(archive, 'r:gz') as tar:
        seen = set()
        for member in tar.getmembers():
            name = PurePosixPath(member.name)
            if name.is_absolute() or '..' in name.parts or '\\' in member.name or '\n' in member.name:
                raise ValueError(f'Unsafe archive path: {member.name}')
            if not member.isfile() or member.name in seen:
                raise ValueError(f'Archive must contain unique regular files: {member.name}')
            seen.add(member.name)
            target = destination / member.name
            target.parent.mkdir(parents=True, exist_ok=True)
            with tar.extractfile(member) as source:
                target.write_bytes(source.read())
    return len(seen)


def verify_tree(root, expected, count):
    if not re.fullmatch(r'[a-f0-9]{64}', expected) or count < 1:
        raise ValueError('Unresolved or invalid full-site identity pin.')
    paths = sorted(p for p in root.rglob('*') if p.is_file() or p.is_symlink())
    if any(p.is_symlink() for p in paths):
        raise ValueError('Site contains a symlink.')
    manifest = ''.join(f'{digest(p)}  {p.relative_to(root).as_posix()}\n' for p in paths)
    actual = hashlib.sha256(manifest.encode()).hexdigest()
    if len(paths) != count or actual != expected:
        raise ValueError(f'Full-site identity mismatch: {len(paths)} files, {actual}.')
    print(f'Full site verified: {len(paths)} files, {actual}')
    return actual


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    un = commands.add_parser('unpack')
    un.add_argument('archive', type=Path)
    un.add_argument('sha256')
    un.add_argument('destination', type=Path)
    tree = commands.add_parser('verify-tree')
    tree.add_argument('root', type=Path)
    tree.add_argument('sha256')
    tree.add_argument('count', type=int)
    args = parser.parse_args()
    if args.command == 'unpack':
        print(f'Unpacked {unpack(args.archive, args.sha256, args.destination)} verified files')
    else:
        verify_tree(args.root, args.sha256, args.count)


if __name__ == '__main__':
    main()
