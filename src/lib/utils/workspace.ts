import { goto, invalidateAll } from '$app/navigation';

import { workspaceSwitching } from '../../stores';

// workspace-scoped detail routes that would 404 in another workspace — redirect to their list instead
function redirectTargetForWorkspaceSwitch(pathname: string): string | null {
	if (/^\/catalog\/(?!browse|add|explore)[^/]+/.test(pathname)) return '/catalog';
	if (/^\/inventory\/category\/(?!add)[^/]+\/edit/.test(pathname)) return '/inventory/category';
	if (/^\/inventory\/(?!category|suppliers|add)[^/]+\/edit/.test(pathname)) return '/inventory';
	return null;
}

// session-only switch: sets the active-workspace cookie then refreshes page data in place
// (no full reload). returns false if the request failed so callers can bail.
export async function switchWorkspace(workspaceId: string, pathname: string): Promise<boolean> {
	workspaceSwitching.set(true);
	try {
		const res = await fetch('/api/workspace/switch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ workspaceId }),
		});
		if (!res.ok) return false;

		const target = redirectTargetForWorkspaceSwitch(pathname);
		if (target) {
			await goto(target, { invalidateAll: true });
		} else {
			await invalidateAll();
		}
		return true;
	} finally {
		workspaceSwitching.set(false);
	}
}
