import { capitalCase } from 'change-case';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const titleCase = (str: string) => capitalCase(str);

export function fillText(template: string, vars: Record<string, string>): string {
	return template.replace(/{{(\w+)}}/g, (_, key) => vars[key] ?? '');
}

// shadcn-svelte helper: adds a bindable element ref to a component's props
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
	ref?: U | null;
};
