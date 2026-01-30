import { Popover as PopoverPrimitive } from 'bits-ui';

import Popover from './popover.svelte';
import PopoverContent from './popover-content.svelte';
import PopoverTrigger from './popover-trigger.svelte';

const PopoverClose = PopoverPrimitive.Close;

export {
	PopoverClose as Close,
	PopoverContent as Content,
	Popover,
	PopoverClose,
	PopoverContent,
	PopoverTrigger,
	//
	Popover as Root,
	PopoverTrigger as Trigger,
};
