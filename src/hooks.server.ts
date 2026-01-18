import { authenticate } from '$lib/server/auth';
import { redirect, type Handle } from "@sveltejs/kit";
import { StatusCodes } from 'http-status-codes';
import micromatch from 'micromatch';

const publicRoutes = [
  '/',
  '/login',
  '/logout',
  '/signup',
  '/verify-email/**'
]


export const handle: Handle = async ({ event, resolve }): Promise<Response> => {
  const { cookies, url } = event;
  const slug = url.pathname;

  // Ignore Chrome DevTools requests
  if (slug.startsWith('/.well-known/')) {
    return new Response(null, { status: 404 });
  }

  const userToken = cookies.get("userToken");

  event.locals.user = await authenticate(userToken);

  const isPublicRoute = micromatch.isMatch(slug, publicRoutes);

  if(!event.locals.user && !isPublicRoute) {
    return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
  }

  const response = await resolve(event);
  return response;

};

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