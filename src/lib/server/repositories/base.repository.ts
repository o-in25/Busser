import { DbProvider } from '../db';

// base class for repositories
export abstract class BaseRepository {
	protected db: DbProvider;

	constructor(db: DbProvider) {
		this.db = db;
	}
}
