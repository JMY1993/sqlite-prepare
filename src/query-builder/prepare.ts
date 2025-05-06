/// <reference types="../types/worker-types" />
import { build } from './build';

/**
 * Prepares a SQL query with parameterized values for D1 database
 * 
 * @param db - The D1 database instance
 * @param strings - SQL query string with placeholders or template strings array
 * @param values - Values to interpolate into the query
 * @returns A D1PreparedStatement object
 * 
 * @example
 * // Using a template literal
 * const userId = 123;
 * const stmt = prepare(db, `SELECT * FROM users WHERE id = ?`, userId);
 * 
 * @example
 * // Using template literals
 * const userId = 123;
 * const stmt = prepare(db, `SELECT * FROM users WHERE id = ${userId}`);
 */
export function prepare(db: D1Database, strings: string | TemplateStringsArray, ...values: any[]): D1PreparedStatement {
    const q = build(strings, ...values);
    return db.prepare(q.query).bind(...(q.params));
} 

export const pp = prepare;