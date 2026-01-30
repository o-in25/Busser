import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

import DropdownMenu from './dropdown-menu.svelte';
import DropdownMenuContent from './dropdown-menu-content.svelte';
import DropdownMenuItem from './dropdown-menu-item.svelte';
import DropdownMenuLabel from './dropdown-menu-label.svelte';
import DropdownMenuSeparator from './dropdown-menu-separator.svelte';
import DropdownMenuTrigger from './dropdown-menu-trigger.svelte';

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export {
	DropdownMenuContent as Content,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuGroup as Group,
	DropdownMenuItem as Item,
	DropdownMenuLabel as Label,
	//
	DropdownMenu as Root,
	DropdownMenuSeparator as Separator,
	DropdownMenuTrigger as Trigger,
};
