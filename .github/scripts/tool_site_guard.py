"""Read-only dispatch guard for the one reviewed Site release.

Receipt hashes identify separately reviewed authorization/assessment records; they
are not themselves proof of user consent. The parent must validate those records
before dispatch. No administrative or publishing operation is performed here.
"""
import json
import os
import re
import subprocess
from datetime import datetime

PATH = '.github/workflows/companion-guide.yml'


def stamp(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


def check(env, main_sha, runs):
    if env['GITHUB_REF'] != 'refs/heads/main' or main_sha != env['GITHUB_SHA']:
        raise ValueError('Dispatch must use unchanged main at its exact workflow commit.')
    if env.get('GITHUB_RUN_ATTEMPT', '1') != '1':
        raise ValueError('A rerun is not the unique dispatch recorded for this release.')
    for key in ('APPROVAL_RECEIPT_SHA256', 'DISPATCH_RECEIPT_SHA256'):
        if not re.fullmatch(r'[a-f0-9]{64}', env.get(key, '')):
            raise ValueError(f'Missing exact receipt identity: {key}.')
    if len({r['id'] for r in runs}) != len(runs):
        raise ValueError('Duplicate or changing paginated run inventory.')
    own = [r for r in runs if str(r['id']) == env['GITHUB_RUN_ID']]
    if len(own) != 1:
        raise ValueError('Own dispatch is absent or ambiguous in the full inventory.')
    own = own[0]
    expected_title = f"Tool release: {env['OPERATION']} | {env['DISPATCH_RECEIPT_SHA256']}"
    if own['head_sha'] != env['GITHUB_SHA'] or own['event'] != 'workflow_dispatch' or own['path'].split('@')[0] != PATH or own['display_title'] != expected_title:
        raise ValueError('Own dispatch identity differs from its receipt.')
    if sum(r.get('display_title') == expected_title for r in runs) != 1:
        raise ValueError('The dispatch receipt has been reused.')
    target = None
    boundary = stamp(own['created_at'])
    if env['OPERATION'] == 'restore-prior-site':
        for key in ('ROLLOUT_ASSESSMENT_SHA256', 'FORWARD_DISPATCH_RECEIPT_SHA256'):
            if not re.fullmatch(r'[a-f0-9]{64}', env.get(key, '')):
                raise ValueError(f'Restore requires {key}.')
        match = [r for r in runs if str(r['id']) == env.get('FAILED_FORWARD_RUN_ID')]
        if len(match) != 1:
            raise ValueError('Recorded forward run is missing or ambiguous.')
        target = match[0]
        title = f"Tool release: publish | {env['FORWARD_DISPATCH_RECEIPT_SHA256']}"
        if (target['id'] == own['id'] or target['status'] != 'completed'
                or target['head_sha'] != env['GITHUB_SHA']
                or target['event'] != 'workflow_dispatch'
                or target['path'].split('@')[0] != PATH
                or target['display_title'] != title
                or target['created_at'] != env.get('FAILED_FORWARD_CREATED_AT')
                or sum(r.get('display_title') == title for r in runs) != 1):
            raise ValueError('Restore target must be the exact completed forward dispatch.')
        # A technically successful run can fail acceptance. Its completed state
        # is mandatory; the external assessment records the actual failure.
        boundary = stamp(target['created_at'])
    elif env['OPERATION'] != 'publish':
        raise ValueError('Unknown release operation.')
    for run in runs:
        if run['id'] == own['id'] or (target and run['id'] == target['id']):
            continue
        if run['event'] != 'workflow_dispatch' or not run.get('created_at') or not run.get('status'):
            raise ValueError('Incomplete dispatch inventory entry.')
        if run['status'] != 'completed' or stamp(run['created_at']) >= boundary:
            raise ValueError(f"Other active, same-time or newer dispatch blocks operation: {run['id']}.")
    return {'permitted_by_state_guard': True, 'operation': env['OPERATION'],
            'dispatch_run_id': own['id'], 'workflow_main_sha': main_sha,
            'forward_run_id': target['id'] if target else own['id'],
            'inventory_dispatches': len(runs)}


def main():
    env = dict(os.environ)
    repo = env['GITHUB_REPOSITORY']
    def api(route, *args):
        return json.loads(subprocess.check_output(['gh', 'api', *args, route], text=True))
    main_sha = api(f'repos/{repo}/git/ref/heads/main')['object']['sha']
    pages = api(f'repos/{repo}/actions/workflows/companion-guide.yml/runs?event=workflow_dispatch&per_page=100', '--paginate', '--slurp')
    runs = [r for p in pages for r in p['workflow_runs']]
    if not pages or any(p['total_count'] != len(runs) for p in pages):
        raise ValueError('Incomplete or changing paginated dispatch inventory.')
    print(json.dumps(check(env, main_sha, runs), sort_keys=True))


if __name__ == '__main__':
    main()
