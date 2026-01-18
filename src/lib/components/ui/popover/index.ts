import { Popover as PopoverPrimitive } from "bits-ui";

import Popover from "./popover.svelte";
import PopoverContent from "./popover-content.svelte";
import PopoverTrigger from "./popover-trigger.svelte";

const PopoverClose = PopoverPrimitive.Close;

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  //
  Popover as Root,
  PopoverClose as Close,
  PopoverContent as Content,
  PopoverTrigger as Trigger,
};
