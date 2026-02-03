import { fail, redirect } from "@sveltejs/kit";
import { StatusCodes } from "http-status-codes";
import moment from "moment";

import { getWorkspaceInfo } from "$lib/server/auth";
import {
  acceptWorkspaceInvitation,
  deleteInvitation,
  getInvitationByCode,
} from "$lib/server/user";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get("code");

  if (!code) {
    return {
      error: "No invitation code provided.",
      invitation: null,
      workspace: null,
    };
  }

  // look up the invitation
  const invitationResult = await getInvitationByCode(code);

  if (invitationResult.status === "error" || !invitationResult.data) {
    return {
      error: "Invitation not found or has expired.",
      invitation: null,
      workspace: null,
    };
  }

  const invitation = invitationResult.data;

  // check if already used
  if (invitation.userId !== null) {
    return {
      error: "This invitation has already been used.",
      invitation: null,
      workspace: null,
    };
  }

  // check if expired
  if (invitation.expiresAt && moment().isAfter(moment(invitation.expiresAt))) {
    return {
      error: "This invitation has expired.",
      invitation: null,
      workspace: null,
    };
  }

  // check if this is a workspace invitation
  if (!invitation.workspaceId || !invitation.workspaceRole) {
    // this is a system invitation for signup, redirect to signup
    redirect(StatusCodes.TEMPORARY_REDIRECT, `/signup?code=${code}`);
  }

  // get workspace info
  const workspaceResult = await getWorkspaceInfo(invitation.workspaceId);

  if (workspaceResult.status === "error" || !workspaceResult.data) {
    return {
      error: "The workspace for this invitation no longer exists.",
      invitation: null,
      workspace: null,
    };
  }

  // if user is not logged in, redirect to login
  if (!locals.user) {
    const returnUrl = encodeURIComponent(`/accept-invite?code=${code}`);
    redirect(StatusCodes.TEMPORARY_REDIRECT, `/login?redirect=${returnUrl}`);
  }

  // check if email matches (if invitation has specific email)
  if (
    invitation.email &&
    invitation.email.toLowerCase() !== locals.user.email.toLowerCase()
  ) {
    return {
      error: `This invitation was sent to ${invitation.email}. Please log in with that email address.`,
      invitation: null,
      workspace: null,
    };
  }

  return {
    error: null,
    invitation: {
      invitationCode: invitation.invitationCode,
      workspaceRole: invitation.workspaceRole,
      email: invitation.email,
    },
    workspace: {
      workspaceId: workspaceResult.data.workspaceId,
      workspaceName: workspaceResult.data.workspaceName,
    },
    user: {
      username: locals.user.username,
      email: locals.user.email,
    },
  };
};

export const actions: Actions = {
  accept: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(StatusCodes.UNAUTHORIZED, {
        error: "You must be logged in to accept an invitation.",
      });
    }

    const formData = await request.formData();
    const code = formData.get("code")?.toString();

    if (!code) {
      return fail(StatusCodes.BAD_REQUEST, {
        error: "Invitation code is required.",
      });
    }

    const result = await acceptWorkspaceInvitation(code, locals.user.userId);

    if (result.status === "error") {
      return fail(StatusCodes.BAD_REQUEST, { error: result.error });
    }

    // redirect to the workspace
    redirect(
      StatusCodes.SEE_OTHER,
      `/recipes?workspace=${result.data?.workspaceId}`,
    );
  },

  decline: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(StatusCodes.UNAUTHORIZED, {
        error: "You must be logged in to decline an invitation.",
      });
    }

    const formData = await request.formData();
    const code = formData.get("code")?.toString();

    if (!code) {
      return fail(StatusCodes.BAD_REQUEST, {
        error: "Invitation code is required.",
      });
    }

    // get the invitation to delete it
    const invitationResult = await getInvitationByCode(code);

    if (invitationResult.status === "success" && invitationResult.data) {
      await deleteInvitation(invitationResult.data.invitationId);
    }

    // redirect to home
    redirect(StatusCodes.SEE_OTHER, "/");
  },
};
