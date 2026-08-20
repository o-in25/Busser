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
