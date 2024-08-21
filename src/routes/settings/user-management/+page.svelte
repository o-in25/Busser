<script lang="ts">
  import UserTable from "$lib/components/UserTable.svelte";
import type { PageData } from "./$types";
  import { Tabs, TabItem, Heading, A } from "flowbite-svelte";
  import { UsersOutline, AdjustmentsVerticalSolid } from "flowbite-svelte-icons";
  export let data: PageData;
</script>

<Tabs tabStyle="underline">
  <A href="/settings">
    <TabItem>
      <div slot="title" class="flex items-center gap-2">
        <AdjustmentsVerticalSolid size="md" />General
      </div>
    </TabItem>
  </A>
  <TabItem open>
    <div slot="title" class="flex items-center gap-2">
      <UsersOutline size="md" />Users
    </div>
  </TabItem>
</Tabs>
<div class="text-sm text-gray-500 dark:text-gray-400">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between">
    User Management 
  </Heading>
  <div class="flex justify-left items-center">
    <!-- content -->
    <UserTable users={data.users}></UserTable>
  </div>
</div>