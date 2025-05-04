/**
 * Represents valid SQL parameter types that can be used in prepared statements
 */
export type SQLParam =
    | string
    | number
    | boolean
    | null
    | undefined
    | Date
    | Uint8Array
    | ArrayBuffer;

/**
 * Represents a SQL query with prepared statement parameters
 */
export interface SQLQuery {
    /** The SQL query string with parameter placeholders */
    query: string;
    /** The parameters to bind to the prepared statement */
    params: SQLParam[];
}

/**
 * Creates a raw SQL fragment that will be inserted directly into the query without escaping
 * @param value - The raw SQL string to insert
 * @returns An object marking the string as raw SQL
 */
export function raw(value: string): { __raw: true, value: string };
/**
 * Creates a raw SQL fragment using template literals that will be inserted directly into the query
 * @param strings - Template strings array
 * @param values - Values to interpolate into the template
 * @returns An object marking the string as raw SQL
 */
export function raw(strings: TemplateStringsArray, ...values: any[]): { __raw: true, value: string };
export function raw(stringsOrValue: string | TemplateStringsArray, ...values: any[]): { __raw: true, value: string } {
    // Handle tagged template literal case
    if (typeof stringsOrValue !== 'string') {
        let result = '';
        stringsOrValue.forEach((str, i) => {
            result += str + (values[i] !== undefined ? values[i] : '');
        });
        return { __raw: true, value: result };
    }

    // Handle regular function call case
    return { __raw: true, value: stringsOrValue };
}

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
 */
export function build(strings: string | TemplateStringsArray, ...values: any[]): SQLQuery {
    let query: string;
    let params: SQLParam[] = [];

    // Handle regular string with question marks
    if (typeof strings === 'string') {
        query = strings;
        params = values as SQLParam[];
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
                        params.push(...value);
                    }
                } else if (value && typeof value === 'object') {
                    if ('__raw' in value && value.__raw === true) {
                        // Raw SQL
                        query += value.value;
                    } else if ('query' in value && 'params' in value) {
                        // Handle nested SQLQuery objects (subqueries)
                        query += '(' + value.query + ')';
                        params.push(...value.params);
                    } else if (value instanceof Date) {
                        // Handle Date objects specially
                        query += '?';
                        params.push(value);
                    } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
                        // Handle binary data specially
                        query += '?';
                        params.push(value);
                    } else {
                        // Regular object - stringify for JSON storage
                        query += '?';
                        params.push(JSON.stringify(value));
                    }
                } else {
                    // Regular value
                    query += '?';
                    params.push(value as SQLParam);
                }
            }
        }
    }

    return { query, params };
};

/**
 * Creates a prepared statement with bound parameters in a type-safe way
 * 
 * @param db - The D1 database instance
 * @param string - SQL query string with ? placeholders
 * @param values - Values to bind to the prepared statement
 * @returns A D1PreparedStatement with bound parameters
 * 
 * @example
 * // Using a string with placeholders
 * const stmt = prepare(db, "SELECT * FROM users WHERE id = ?", userId);
 */
export function prepare(db: D1Database, string: string, ...values: any[]): D1PreparedStatement;
/**
 * Creates a prepared statement with bound parameters using template literals
 * 
 * @param db - The D1 database instance 
 * @param strings - Template strings array
 * @param values - Values to interpolate into the query
 * @returns A D1PreparedStatement with bound parameters
 * 
 * @example
 * // Using a template literal
 * const userId = 123;
 * const stmt = prepare(db, `SELECT * FROM users WHERE id = ${userId}`);
 * 
 * @example
 * // Using an array for IN clause
 * const roleIds = [1, 2, 3];
 * const stmt = prepare(db, `SELECT * FROM users WHERE role_id IN ${roleIds}`);
 */
export function prepare(db: D1Database, strings: TemplateStringsArray, ...values: any[]): D1PreparedStatement;
export function prepare(db: D1Database, stringOrStrings: string | TemplateStringsArray, ...values: any[]): D1PreparedStatement {
    const q = build(stringOrStrings, ...values);
    return db.prepare(q.query).bind(...(q.params));
}