<script lang="ts">
  import { Calendar as CalendarPrimitive } from "bits-ui";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { cn } from "$lib/utils";
  import { buttonVariants } from "$lib/components/ui/button";
  import type { DateValue } from "@internationalized/date";

  type Props = {
    type?: "single";
    value?: DateValue | undefined;
    placeholder?: DateValue | undefined;
    minValue?: DateValue | undefined;
    maxValue?: DateValue | undefined;
    weekdayFormat?: "narrow" | "short" | "long";
    initialFocus?: boolean;
    class?: string;
    onValueChange?: (value: DateValue | undefined) => void;
  };

  let {
    type = "single",
    value = $bindable(),
    placeholder = $bindable(),
    minValue,
    maxValue,
    weekdayFormat = "short",
    initialFocus = false,
    class: className,
    onValueChange,
  }: Props = $props();
</script>

<CalendarPrimitive.Root
  {type}
  bind:value
  bind:placeholder
  {minValue}
  {maxValue}
  {weekdayFormat}
  {initialFocus}
  {onValueChange}
  class={cn("p-3", className)}
>
  {#snippet children({ months, weekdays })}
    <CalendarPrimitive.Header class="relative flex w-full items-center justify-between pt-1">
      <CalendarPrimitive.PrevButton
        class={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
      >
        <ChevronLeft class="h-4 w-4" />
      </CalendarPrimitive.PrevButton>
      <CalendarPrimitive.Heading class="text-sm font-medium" />
      <CalendarPrimitive.NextButton
        class={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
      >
        <ChevronRight class="h-4 w-4" />
      </CalendarPrimitive.NextButton>
    </CalendarPrimitive.Header>
    <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
      {#each months as month}
        <CalendarPrimitive.Grid class="w-full border-collapse space-y-1">
          <CalendarPrimitive.GridHead>
            <CalendarPrimitive.GridRow class="flex">
              {#each weekdays as weekday}
                <CalendarPrimitive.HeadCell
                  class="w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground"
                >
                  {weekday.slice(0, 2)}
                </CalendarPrimitive.HeadCell>
              {/each}
            </CalendarPrimitive.GridRow>
          </CalendarPrimitive.GridHead>
          <CalendarPrimitive.GridBody>
            {#each month.weeks as weekDates}
              <CalendarPrimitive.GridRow class="mt-2 flex w-full">
                {#each weekDates as date}
                  <CalendarPrimitive.Cell {date} month={month.value} class="relative p-0 text-center text-sm">
                    <CalendarPrimitive.Day
                      class={cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-9 w-9 p-0 font-normal",
                        "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:opacity-100",
                        "data-[today]:bg-accent data-[today]:text-accent-foreground",
                        "data-[outside-month]:text-muted-foreground/40 data-[outside-month]:pointer-events-none",
                        "data-[disabled]:text-muted-foreground data-[disabled]:opacity-50",
                        "data-[unavailable]:text-destructive-foreground data-[unavailable]:line-through",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:ring-ring focus-visible:ring-offset-2"
                      )}
                    />
                  </CalendarPrimitive.Cell>
                {/each}
              </CalendarPrimitive.GridRow>
            {/each}
          </CalendarPrimitive.GridBody>
        </CalendarPrimitive.Grid>
      {/each}
    </div>
  {/snippet}
</CalendarPrimitive.Root>
