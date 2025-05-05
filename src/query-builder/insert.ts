import { parseValue } from './parseValue';
import { InsertQuery, SQLParam, FragmentSQL } from './types';

/**
 * Creates a table reference for insert operations
 * @param table - The table name to insert into
 * @returns The table name
 */
export function into(table: string): string {
    return table;
}

/**
 * Creates an insert query for the specified table and values
 * @param table - The table name to insert into
 * @param values - Object containing column-value pairs to insert
 * @returns An InsertQuery object
 * 
 * @example
 * // Basic insert
 * const query = insert(into('users'), { name: 'John', age: 30 });
 * 
 * @example
 * // Using raw SQL for a value
 * const query = insert(into('users'), { created_at: raw('NOW()') });
 * 
 * @example
 * // Using a subquery for a value
 * const subquery = build`SELECT id FROM active_users WHERE status = ${'active'}`;
 * const query = insert(into('users'), { user_id: subquery });
 */
export function insert(table: string, values: Record<string, any>): InsertQuery {
    const parsedValues: Record<string, SQLParam | { __raw: true, query: string } | { __subquery: true, query: string, params: SQLParam[] } | FragmentSQL> = {};
    
    for (const [key, value] of Object.entries(values)) {
        parsedValues[key] = parseValue(value);
    }
    
    return {
        __insert: true,
        table,
        values: parsedValues
    };
} 