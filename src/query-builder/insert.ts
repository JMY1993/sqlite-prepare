import { parseValue } from './parseValue';
import { SQLParam, FragmentSQL } from './types';

export function into(table: string): string {
    return table;
}

export function insert(table: string, values: Record<string, any>[] | Record<string, any>): FragmentSQL {
    // Ensure that values is an array
    const valuesArray = Array.isArray(values) ? values : [values];
    
    if (valuesArray.length === 0) {
        throw new Error('Values array cannot be empty');
    }

    const params: SQLParam[] = [];
    
    // Get all unique columns from the values array
    const columns = new Set<string>();
    for (const row of valuesArray) {
        Object.keys(row).forEach(key => columns.add(key));
    }
    const columnsList = Array.from(columns);

    // Parse each row and prepare the values for insertion, padding with nulls for missing columns
    const parsedValuesArray = valuesArray.map(row => {
        const parsedRow: Record<string, any> = {};
        for (const col of columnsList) {
            // Check if the column exists in the row, if not, set it to null
            const value = col in row ? row[col] : null;
            parsedRow[col] = parseValue(value);
        }
        return parsedRow;
    });

    // Generate placeholders for each row
    const rowPlaceholders = parsedValuesArray.map(row => {
        const rowValues = columnsList.map(col => {
            const val = row[col];
            if (typeof val === 'object' && val !== null) {
                if ('__raw' in val || '__fragment' in val) {
                    params.push(...(val.params || []));
                    return val.query;
                } else if ('__subquery' in val) {
                    params.push(...val.params);
                    return `(${val.query})`;
                }
            }
            params.push(val);
            return '?';
        });
        return `(${rowValues.join(', ')})`;
    }).join(', ');

    const query = `INSERT INTO ${table} (${columnsList.join(', ')}) VALUES ${rowPlaceholders}`;

    return {
        __fragment: true,
        query,
        params
    };
}