<script>
    import { Label, Fileupload, ButtonGroup, InputAddon, Input} from "flowbite-svelte";
    import placeholder from "$lib/assets/placeholder@2x.jpg";
    import FancyImage from "./FancyImage.svelte";

    export let name = 'image';
    export let signedUrl;
    let files;
  

    $: {
      if(files?.length) {
        const [file] = files;
        const reader = new FileReader();
        reader.onload = ({ target }) => {
          signedUrl = target?.result?.toString() || '';
        }
        reader.readAsDataURL(file)

      }
    }

</script>

<div>
  <Label for={name} class="mb-2">Image</Label>
  <div class="mb-4">
    <Fileupload id={name} {name} class="mb-2" accept="image/*" bind:files={files}/> 
  </div>
  <FancyImage alt="Product Thumbnail" src="{signedUrl || placeholder}" divStyle="bg-gray-700 rounded-lg p-4" imgStyle="object-scale-down h-48 w-96 m-auto"/>
  <!-- <div class="bg-gray-700 rounded-lg p-4">
    <img src="{signedUrl || placeholder}" class="object-scale-down h-48 w-96 m-auto" alt="Product Thumbnail"/>
  </div> -->
</div>