/**
 * SQLite Prepare - A type-safe SQL query builder for Cloudflare D1
 * 
 * This module provides utilities for building and executing SQL queries with 
 * prepared statements in a type-safe way.
 * 
 * @module sqlite-prepare
 */

/**
 * Export query builder utilities and types
 */
export {
    SQLQuery,
    SQLParam,
    InsertQuery,
    FragmentSQL
} from './query-builder/types';

export { build, b } from "./query-builder/build";

export { raw, r } from "./query-builder/raw";
export { prepare, pp } from "./query-builder/prepare";
export { insert, into, i, it } from "./query-builder/insert";
export { fragment, f } from "./query-builder/fragment";
export { validate, v } from "./query-builder/validate";

export { wrapD1 } from "./d1";