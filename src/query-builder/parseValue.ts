import { SQLParam, FragmentSQL } from "./types";

/**
 * Parses a value into a SQL parameter, handling special cases
 * @param value - The value to parse
 * @returns The parsed SQL parameter or a special marker for raw/subquery/fragment values
 */
export function parseValue(value: any): SQLParam | { __raw: true, query: string, params?: SQLParam[] } | { __subquery: true, query: string, params: SQLParam[] } | FragmentSQL {
    if (value === null || value === undefined) {
        return null;
    }
    
    if (value instanceof Date || 
        value instanceof Uint8Array || 
        value instanceof ArrayBuffer) {
        return value;
    }
    
    if (value && typeof value === 'object') {
        if ('__raw' in value && value.__raw === true) {
            // Return raw SQL marker with params
            return { __raw: true, query: value.query, params: value.params };
        }
        if ('__fragment' in value && value.__fragment === true) {
            // Return fragment marker
            return value as FragmentSQL;
        }
        // fallback to subquery
        if ('query' in value && 'params' in value) {
            // Return subquery marker
            return { __subquery: true, query: value.query, params: value.params };
        }
        // Convert plain objects to JSON strings
        return JSON.stringify(value);
    }
    
    return value as SQLParam;
} 