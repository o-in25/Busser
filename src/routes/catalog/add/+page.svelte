<script lang="ts">
    import type { PageData } from './$types';
    
    export let data: PageData;
       let values=[{
       "url": "",
       "name": "",
    }]; 
        
    const addField = () => {
       values = [...values, {url: '', name: ''}]
    };
        
    const removeField = () => {
       values = values.slice(0, values.length-1)
    };
</script>

    {#each values as v, i}
       <div>
          <input id={i + ''} type="text" bind:value={values[i].url} placeholder="url"/>
          <input id={i + ''} type="text" bind:value={values[i].name} placeholder="name"/>
       </div>
    {/each}
{#if values.length >= 2}
   <input type="button" value="Remove" on:click={removeField}>
{/if}
<button on:click|preventDefault={addField}>Add</button>
<button on:click={() => console.log(values)}>Log Me</button>