<script lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from "@internationalized/date";
  import { Calendar } from "$lib/components/ui/calendar";
  import * as Popover from "$lib/components/ui/popover";
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import { CalendarIcon } from "lucide-svelte";
  import type { DateValue } from "@internationalized/date";

  type Props = {
    value?: string;
    name?: string;
    id?: string;
    placeholder?: string;
    disabled?: boolean;
    minValue?: DateValue;
    class?: string;
    onchange?: (value: string) => void;
  };

  let {
    value = $bindable(""),
    name,
    id,
    placeholder = "Pick a date",
    disabled = false,
    minValue,
    class: className,
    onchange,
  }: Props = $props();

  const df = new DateFormatter("en-US", {
    dateStyle: "long",
  });

  let calendarValue = $state<DateValue | undefined>(undefined);
  let open = $state(false);

  // Sync external value to calendar
  $effect(() => {
    if (value) {
      try {
        calendarValue = parseDate(value);
      } catch {
        calendarValue = undefined;
      }
    } else {
      calendarValue = undefined;
    }
  });

  function handleSelect(newValue: DateValue | undefined) {
    if (newValue) {
      const dateString = `${newValue.year}-${String(newValue.month).padStart(2, "0")}-${String(newValue.day).padStart(2, "0")}`;
      value = dateString;
      onchange?.(dateString);
      open = false;
    }
  }

  let displayValue = $derived(
    calendarValue ? df.format(calendarValue.toDate(getLocalTimeZone())) : placeholder
  );
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        variant="outline"
        class={cn(
          "w-full justify-start text-left font-normal",
          !calendarValue && "text-muted-foreground",
          className
        )}
        {disabled}
        {...props}
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {displayValue}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-auto p-0" align="start">
    <Calendar
      type="single"
      value={calendarValue}
      onValueChange={handleSelect}
      {minValue}
      initialFocus
    />
  </Popover.Content>
</Popover.Root>

{#if name}
  <input type="hidden" {name} {id} {value} />
{/if}
