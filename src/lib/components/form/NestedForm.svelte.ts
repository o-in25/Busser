// svelte 5 state management
import type { SelectOption } from '$lib/types';

export const NESTED_FORM_KEY = Symbol('nestedForm');
export type NestedFormKind = 'product' | 'category';

export interface NestedFormRequest {
	id: number;
	kind: NestedFormKind;
	prefillName?: string;
	resolve: (created: SelectOption | null) => void;
}

export class NestedFormStack {
	stack = $state<NestedFormRequest[]>([]);
	#nextId = 0;

	get top(): NestedFormRequest | null {
		return this.stack.at(-1) ?? null;
	}

	open(req: { kind: NestedFormKind; prefillName?: string }): Promise<SelectOption | null> {
		const id = this.#nextId++;
		return new Promise((resolve) => {
			this.stack = [...this.stack, { ...req, id, resolve }];
		});
	}

	complete(id: number, created: SelectOption | null) {
		const req = this.stack.find((r) => r.id === id);
		if (!req) return;
		this.stack = this.stack.filter((r) => r.id !== id);
		req.resolve(created);
	}
}
