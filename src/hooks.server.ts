import { type Handle, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { StatusCodes } from 'http-status-codes';
import micromatch from 'micromatch';

import { authenticate } from '$lib/server/auth';
import { getUserWorkspaces, hasWorkspaceAccess } from '$lib/server/workspace';
import { enforceRateLimit } from '$lib/server/rate-limit';
import { getPreferredWorkspaceId } from '$lib/server/user';

// any user can visit these
const publicRoutes = [
	'/',
	'/login',
	'/logout',
	'/signup',
	'/verify-email/**',
	'/forgot-password',
	'/reset-password/**',
	'/api/mail/user-registration',
	'/api/oauth/**',
	'/catalog/**',
	'/tools/**',
];

// user can see these before they complete their profile
const onboardingRoutes = ['/onboarding', '/logout', '/api/oauth/**'];

// users dont need a workspace to see these
const workspaceExemptRoutes = [
	'/login',
	'/logout',
	'/signup',
	'/verify-email/**',
	'/forgot-password',
	'/reset-password/**',
	'/workspace/select',
	'/onboarding',
	'/settings/**',
	'/api/**',
	'/catalog/**',
	'/tools/**',
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

	// incomplete oauth users go to onboarding
	if (event.locals.user?.needsOnboarding === 1) {
		const isOnboardingAllowed = micromatch.isMatch(slug, onboardingRoutes);
		if (!isOnboardingAllowed) {
			return redirect(StatusCodes.TEMPORARY_REDIRECT, '/onboarding');
		}
	}

	// get workspace when logged in
	if (event.locals.user) {
		const activeWorkspaceId = await resolveActiveWorkspace(event.locals.user.userId, cookies);
		event.locals.activeWorkspaceId = activeWorkspaceId;

		// If no workspace selected and trying to access a route that requires workspace, redirect to selector
		const isWorkspaceExempt = micromatch.isMatch(slug, workspaceExemptRoutes);
		if (!activeWorkspaceId && !isWorkspaceExempt) {
			return redirect(StatusCodes.TEMPORARY_REDIRECT, '/workspace/select');
		}
	}

	const limited = await enforceRateLimit(event);
	if (limited) return limited;

	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	// safari fix
	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

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
