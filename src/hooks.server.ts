import { type Handle, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';
import micromatch from 'micromatch';

import { authenticate, getUserWorkspaces, hasGlobalPermission, hasWorkspaceAccess } from '$lib/server/auth';
import { checkRateLimit, type RateLimitConfig } from '$lib/server/rate-limit';
import { getPreferredWorkspaceId } from '$lib/server/user';

const publicRoutes = [
	'/',
	'/login',
	'/logout',
	'/signup',
	'/verify-email/**',
	'/forgot-password',
	'/reset-password/**',
	'/workspace-selector',
	'/api/mail/user-registration',
	'/auth/**',
];

// Routes that don't require workspace selection (for authenticated users)
const workspaceExemptRoutes = [
	'/',
	'/login',
	'/logout',
	'/signup',
	'/verify-email/**',
	'/forgot-password',
	'/reset-password/**',
	'/workspace-selector',
	'/settings/**',
	'/api/**',
	'/auth/**',
];

const HOUR = 60 * 60 * 1000;

const rateLimitTiers: Record<string, RateLimitConfig> = {
	'image-gen': { maxRequests: 5, windowMs: HOUR },
	'ai-chat': { maxRequests: 15, windowMs: HOUR },
	'text-gen': { maxRequests: 30, windowMs: HOUR },
	upload: { maxRequests: 20, windowMs: HOUR },
};

const rateLimitRoutes: Array<{ path: string; tier: string }> = [
	{ path: '/api/generator/image', tier: 'image-gen' },
	{ path: '/api/assistant/chat', tier: 'ai-chat' },
	{ path: '/api/inventory/scan', tier: 'ai-chat' },
	{ path: '/api/generator/recipe', tier: 'text-gen' },
	{ path: '/api/generator/catalog', tier: 'text-gen' },
	{ path: '/api/generator/inventory', tier: 'text-gen' },
	{ path: '/api/generator/category', tier: 'text-gen' },
	{ path: '/api/generator/rating', tier: 'text-gen' },
	{ path: '/api/upload/image', tier: 'upload' },
];

export const handle: Handle = async ({ event, resolve }): Promise<Response> => {
	const { cookies, url } = event;
	const slug = url.pathname;

	// Ignore Chrome DevTools requests
	if (slug.startsWith('/.well-known/')) {
		return new Response(null, { status: 404 });
	}

	const userToken = cookies.get('userToken');

	event.locals.user = await authenticate(userToken);

	const isPublicRoute = micromatch.isMatch(slug, publicRoutes);

	if (!event.locals.user && !isPublicRoute) {
		return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	}

	// If user is authenticated, resolve active workspace
	if (event.locals.user) {
		const activeWorkspaceId = await resolveActiveWorkspace(event.locals.user.userId, cookies);
		event.locals.activeWorkspaceId = activeWorkspaceId;

		// If no workspace selected and trying to access a route that requires workspace, redirect to selector
		const isWorkspaceExempt = micromatch.isMatch(slug, workspaceExemptRoutes);
		if (!activeWorkspaceId && !isWorkspaceExempt) {
			return redirect(StatusCodes.TEMPORARY_REDIRECT, '/workspace-selector');
		}
	}

	// rate limit AI and upload endpoints for non-admin users
	if (event.locals.user && event.request.method === 'POST') {
		const match = rateLimitRoutes.find((r) => slug === r.path);
		if (match && !hasGlobalPermission(event.locals.user, 'edit_admin')) {
			const key = `rate:${event.locals.user.userId}:${match.tier}`;
			const result = checkRateLimit(key, rateLimitTiers[match.tier]);
			if (!result.allowed) {
				return new Response(
					JSON.stringify({
						error: 'Rate limit exceeded',
						retryAfterMs: result.retryAfterMs,
					}),
					{
						status: 429,
						headers: { 'Content-Type': 'application/json' },
					}
				);
			}
		}
	}

	const response = await resolve(event);
	return response;
};

/**
 * Resolve the active workspace for a user
 * Priority: Cookie -> DB preference -> null (needs selection)
 */
async function resolveActiveWorkspace(
	userId: string,
	cookies: { get: (name: string) => string | undefined }
): Promise<string | null> {
	// 1. Check cookie first
	const cookieWorkspaceId = cookies.get('activeWorkspaceId');

	if (cookieWorkspaceId) {
		// Verify user still has access to this workspace
		const role = await hasWorkspaceAccess(userId, cookieWorkspaceId);
		if (role) {
			return cookieWorkspaceId;
		}
		// Cookie is stale - workspace no longer accessible
	}

	// 2. Check DB preference
	const preferredWorkspaceId = await getPreferredWorkspaceId(userId);
	if (preferredWorkspaceId) {
		const role = await hasWorkspaceAccess(userId, preferredWorkspaceId);
		if (role) {
			return preferredWorkspaceId;
		}
		// Preferred workspace no longer accessible - will need to select a new one
	}

	// 3. Check if user has exactly one workspace (auto-select)
	const workspacesResult = await getUserWorkspaces(userId);
	if (workspacesResult.status === 'success' && workspacesResult.data?.length === 1) {
		return workspacesResult.data[0].workspaceId;
	}

	// 4. User needs to select a workspace
	return null;
}

// // ANATOMY OF HOOK
// export const handle = async ({ event, resolve }) => {
//     // part 1
//     // request hits server
//     // no response generated yet

//     // part 2
//     // render route and generate response
//     const response = await resolve(event)

//     // step 3
//     // response has been generated
// }
