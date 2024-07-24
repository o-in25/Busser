<script>
    import { Label, Fileupload, ButtonGroup, InputAddon, Input} from "flowbite-svelte";
    import placeholder from "$lib/assets/placeholder@2x.jpg";

    export let name = 'image';

    let signedUrl;
    let files;


    $: {
      if(files?.length) {
        const [file] = files;
        const reader = new FileReader();
        reader.onload = ({ target }) => {
          signedUrl = target?.result || '';
        }
        reader.readAsDataURL(file)

      } else {
        signedUrl = '';
      }
    }
</script>

<div>
  <Label for={name} class="mb-2">Image</Label>
  <div class="mb-4">
    <Fileupload id={name} {name} class="mb-2" accept="image/*" bind:files={files}/> 
  </div>
  <div class="bg-gray-700 rounded p-4">
    <img src="{signedUrl || placeholder}" class="object-scale-down h-48 w-96 m-auto" alt="Product Thumbnail"/>
  </div>
</div>