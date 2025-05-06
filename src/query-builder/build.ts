import { parseValue } from './parseValue';
import { SQLQuery, SQLParam } from './types';

/**
 * Builds a SQL query with parameterized values
 * 
 * @param strings - SQL query string with placeholders or template strings array
 * @param values - Values to interpolate into the query
 * @returns A SQLQuery object with the query string and parameters
 * 
 * @example
 * // Using a template literal
 * const userId = 123;
 * const query = build`SELECT * FROM users WHERE id = ${userId}`;
 * 
 * @example
 * // Using an array for IN clause
 * const roleIds = [1, 2, 3];
 * const query = build`SELECT * FROM users WHERE role_id IN ${roleIds}`;
 * 
 * @example
 * // Using a raw SQL fragment
 * const query = build`SELECT * FROM users WHERE ${raw('created_at > NOW()')}`;
 * 
 * @example
 * // Using a subquery
 * const subquery = build`SELECT id FROM active_users`;
 * const query = build`SELECT * FROM users WHERE id IN ${subquery}`;
 * 
 * @example
 * // Using insert
 * const query = build`${insert(into('users'), { name: 'John', age: 30 })}`;
 */
export function build(strings: string | TemplateStringsArray, ...values: any[]): SQLQuery {
    let query: string;
    let params: SQLParam[] = [];

    // Handle regular string with question marks
    if (typeof strings === 'string') {
        query = strings;
        params = values.map(parseValue).flatMap(v => {
            if (typeof v === 'object' && v !== null) {
                // Handle special SQL types (subquery, fragment, raw)
                if ('__subquery' in v || '__fragment' in v || '__raw' in v) {
                    return v.params || [];
                }
            }
            return [v as SQLParam];
        });
    } else {
        // Handle template literals case
        query = '';

        for (let i = 0; i < strings.length; i++) {
            query += strings[i];

            if (i < values.length) {
                const value = values[i];

                // Check for various formats
                if (Array.isArray(value)) {
                    // Handle arrays for IN clauses
                    if (value.length === 0) {
                        // Empty IN clause is usually a logical error, but can be handled
                        query += '(NULL)';
                    } else {
                        query += '(' + value.map(() => '?').join(', ') + ')';
                        params.push(...value.map(parseValue).flatMap(v => {
                            if (typeof v === 'object' && v !== null) {
                                // Handle special SQL types (subquery, fragment, raw)
                                if ('__subquery' in v || '__fragment' in v || '__raw' in v) {
                                    return v.params || [];
                                }
                            }
                            return [v as SQLParam];
                        }));
                    }
                } else if (value && typeof value === 'object') {
                    // Handle special SQL types
                    if ('__raw' in value || "__fragment" in value) {
                        // Raw SQL
                        query += value.query;
                        if (value.params) {
                            params.push(...value.params);
                        }
                    } else if ('query' in value && 'params' in value) {
                        // Handle nested SQLQuery objects (subqueries)
                        query += '(' + value.query + ')';
                        params.push(...value.params);
                    } else {
                        // Regular object - use parseValue
                        const parsed = parseValue(value);
                        if (typeof parsed === 'object' && parsed !== null) {
                            // Handle special SQL types
                            if ('__raw' in parsed || '__fragment' in parsed || '__subquery' in parsed) {
                                query += parsed.query;
                                if (parsed.params) {
                                    params.push(...parsed.params);
                                }
                            } else {
                                query += '?';
                                params.push(parsed);
                            }
                        } else {
                            query += '?';
                            params.push(parsed);
                        }
                    }
                } else {
                    // Regular value
                    query += '?';
                    params.push(parseValue(value) as SQLParam);
                }
            }
        }
    }

    return { query, params };
}