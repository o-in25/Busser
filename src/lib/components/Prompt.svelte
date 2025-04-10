<script lang="ts">
	import { Label, ToolbarButton, Spinner, Textarea, Helper } from "flowbite-svelte";
	import { BrainOutline } from "flowbite-svelte-icons";
  
  export let value = "";
  export let label = 'Description';
  export let trigger: string | undefined;
  export let id: string;
  export let name: string;
  export let rows: number = 4;
  export let url: string;

  let showSpinner = false;
  let showHelperText = false;

  const generateText = async () => {
    showSpinner = true;
    try {
      if(!trigger) throw new Error('No valid trigger present.')
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ trigger })
      });
      const { description } = await response.json();
      if(!description) throw new Error('Invalid response generated.')

      value = description;
    } catch(error: any) {
      console.error(error);
      showHelperText = true;

    } finally {
      showSpinner = false;
    }


  }
</script>


<Label for="textarea-id" class="mb-2">{label}</Label>
<div class="mt-4">
  <div class="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
    <ToolbarButton color="dark" class="text-gray-500 dark:text-gray-400" on:click={generateText}>
      {#if showSpinner}
      <Spinner class="w-6 h-6"/>
      {:else}
          <BrainOutline class="w-6 h-6" />
          <span class="sr-only">Generate text</span>
      {/if}
    </ToolbarButton>
    <Textarea {id} {name} {rows} class="mx-4 bg-white dark:bg-gray-800" bind:value={value} disabled={showSpinner}/>
    <!-- <Textarea id="textarea-id" rows="4" name="message" class="h-36"/> -->
  </div>
  {#if showHelperText}
  <Helper class="mt-2" color="red">Could not generate text from prompt.</Helper>
  {/if}
  </div>