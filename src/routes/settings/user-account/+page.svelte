<script lang="ts">
  import type { PageData } from './$types';
  import { DescriptionList, Heading, List, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import FancyButton from '$lib/components/FancyButton.svelte';
  
  export let data: PageData;

  async function logout() {
    const response = await fetch("/logout", {
      method: "POST",
    });
    if (response.ok) {
      await invalidateAll();
      await goto(`/`);
    }
  } 

  const normalizePermissions = (permissions): any => {
    const validGrants = ['view', 'add', 'edit', 'delete'];

    const result = {};

    permissions.forEach((perm) => {
      const [grant, ...resourceParts] = perm.split('_');
      const resource = resourceParts.join('_');

      if (!validGrants.includes(grant)) return;

      if (!result[resource]) {
        result[resource] = {
          view: false,
          add: false,
          edit: false,
          delete: false
        };
      }

      result[resource][grant] = true;
    });

    return result;
  }

const permissions: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }>  = normalizePermissions(data.user?.permissions || []);
console.log(permissions)
</script>

<div class="text-sm text-gray-500 dark:text-gray-400">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between font-extrabold">
    Account
  </Heading>
</div>
<div class="flex justify-left items-center">
  <List tag="dl" class="text-gray-900 dark:text-white divide-y divide-gray-200  dark:divide-gray-700">
    <div class="flex flex-col pb-3">
      <DescriptionList tag="dt" class="mb-1">Username</DescriptionList>
      <DescriptionList tag="dd">{data.user?.username}</DescriptionList>
    </div>
    <div class="flex flex-col pb-3">
      <DescriptionList tag="dt" class="mb-1">Email address</DescriptionList>
      <DescriptionList tag="dd">{data.user?.email}</DescriptionList>
    </div>
    <div class="flex flex-col pb-3">
      <DescriptionList tag="dt" class="mb-1">Roles</DescriptionList>
      <DescriptionList tag="dd">{data.user?.roles}</DescriptionList>
    </div>
    <div class="flex flex-col pb-3">
      <DescriptionList tag="dt" class="mb-1">Permissions</DescriptionList>
      <DescriptionList tag="dd">
        <Table>
          <TableHead>
            <TableHeadCell>View</TableHeadCell>
            <TableHeadCell>Add</TableHeadCell>
            <TableHeadCell>Edit</TableHeadCell>
            <TableHeadCell>Delete</TableHeadCell>
          </TableHead>
          <TableBody tableBodyClass="divide-y">
            {#each Object.entries(permissions) as [resource, grants]}
            <TableBodyRow>
              <TableBodyCell class="capitalize">{grants.view? resource : '--'}</TableBodyCell>
              <TableBodyCell class="capitalize">{grants.add? resource : '--'}</TableBodyCell>
              <TableBodyCell class="capitalize">{grants.edit? resource : '--'}</TableBodyCell>
              <TableBodyCell class="capitalize">{grants.delete? resource : '--'}</TableBodyCell>
            </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </DescriptionList>
    </div>
  </List>
</div>