export type SQLParam =
    | string
    | number
    | boolean
    | null
    | undefined
    | Date
    | Uint8Array
    | ArrayBuffer;

export interface SQLQuery {
    query: string;
    params: SQLParam[];
}

export function raw(value: string): { __raw: true, value: string };
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

// Type-safe SQL function
export function prepare(db: D1Database, string: string, ...values: any[]): D1PreparedStatement;
export function prepare(db: D1Database, strings: TemplateStringsArray, ...values: any[]): D1PreparedStatement;
export function prepare(db: D1Database, stringOrStrings: string | TemplateStringsArray, ...values: any[]): D1PreparedStatement {
    const q = build(stringOrStrings, ...values);
    return db.prepare(q.query).bind(...(q.params));
}