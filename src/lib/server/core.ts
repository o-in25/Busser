import { DbProvider } from "./db";

const db = new DbProvider('app_t');

export async function getInventory() {
  try {
    let users = await db.table<any>('product');
    users = users.map(user => Object.assign({}, user));
    return users;
  } catch(error: any) {
    console.error(error);
    return [];
  }

}