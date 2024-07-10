import type { User } from "$lib/types";
import { hashPassword } from "./auth";
import { Connection } from "./connection";

export async function addUser(user: User, password: string) {
  try {
    const client = await Connection.getClient();
    // const result = await client.collection("users ").insertOne({
    //   ...user,
    //   password: hashPassword(password)
    // });

    // console.log(result);
    // return { rows: result?.length || 0 };
  } catch(error) {
    console.error(error);
    return null;
  }
}