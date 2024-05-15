<script lang="ts">
  import type { PageData } from "./$types";
  import type { User } from "$lib/types";
  import { Tabs, TabItem, Label, Heading, Button, Modal, A } from "flowbite-svelte";
  import { UsersOutline, AdjustmentsVerticalSolid, PlusOutline, UserAddOutline } from "flowbite-svelte-icons";
  import { DarkMode } from "flowbite-svelte";
  import UserTable from "$lib/components/UserTable.svelte";
  import UserForm from "$lib/components/UserForm.svelte";

  export let data: PageData;
  let user: User;
  let modalControl = ({ state, action, payload }) => {
    user = payload?.user || undefined;
    modalState = state === 'open';
    modalAction = action;
  }
  let modalState = false;
  let modalAction = 'add';
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
        <Button size="xs" class="inline-flex rounded-lg shadow-sm float-right" on:click={() => modalControl({ state: 'open', action: 'add', payload: {}})}>
          <UserAddOutline class="w-4 h-4" />
        </Button>
      </Heading>
    </div>
    <UserTable users={data?.users || []} on:modalControl={({ detail }) => modalControl(detail)}/>
    <Modal title="{modalAction === 'edit'? 'Edit User': 'Add New User'}" bind:open={modalState}>
      <UserForm user={user} action={modalAction}/>
    </Modal>
  </TabItem>
</Tabs>
