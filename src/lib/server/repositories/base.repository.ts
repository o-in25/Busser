// shared repository utilities
import type { PaginationData } from '$lib/types';
import * as changeCase from 'change-case';
import { DbProvider } from '../db';

// case conversion helpers
export const pascalCase = (str: string) => changeCase.pascalCase(str);
export const camelCase = (str: string) => changeCase.camelCase(str);
export const titleCase = (str: string) => changeCase.capitalCase(str);

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

// recursively converts object keys using provided case function
export const marshal = <T>(obj: any, fn: Function = camelCase): T => {
  if (Array.isArray(obj)) {
    return obj.map((v) => marshal<T>(v, fn)) as T;
  }

  if (obj instanceof Date) {
    return obj as T;
  }

  if (obj && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[fn(key)] = marshal<T>(obj[key], fn);
      return acc;
    }, {} as Record<string, any>) as T;
  }

  return obj as T;
};

// typed version of marshal
export const marshalToType = <T>(obj: any, fn: Function = camelCase): T => {
  if (!obj && typeof obj === 'object') return obj as T;
  if (Array.isArray(obj)) return obj.map((v) => marshal<T>(v, fn)) as T;
  return Object.entries(obj).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [fn(key)]: marshal(value, fn),
    }),
    {} as T
  );
};

// base class for repositories
export abstract class BaseRepository {
  protected db: DbProvider;

  constructor(db: DbProvider) {
    this.db = db;
  }

  protected marshal<T>(data: any, fn: Function = camelCase): T {
    return marshal<T>(data, fn);
  }

  protected marshalToType<T>(data: any, fn: Function = camelCase): T {
    return marshalToType<T>(data, fn);
  }
}
