<script lang="ts">
  import UserManagement from "$lib/components/UserManagement.svelte";
  import { Tabs, TabItem, Label, Button, Heading } from "flowbite-svelte";
  import {
    UsersOutline,
    GridSolid,
    AdjustmentsVerticalSolid,
    ClipboardSolid,
    PlusOutline,
  } from "flowbite-svelte-icons";
  import { DarkMode } from "flowbite-svelte";
  import { Toggle } from "flowbite-svelte";

  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<Tabs tabStyle="underline">
  <TabItem open>
    <div slot="title" class="flex items-center gap-2">
      <AdjustmentsVerticalSolid size="md" />General
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400">
      <Heading tag="h4" class="mb-4 flex flex-row justify-between">General Settings</Heading>
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
    <UserManagement users={data?.users || []}></UserManagement>
  </TabItem>
</Tabs>
