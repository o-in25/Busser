<script>
  import { Button, ButtonGroup, Dropzone, Fileupload, Input, InputAddon, Label } from 'flowbite-svelte';
    import { EyeSlashOutline } from 'flowbite-svelte-icons';

  export let value = [];
  const dropHandle = (event) => {
    value = [];
    event.preventDefault();
    if (event.dataTransfer.items) {
      [...event.dataTransfer.items].forEach((item, i) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          value.push(file.name);
          value = value;
        }
      });
    } else {
      [...event.dataTransfer.files].forEach((file, i) => {
        value = file.name;
      });
    }
  };

  const handleChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      value.push(files[0].name);
      value = ['https://storage.googleapis.com/busser/W18QbHL.jpeg'];
    }
  };

  const showFiles = (files) => {
    if (files.length === 1) return files[0];
    let concat = '';
    files.map((file) => {
      concat += file;
      concat += ',';
      concat += ' ';
    });

    if (concat.length > 40) concat = concat.slice(0, 40);
    concat += '...';
    return concat;
  };
</script>

<div>
  <Label for="abv" class="mb-2">Image</Label>
  <div class="mb-4">
    <Fileupload id="larg_size" class="mb-2" placeholder="123" />
  </div>
  <div class="mb-4">
      <ButtonGroup class="w-full">
    <InputAddon>
      <button>
          <EyeSlashOutline class="w-6 h-6" />
      </button>
    </InputAddon>
    <Input id="show-password1" placeholder="Your password here" />
  </ButtonGroup>
  </div>

  <div class="bg-gray-700 rounded p-4">
    <img src="https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg" class="object-scale-down h-48 w-96 m-auto"/>
  </div>
</div>