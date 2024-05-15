<script lang="ts">
  import type { PageData } from "./$types";
  import type { User } from "$lib/types";
  import { Tabs, TabItem, Label, Heading, Button } from "flowbite-svelte";
  import { UsersOutline, AdjustmentsVerticalSolid, PlusOutline } from "flowbite-svelte-icons";
  import { DarkMode } from "flowbite-svelte";
  import UserTable from "$lib/components/UserTable.svelte";
  import UserForm from "$lib/components/UserForm.svelte";

  export let data: PageData;
	let modal: UserForm; 
  let user: User;

  function modalControl({ state, payload }) {
    user = payload?.user || null;
    modal.show();
  }

  // const update = (user: User) => {
  //   user = user;
  //   modal.toggle();
  // }
</script>

<Tabs tabStyle="underline">
  <TabItem open>
    <div slot="title" class="flex items-center gap-2">
      <AdjustmentsVerticalSolid size="md" />General
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400">
      <Heading tag="h4" class="mb-4 flex flex-row justify-between">
        General Settings
      </Heading>
      <div class="flex justify-left items-center">
        <DarkMode
          class="text-primary-500 dark:text-primary-600 border dark:border-gray-800" />
        <Label class="ms-2 text-center">Dark Mode</Label>
      </div>
    </div>
  </TabItem>
  <TabItem>
    <div slot="title" class="flex items-center gap-2">
      <UsersOutline size="md" />Users
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400">
      <Heading tag="h4" class="mb-4 flex flex-row justify-between">
        User Management
        <Button size="xs" class="items-center flex gap-4" on:click={() => modalControl({ state: 'open', payload: null })}>
          <PlusOutline />Add User
        </Button>
      </Heading>
    </div>
    <UserForm bind:this={modal} bind:user={user}></UserForm>
    <UserTable users={data?.users || []} on:modalControl={({ detail }) => modalControl(detail)}></UserTable>
  </TabItem>
</Tabs>
