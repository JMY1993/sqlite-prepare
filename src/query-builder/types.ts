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
 * Represents an insert query with table and values
 */
export interface InsertQuery {
    __insert: true;
    table: string;
    values: Record<string, SQLParam | { __raw: true, query: string } | { __subquery: true, query: string, params: SQLParam[] } | FragmentSQL>;
}

/**
 * Represents a raw SQL fragment
 */
export interface RawSQL {
    __raw: true;
    query: string;
    params?: SQLParam[];
}

/**
 * Represents a subquery
 */
export interface SubQuery {
    __subquery: true;
    query: string;
    params: SQLParam[];
}

export interface FragmentSQL {
    __fragment: true;
    query: string;
    params: SQLParam[];
} 