import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { login, verifyToken, getUserWorkspaces, hasWorkspaceAccess } from '$lib/server/auth';
import { getPreferredWorkspaceId } from '$lib/server/user';
import { StatusCodes } from 'http-status-codes';
import { dev } from '$app/environment';
import type { QueryResult } from '$lib/types';


export const load = (async ({ locals, url }) => {
  if(locals.user?.userId) {
    return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
  }
  return {
    passwordReset: url.searchParams.get('passwordReset') === 'true'
  };
}) satisfies PageServerLoad;



export const actions = {
  default: async ({ request, cookies, locals }) => {
    const formData: any = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    let errors = {
      username: {
        hasError: false,
        message: '',
      },
      email: {
        hasError: false,
        message: '',
      },
      password: {
        hasError: false,
        message: '',
      },
      passwordConfirm: {
        hasError: false,
        message: '',
      },
    };


    if(!username) {
      errors = {
        ...errors, username: {
          hasError: true,
          message: 'Invalid username.'
        }
      };
    }

    if(!password) {
      errors = {
        ...errors, password: {
          hasError: true,
          message: 'Invalid password.'
        }
      };
    }


    if(errors.username.hasError || errors.password.hasError) {

      return fail(StatusCodes.BAD_REQUEST, {
        errors
      });
    }


    const queryResult = await login(username, password);

    // Check if user needs verification
    if('needsVerification' in queryResult && queryResult.needsVerification) {
      return fail(StatusCodes.BAD_REQUEST, {
        error: 'error' in queryResult ? queryResult.error : 'Email verification required.',
        needsVerification: true,
        email: queryResult.email
      });
    }

    if('data' in queryResult && queryResult.data?.length) {

      // TODO: include the permission
      // info by signing it to a jwt and
      // decoding in in auth.js
      const userToken: string = queryResult.data;

      cookies.set('userToken', userToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: !dev,
        maxAge: 60 * 60 * 24 * 7
      });

      // Check if user needs to select a workspace
      const decoded = await verifyToken(userToken);
      if (decoded && decoded.userId) {
        const userId = decoded.userId;

        // Check for preferred workspace
        const preferredWorkspaceId = await getPreferredWorkspaceId(userId);
        if (preferredWorkspaceId) {
          const role = await hasWorkspaceAccess(userId, preferredWorkspaceId);
          if (role) {
            // User has a valid preferred workspace - set cookie and go home
            cookies.set('activeWorkspaceId', preferredWorkspaceId, {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: !dev,
              maxAge: 60 * 60 * 24 * 365
            });
            return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
          }
        }

        // Check if user has exactly one workspace (auto-select)
        const workspacesResult = await getUserWorkspaces(userId);
        if (workspacesResult.status === 'success' && workspacesResult.data) {
          if (workspacesResult.data.length === 1) {
            // Auto-select single workspace
            const workspace = workspacesResult.data[0];
            cookies.set('activeWorkspaceId', workspace.workspaceId, {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: !dev,
              maxAge: 60 * 60 * 24 * 365
            });
            return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
          } else if (workspacesResult.data.length > 1) {
            // User has multiple workspaces - need to select
            return redirect(StatusCodes.TEMPORARY_REDIRECT, '/workspace-selector');
          }
        }
      }

      // Default: go home
      return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
    }


    if('error' in queryResult) {
      return fail(StatusCodes.BAD_REQUEST, {
        error: queryResult.error
      });
    }


  },
} satisfies Actions;