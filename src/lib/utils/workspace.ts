import { invalidateAll } from '$app/navigation';

import { workspaceSwitching } from '../../stores';

// session-only switch: sets the active-workspace cookie then refreshes page data in place
// (no full reload). returns false if the request failed so callers can bail.
// switching is only ever reachable from list pages, so there's no detail-route
// redirect to handle here — the affordance's placement is the guard.
export async function switchWorkspace(workspaceId: string): Promise<boolean> {
	workspaceSwitching.set(true);
	try {
		const res = await fetch('/api/workspace/switch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ workspaceId }),
		});
		if (!res.ok) return false;

		await invalidateAll();
		return true;
	} finally {
		workspaceSwitching.set(false);
	}
}

// creates a workspace then switches into it (skeletons come from the switch)
export async function createAndSwitchWorkspace(
	workspaceName: string,
	workspaceType: 'personal' | 'shared'
): Promise<boolean> {
	const res = await fetch('/api/workspace/create', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ workspaceName, workspaceType }),
	});
	if (!res.ok) return false;

	const { workspace } = await res.json();
	if (!workspace?.workspaceId) return false;

	return switchWorkspace(workspace.workspaceId);
}
