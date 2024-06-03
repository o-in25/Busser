import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ locals }) => {
  console.log(locals);
  let { user } = locals;
  user = JSON.parse(JSON.stringify(user));
  return { user };
};