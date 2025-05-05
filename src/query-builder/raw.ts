import { RawSQL, SQLParam } from './types';

/**
 * Creates a raw SQL fragment that will be inserted directly into the query without escaping
 * @param value - The raw SQL string to insert
 * @param params - Optional array of parameters to bind to placeholders in the raw SQL
 * @returns An object marking the string as raw SQL with optional parameters
 */
export function raw(value: string, params?: SQLParam[]): RawSQL;
/**
 * Creates a raw SQL fragment using template literals that will be inserted directly into the query
 * @param strings - Template strings array
 * @param values - Values to interpolate into the template
 * @returns An object marking the string as raw SQL
 */
export function raw(strings: TemplateStringsArray, ...values: any[]): RawSQL;
export function raw(stringsOrValue: string | TemplateStringsArray, ...values: any[]): RawSQL {
    // Handle tagged template literal case
    if (typeof stringsOrValue !== 'string') {
        let result = '';
        stringsOrValue.forEach((str, i) => {
            result += str + (values[i] !== undefined ? values[i] : '');
        });
        return { __raw: true, query: result };
    }

    // Handle regular function call case
    const params = values[0] || [];
    return { 
        __raw: true, 
        query: stringsOrValue,
        ...(params.length > 0 ? { params } : {})
    };
}

export const r = raw; // Alias for convenience