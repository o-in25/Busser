import type { SelectOption } from '$lib/types';

// drives the stacked product/category creation sheets launched from a SearchableSelect "+".
// provided once via setContext at the form root, consumed by any SearchableSelect.

export type NestedCreateKind = 'product' | 'category';

export interface NestedRequest {
	id: number;
	kind: NestedCreateKind;
	prefillName?: string;
	resolve: (created: SelectOption | null) => void;
}

export class NestedCreateStack {
	stack = $state<NestedRequest[]>([]);
	#nextId = 0;

	get top(): NestedRequest | null {
		return this.stack.at(-1) ?? null;
	}

	// push a create request and resolve when the sheet completes (entity) or cancels (null)
	open(req: { kind: NestedCreateKind; prefillName?: string }): Promise<SelectOption | null> {
		const id = this.#nextId++;
		return new Promise((resolve) => {
			this.stack = [...this.stack, { ...req, id, resolve }];
		});
	}

	// resolve a specific request by id; idempotent so an unmount-triggered close can't double-pop
	complete(id: number, created: SelectOption | null) {
		const req = this.stack.find((r) => r.id === id);
		if (!req) return;
		this.stack = this.stack.filter((r) => r.id !== id);
		req.resolve(created);
	}
}

export const NESTED_CREATE_KEY = Symbol('nestedCreate');
