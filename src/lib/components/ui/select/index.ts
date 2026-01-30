import { Select as SelectPrimitive } from 'bits-ui';

import Select from './select.svelte';
import SelectContent from './select-content.svelte';
import SelectItem from './select-item.svelte';
import SelectLabel from './select-label.svelte';
import SelectSeparator from './select-separator.svelte';
import SelectTrigger from './select-trigger.svelte';
import SelectValue from './select-value.svelte';

const SelectGroup = SelectPrimitive.Group;

export {
	SelectContent as Content,
	SelectGroup as Group,
	SelectItem as Item,
	SelectLabel as Label,
	//
	Select as Root,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
	SelectSeparator as Separator,
	SelectTrigger as Trigger,
	SelectValue as Value,
};
