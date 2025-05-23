import type { QueryResult, SelectOption } from "$lib/types";
import type { Permission, Role, User } from "$lib/types/auth";
import { hashPassword } from "./auth";
import { marshal, marshalToType } from "./core";
import { DbProvider } from "./db";

const db = new DbProvider('user_t');

export async function getUsers() {
  try {
    let users = await db.table<User>('user');
    users = users.map(user => Object.assign({}, user));
    return users;
  } catch(error: any) {
    console.error(error);
    return [];
  }
}

export async function addUser(username: string, email: string, password: string, roleIds: string[]) {
  try {
    const hashedPassword = await hashPassword(password);
    const result = await db.query.transaction(async (trx) => {

      await trx('user').insert({
        username,
        email,
        password: hashedPassword
      });

      let dbResult: any = await trx('user').select('userId').where({
        username,
        email,
        password: hashedPassword
      }).first();

      const user: Partial<User> = marshalToType<Partial<User>>(dbResult);
      if(!user.userId) throw new Error('Could not create user.');

      const userRole: {
        userId: string,
        roleId: string;
      }[] = roleIds.map(roleId => ({ userId: user.userId || '', roleId }));

      dbResult = await trx('userRole').insert(userRole);

      // dbResult = await trx('role').select('roleId').whereIn('roleId', roleIds);
      // if(!dbResult) throw new Error('Could not get role IDs.');

      // const roles = marshalToType<string[]>(dbResult);

    });
  } catch(error) {
    console.error(error);
    return null;
  }
}

export async function editUser(userId: string, username: string, email: string, roleIds: string[] = []): Promise<QueryResult<User>> {
  console.log(roleIds);
  try {
    const user: User = await db.query.transaction(async (trx) => {
      let dbResult: any = await db
        .table('user')
        .where({ userId })
        .update({
          username, email,
        });

      if(roleIds.length) {
        dbResult = await db
          .table('userRole')
          .where({ userId })
          .del();


        let subquery: any[] = roleIds.map(roleId => ({
          userId,
          roleId
        }));

        dbResult = await db
          .table('userRole')
          .insert(subquery);
      }

      const queryResult = await getUser(userId);
      if(queryResult.status !== 'success') throw new Error(queryResult.error);
      return queryResult.data as User;
    });

    return {
      status: 'success',
      data: user
    };

  } catch(error: any) {
    console.error(error);
    return {
      status: 'error',
      error: error.message
    };
  }
}

export async function deleteUser(userId: string, currentUserId: string) {
  let response = {};
  try {
    if(userId === currentUserId) {
      throw new Error('Invalid user ID to delete.');
    }
    const result = await db
      .table('user')
      .where({ userId })
      .del();
    if(result !== 1) {
      response = { error: 'Returned unexpected number of rows.' };
    }
  } catch(error: any) {
    console.error(error);
    response = { error: error.message || 'An error occurred.' };

  } finally {
    const refresh = await getUsers() || [];
    response = { ...response, refresh };
  }
  return response;
}

export async function roleSelect(): Promise<SelectOption[]> {
  try {
    let result = await db
      .table("role")
      .select();
    let roles: Role[] = marshalToType<Role[]>(result);
    let selectOptions: SelectOption[] = roles.map(
      ({ roleId, roleName }) => ({
        name: roleName,
        value: roleId,
      }),
    );
    return selectOptions;
  } catch(error: any) {
    console.error(error);
    return [];
  }
}

export async function getUser(userId: string): Promise<QueryResult<User>> {
  try {
    const user: User = await db.query.transaction(async (trx) => {
      let dbResult: any;
      // get user
      dbResult = await trx('user')
        .select('userId', 'email', 'username', 'lastActivityDate')
        .first()
        .where({ userId });

      let user = marshalToType<User>(dbResult);
      if(!user.userId) throw new Error('User not found.');

      // get role ids
      dbResult = await trx("userRole")
        .select('roleId')
        .where({ userId });

      let roleIds: any[] = marshal(dbResult);
      roleIds = roleIds.map(({ roleId }) => (roleId));

      // get roles from ids
      dbResult = await trx('role')
        .select()
        .whereIn('roleId', roleIds);
      const roles: Role[] = marshalToType<Role[]>(dbResult);

      // get permissions ids
      dbResult = await trx('rolePermission')
        .select('permissionId')
        .whereIn('roleId', roleIds);
      let permissionIds: any[] = marshal(dbResult);
      permissionIds = permissionIds.map(({ permissionId }) => (permissionId));

      // get permissions from ids
      dbResult = await trx('permission')
        .select()
        .whereIn('permissionId', permissionIds);
      const permissions: Permission[] = marshalToType<Permission[]>(dbResult);

      user = { ...user, roles, permissions };
      return user;
    });

    return {
      status: 'success',
      data: user
    };

  } catch(error: any) {
    console.error(error);
    return {
      status: 'error',
      error: error.message
    };
  }
}