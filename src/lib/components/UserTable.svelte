<script lang="ts">
  import type { User } from "$lib/types";
  import { InfoCircleSolid, UserAddOutline, UserEditOutline, UserRemoveOutline } from "flowbite-svelte-icons";
  import { Alert, Button, ButtonGroup,Modal,
    P,
    Span,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import moment from 'moment';


  // props
  export let users: User[];

  let target: string | undefined = undefined;
  let isOpened = false;
  let result: any = {}

  const deleteUser = async (userId: string): Promise<any> => {
    let response = await fetch(`/api/user/${userId}/delete`, {
      method: 'DELETE',
    });
    response = await response.json();
    return response;
  }

</script>
{#if result.error || result.success}
  <Alert border color="{result.error? 'red' : 'green'}" class="mb-4">
    <InfoCircleSolid slot="icon" class="w-5 h-5" />
    {result.error || result.success}
  </Alert>
{/if}
<Table>
  <TableHead>
    <TableHeadCell>Username</TableHeadCell>
    <TableHeadCell>Email</TableHeadCell>
    <TableHeadCell>Last Activity</TableHeadCell>
    <TableHeadCell>
      <ButtonGroup size="sm" divClass="inline-flex rounded-lg shadow-sm float-right">
        <Button outline color="dark" href="/settings/users/add">
          <UserAddOutline class="w-4 h-4" />
        </Button>
      </ButtonGroup>
    </TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each users as user (user.userId)}
      <TableBodyRow>
        <TableBodyCell>{user.username}</TableBodyCell>
        <TableBodyCell>{user.email}</TableBodyCell>
        <TableBodyCell>{(moment(user.lastActivityDate)).format('DD-MMM-YYYY HH:mm:ss')}</TableBodyCell>
        <TableBodyCell>
          <ButtonGroup size="sm" divClass="inline-flex rounded-lg shadow-sm float-right">
            <Button outline color="dark" href="/settings/users/{user.userId}/edit">
              <UserEditOutline class="w-4 h-4" />
            </Button>
            <Button outline color="dark" on:click={() => {
              isOpened = true;
              target = user.userId;
            }}>
              <UserRemoveOutline class="w-4 h-4" />
            </Button>
          </ButtonGroup>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
<Modal title="Delete User" bind:open={isOpened} autoclose>
  <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
    Delete user <Span>{users.find(({ userId }) => target === userId)?.username}</Span>?
    <P color="text-red-700 dark:text-red-500" weight="bold">Once deleted, this user can't be recovered.</P>
  </p>
  <svelte:fragment slot="footer">
    <Button color="red" on:click={async () => {
      if(target) {
        let { success, error, refresh } = await deleteUser(target);
        result = { success, error }
        users = refresh;
      }
      target = undefined;
    }}>Delete User</Button>
    <Button color="alternative" on:click={() => target = undefined}>Cancel</Button>
  </svelte:fragment>
</Modal>
