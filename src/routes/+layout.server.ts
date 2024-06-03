// import type { LayoutServerLoad } from './$types';
export function load({ locals }) {
  let { user } = locals;
  user = JSON.parse(JSON.stringify(user));
  return { user };
}