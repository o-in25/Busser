<script>
	import { Label, ButtonGroup, Button, Select, Heading, Input} from "flowbite-svelte";
    let unit = 'g';
    let juice = 'lime';
    

    let initialWeight = 0;
    let weights = [0.66, 0.33, 16.66]

    let isDisabled = false;

    // TODO: should probably build map for this
    const setWeights = ({ target }) => {
      if(target === 'lime') {
        weights = [0.66, 0.33, 16.66];
        isDisabled = false;
      } else if(target === 'lemon') {
        weights = [1, 0.0, 16.66];
        isDisabled = true;
      } else {
        weights = [0.66, 0.33, 16.66];
        isDisabled = false;
      }
    }
    const calculate = () => {
      const newWeights = weights.map(weight => {
        if(weight === 16.66) {
          return Math.ceil((weight * initialWeight) / 250)
        }
        return Math.ceil(weight * initialWeight)
      });
      weights = newWeights;
    }

    let selected = 'lime';
    let countries = [
      { value: 'lime', name: 'Lime Juice' },
      { value: 'lemon', name: 'Lemon Juice' },
      { value: 'grapefruit', name: 'Grapefruit Juice' }
    ];
</script>
<Heading tag="h6" class="mb-4">Super Juice Calculator</Heading>
<form>
  <div class="flex gap-4 mb-6">
  <div class="flex-1">
    <Label for="input-addon" class="mb-2">Weight of Peels (Grams)</Label>
    <ButtonGroup class="w-full">
      <Input id="input-addon" type="number" bind:value={initialWeight}/>
      <Button color="primary" on:click={calculate}>Calculate</Button>
    </ButtonGroup>
  </div>
  <div>
  <Label> Juice      
    <Select class="mt-2" items={countries} bind:value={selected} on:change={setWeights}/>
  </Label>
  </div>
</div>
<div class="grid gap-4 mb-6 md:grid-cols-3">
  <div>
    <Label for="productName" class="mb-2">Citric Acid</Label>
    <Input for="productUnitSizeInMilliliters" let:props required>
      <input
        id="productUnitSizeInMilliliters"
        name="productUnitSizeInMilliliters"
        type=""
        placeholder=""
        readonly
        {...props}
        bind:value={weights[0]} />
      <div slot="right" class="font-bold">grams</div>
    </Input>
  </div>
  <div>
    <Label for="productName" class="mb-2">Malic Acid</Label>
    <Input for="productUnitSizeInMilliliters" let:props bind:disabled={isDisabled} required>
      <input
        id="productUnitSizeInMilliliters"
        name="productUnitSizeInMilliliters"
        type=""
        placeholder=""
        readonly
        {...props}
        bind:value={weights[1]} />
      <div slot="right" class="font-bold">grams</div>
    </Input>
  </div>

  <div>
    <Label for="productName" class="mb-2">Water</Label>
    <Input for="productUnitSizeInMilliliters" let:props required>
      <input
        id="productUnitSizeInMilliliters"
        name="productUnitSizeInMilliliters"
        type=""
        placeholder=""
        readonly
        {...props}
        bind:value={weights[2]} />
      <div slot="right" class="font-bold">cups</div>
    </Input>
  </div>
</div>
</form>