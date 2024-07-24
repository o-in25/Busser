<script>
    import { Label, Fileupload, ButtonGroup, InputAddon, Input} from "flowbite-svelte";
    import { EyeSlashOutline } from "flowbite-svelte-icons";
    import placeholder from "$lib/assets/placeholder@2x.jpg";

    let signedUrl;
    let files;

    $: {
      if(files?.length) {
        signedUrl = getSignedUrl();

      } else {
        signedUrl = '';
      }
    }

    const getSignedUrl = () => 'https://images.immediate.co.uk/production/volatile/sites/30/2023/04/Strawberry-Marg-c985252.jpg'

    const handleInput = () => {
      signedUrl = getSignedUrl();
    }
</script>

<div>
  <Label for="image" class="mb-2">Image</Label>
  <div class="mb-4">
    <Fileupload id="image" class="mb-2" placeholder="123" bind:files={files}/> 
  </div>


  <div class="bg-gray-700 rounded p-4">
    <!-- svelte-ignore a11y-img-redundant-alt -->
    <img src="{signedUrl || placeholder}" class="object-scale-down h-48 w-96 m-auto" alt="Image"/>
  </div>
</div>