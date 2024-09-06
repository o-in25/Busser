<script>
	import { Label, Button, Select, Heading, Input} from "flowbite-svelte";

  let selections = [
    { 
      value: 'lime', 
      name: 'Lime Juice', 
      weights: [
        { key: 'citricAcidWgt', weight: 0.66 },
        { key: 'malicAcidWgt', weight: 0.33 },
        { key: 'msgWgt', weight: 0 },
        { key: 'waterWgt', weight: 16.66 }
      ]    
    },
    { 
      value: 'lemon', 
      name: 'Lemon Juice',
      weights: [
        { key: 'citricAcidWgt', weight: 1 },
        { key: 'malicAcidWgt', weight: 0 },
        { key: 'msgWgt', weight: 0 },
        { key: 'waterWgt', weight: 16.66 }
      ]   
    },
    { 
      value: 'orange', 
      name: 'Orange Juice',
      weights: [
        { key: 'citricAcidWgt', weight: 0.9 },
        { key: 'malicAcidWgt', weight: 0.1 },
        { key: 'msgWgt', weight: 0 },
        { key: 'waterWgt', weight: 16.66 }
      ]   
    },
    { 
      value: 'grapefruit', 
      name: 'Grapefruit Juice',
      weights: [
        { key: 'citricAcidWgt', weight: 0.8 },
        { key: 'malicAcidWgt', weight: 0.2 },
        { key: 'msgWgt', weight: 0.033 },
        { key: 'waterWgt', weight: 16.66 }
      ]   
    }
  ]

  let fields = {
    juiceType: {
      value: 'lime',
      enabled: true
    },
    initialWgt: {
      value: 0.00,
      enabled: true
    },
    citricAcidWgt: {
      value: 0.00,
      enabled: true
    },
    malicAcidWgt: {
      value: 0.00,
      enabled: true
    },
    msgWgt: {
      value: 0.00,
      enabled: false
    },
    waterWgt: {
      value: 0.00,
      enabled: true
    }
  }

  const calculate = () => {
    const { weights } = selections.find(({ value }) => value === fields.juiceType.value) || {};
    weights?.forEach(({ key, weight }, i) => {
      fields[key].enabled = weight === 0;
      let value = fields.initialWgt.value * weight;
      value = i === weights.length - 1 ? value / 250 : value;
      fields[key].value = value.toFixed(2)
    });
  }

</script>
<Heading tag="h6" class="mb-4">Super Juice Calculator</Heading>
<form>
  <div class="flex gap-4 mb-6">
  <div class="flex-1">
    <Label for="input-addon" class="mb-2">Peel Weight</Label>
    <Input id="input-addon" type="number" let:props required>
      <input
        id="input-addon"
        type="number"
        placeholder=""
        {...props}
        bind:value={fields.initialWgt.value}  />
      <div slot="right" class="font-bold">grams</div></Input>

  </div>
  <div>
  <Label> Juice      
    <Select class="mt-2" items={selections} bind:value={fields.juiceType.value} on:change={calculate}/>
  </Label>
  </div>
</div>

<!-- citric acid -->
<div class="grid gap-4 mb-6 md:grid-cols-2">

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
        bind:value={fields.citricAcidWgt.value} />
      <div slot="right" class="font-bold">grams</div>
    </Input>
  </div>

  <!-- malic acid -->
  <div>
    <Label for="productName" class="mb-2">Malic Acid</Label>
    <Input for="productUnitSizeInMilliliters" 
      let:props 
      bind:disabled={fields.malicAcidWgt.enabled} 
      required
    >
      <input
        id="productUnitSizeInMilliliters"
        name="productUnitSizeInMilliliters"
        type=""
        placeholder=""
        readonly
        {...props}
        bind:value={fields.malicAcidWgt.value} />
      <div slot="right" class="font-bold">grams</div>
    </Input>
  </div>

  <!-- msg -->
  <div>
    <Label for="productName" class="mb-2">MSG</Label>
    <Input for="productUnitSizeInMilliliters" 
      let:props 
      bind:disabled={fields.msgWgt.enabled} 
    >
      <input
        id="productUnitSizeInMilliliters"
        name="productUnitSizeInMilliliters"
        type=""
        placeholder=""
        readonly
        {...props}
        bind:value={fields.msgWgt.value} />
      <div slot="right" class="font-bold">grams</div>
    </Input>
  </div>

    <!-- water -->
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
        bind:value={fields.waterWgt.value}
      />
      <div slot="right" class="font-bold">cups</div>
    </Input>
  </div>

  <div class="mt-4 flex">
    <div class="flex-grow">
      <Button on:click={calculate}>Calculate</Button>
    </div>
  </div>
</div>
</form>