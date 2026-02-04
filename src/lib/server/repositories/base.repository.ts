// shared repository utilities
import { capitalCase } from 'change-case';

import type { PaginationData } from '$lib/types';

import { DbProvider } from '../db';

// case conversion helpers
export const titleCase = (str: string) => capitalCase(str);

// default pagination for error cases
export const emptyPagination: PaginationData = {
	total: 0,
	currentPage: 0,
	perPage: 0,
	from: 0,
	to: 0,
	lastPage: 0,
	prevPage: 0,
	nextPage: 0,
};

// base class for repositories
export abstract class BaseRepository {
	protected db: DbProvider;

	constructor(db: DbProvider) {
		this.db = db;
	}
}
