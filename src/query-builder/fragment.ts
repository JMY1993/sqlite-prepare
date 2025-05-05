import { FragmentSQL } from './types';
import { build } from './build';

/**
 * Creates a SQL fragment that will be inserted directly into the query without being wrapped in parentheses
 * Unlike raw(), this maintains parameter safety and query building capabilities
 * 
 * @param strings - SQL query string with placeholders or template strings array
 * @param values - Values to interpolate into the query
 * @returns A FragmentSQL object with the query string and parameters
 * 
 * @example
 * // Using a template literal
 * const columns = fragment`id, name, created_at`;
 * const query = build`SELECT ${columns} FROM users`;
 * 
 * @example
 * // Using with parameters
 * const condition = fragment`status = ${'active'} AND type = ${'user'}`;
 * const query = build`SELECT * FROM users WHERE ${condition}`;
 */
export function fragment(strings: string | TemplateStringsArray, ...values: any[]): FragmentSQL {
    const result = build(strings, ...values);
    return {
        __fragment: true,
        query: result.query,
        params: result.params
    };
}

export const f = fragment; // Alias for convenience