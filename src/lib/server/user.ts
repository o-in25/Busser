import type { QueryResult, SelectOption } from "$lib/types";
import { type Permission, type RegistrationToken, type Role, type User, type UserRole } from "$lib/types/auth";
import moment from "moment";
import { hashPassword, signToken } from "./auth";
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

export async function getGrants(roleId: string = ''): Promise<QueryResult<Array<Role & Permission>>> {
  try {
    let query = db.query('user_t.rolePermission as rp')
    .join('user_t.permission as p', 'rp.permissionId', 'p.permissionId')
    .join('user_t.role as r', 'rp.roleId', 'r.roleId')
    if(roleId) {
      query = query.where('r.roleId', roleId)
    }

    const dbResult = await query.select(
      'r.roleName',
      'p.permissionName',
      'rp.roleId',
      'rp.permissionId'
    );


    const grants: Array<Role & Permission> = marshalToType<Array<Role & Permission>>(dbResult)
    return {
      status: 'success',
      data: grants
    };
  } catch(error: any) {
    console.error(error);
    return {
      status: 'error',
      error: error.message
    };
  }
}

export async function updateGrants(roleId: string, permissions: Permission[]): Promise<QueryResult<Array<Role & Permission>>> {
  try {

    await db.query.transaction(async (trx) => {
      let newPermissions: Permission[] = permissions.filter(({ permissionId }) => !permissionId);
      let oldPermissions: Permission[] = permissions.filter(({ permissionId }) => permissionId);
      // insert any new permissions
      if(newPermissions.length) {
                await trx('permission')
          .insert(newPermissions.map(({ permissionName }) => ({ permissionName })))
          .onConflict('permissionName')
          .ignore();

        let dbResult: any = await trx('permission')
          .select('permissionId', 'permissionName')
          .whereIn('permissionName', newPermissions.map(({ permissionName }) =>  permissionName));
        
        const insertedPermissions: Permission[] = marshalToType<Permission[]>(dbResult);
        newPermissions = insertedPermissions;
      }

      oldPermissions = [...oldPermissions, ...newPermissions];

      const rolePermissions = oldPermissions.map(({ permissionId }) => ({
        roleId, permissionId
      }))

      await trx('rolePermission').where({ roleId }).del();
      if(rolePermissions.length) {
        await trx('rolePermission').insert(rolePermissions)
      }
      
    });

    return {
      status:'success',
      data: []
    }
  } catch(error: any) {
    console.error(error);
    return {
      status: 'error',
      error: error.message
    };
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

export async function registerUser(username: string, email: string, password: string): Promise<QueryResult<any>> {

  // step 1: check if user name is taken
  // step 2: set verified = true
  // step 3: set role = VIEWER
  // step 4: add user
  // step 5: add user role
  // step 6: sign jwt
  // step 7: send email
  try {
    await db.query.transaction(async (trx) => {
      // step 1
      let dbResult: any = await trx('user').select('username', 'email').where({ username }).first();
      dbResult = marshal(dbResult); 


      if(dbResult?.username) {
        throw new Error('Username already taken.');
      }

      if(dbResult?.email) {
        throw new Error('Email already taken.');
      }

      const hashedPassword = await hashPassword(password);

      // step 2
      let user: any = {
        username, 
        email, 
        password: hashedPassword,
        verified: false
      }
      let rolePermission: UserRole = {
        userId: "",
        roleId: ""
      };

      dbResult = await trx('user').insert(user);
      dbResult = await trx('user').select('userId').where({
        username,
        email,
        password: hashedPassword
      });

      dbResult = marshal(dbResult); 
      if(!dbResult?.userId) {
        throw new Error('Could not create user.');
      }

      rolePermission.userId = dbResult.userId;

      // step 3
      dbResult = await trx('user').select('roleId').where('roleName', 'VIEWER').first();

      dbResult = marshal(dbResult); 
      if(!dbResult?.roleId) {
        throw new Error('Could not register user for default role.');
      }

      rolePermission.roleId = dbResult.roleId;

      // step 4 + 5
      dbResult = await trx('userRole').insert(rolePermission);


      // step 6
      const token = await signToken<RegistrationToken>({
        userId: rolePermission.userId,
        iat: moment().unix(),
        exp: moment().add(24, 'hours').unix()
      });


      

      

    });

    return {
      status: 'success'
    }
  } catch(error: any) {
    console.error(error);
    return {
      status: 'error',
      error: error.message
    }
  }
}