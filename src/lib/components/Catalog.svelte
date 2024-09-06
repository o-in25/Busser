<script>
  // @ts-nocheck

  import FancyButton from "$lib/components/FancyButton.svelte";

  import {
    Card,
    Listgroup,
    Avatar,
    ListgroupItem,
    Button,
    Heading,
    Rating,
    Input,
    Label,
  } from "flowbite-svelte";
  import { SearchOutline, PlusOutline } from "flowbite-svelte-icons";
  let list = [
    {
      img: {
        src: "https://storage.googleapis.com/busser/IMG_5139.JPEG-0724202448",
        alt: "Neil Sims",
      },
      name: "Neil Sims",
      email: "email@windster.com",
      value: "$320",
    },
    {
      img: {
        src: "https://storage.googleapis.com/busser/IMG_5139.JPEG-0724202448",
        alt: "Neil Sims",
      },
      name: "Bonnie Green",
      email: "email@windster.com",
      value: "$3467",
    },
    {
      img: {
        src: "https://storage.googleapis.com/busser/IMG_5139.JPEG-0724202448",
        alt: "Neil Sims",
      },
      name: "Michael Gough",
      email: "email@windster.com",
      value: "$67",
    },
  ];

  const folksLetsTest = () => {
    list = list.slice(0, list.length - 1);
  };

  const handleInput = () => {}
</script>

<div class="mt-5">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between">Catalog</Heading>
</div>
<div class="px-4 py-2 md:py-4">
  <div class="flex justify-between">
    <Label class="space-y-2 mb-6">
      <Input
        type="email"
        size="md"
        placeholder="Search inventory..."
        on:keydown={handleInput}>
        <SearchOutline slot="left" class="w-5 h-5" />
      </Input>
    </Label>
    <div class="test">
      <FancyButton href="/inventory/add"><PlusOutline /></FancyButton>
    </div>
  </div>
  <Card padding="xl" size="xl">
    <!-- search -->

    <Listgroup items={list} let:item class="border-0 dark:!bg-transparent">
      <ListgroupItem active href="/">
        <div class="flex items-center space-x-4 rtl:space-x-reverse">
          <Avatar src={item.img.src} alt={item.img.alt} class="flex-shrink-1" />
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium text-gray-900 truncate dark:text-white">
              {item.name}
            </p>
            <p class="text-sm text-gray-500 truncate dark:text-gray-400">
              {item.email}
            </p>
          </div>
          <Rating id="example-3" total={5} rating={3.4}>
            <!-- <p slot="text" class="ms-2 text-sm font-medium text-gray-500 dark:text-gray-400">3.4 out of 5</p> -->
          </Rating>
        </div>
      </ListgroupItem>
    </Listgroup>
  </Card>
</div>
