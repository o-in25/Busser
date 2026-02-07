// shared utility types

export type QueryResult<T = void> =
	| { status: 'success'; data?: T }
	| { status: 'error'; error: string };

export type Result<T> = {
	data?: T;
	error?: Error;
};

// pagination
export type PaginationResult<T> = {
	data: T;
	pagination: PaginationData;
};

export type PaginationData = {
	total: number;
	lastPage: number;
	prevPage: number;
	nextPage: number;
	currentPage: number;
	perPage: number;
	from: number;
	to: number;
	pages?: Page[];
};

export type Page = {
	name: string;
	href: string;
	active: boolean;
};

export type SelectOption = {
	name: string;
	value: string | number;
	// Optional category metadata for product options
	categoryId?: number;
	categoryName?: string;
	parentCategoryId?: number | null;
	parentCategoryName?: string | null;
};

// logging
export enum LogLevel {
	DEBUG = 1,
	INFO = 2,
	WARNING = 3,
	ERROR = 4,
	CRITICAL = 5,
}

export type Log = {
	logLevelId: LogLevel;
	logMessage: string;
	logDate: Date | string;
	logStackTrace: string | null;
};

// ui feedback
export type Notification = {
	success?: Record<'message', string> | null;
	error?: Record<'message', string> | null;
};

export type FormSubmitResult = {
	success?: Record<'message', string>;
	error?: Record<'message', string>;
	args?: unknown;
};

export type ComponentAction = 'add' | 'edit';

export type GallerySeeding = {
	src: string;
	alt?: string;
};
