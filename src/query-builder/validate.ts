import { RawSQL, SQLParam } from './types';
import { raw } from './raw';

type StringValidator = (input: string) => boolean;
type RawSQLValidator = (input: RawSQL, parsed: boolean) => boolean;

function isStringValidator(validator: any): validator is StringValidator {
    return typeof validator === 'function' && validator.length === 1;
}

function isRawSQLValidator(validator: any): validator is RawSQLValidator {
    return typeof validator === 'function' && validator.length === 2;
}

/**
 * Validates a raw SQL query against an allowed list of queries
 * @param rawSqlQuery - The raw SQL query to validate
 * @param allowedQueries - Array of allowed SQL queries
 * @returns A RawSQL object if validation passes
 * @throws Error if validation fails
 */
export function validate(
    input: string | RawSQL,
    validator: string[] | RawSQLValidator | StringValidator
): RawSQL {
    const rawSql = typeof input === "string" ? raw(input) : input;

    if (Array.isArray(validator)) {
        if (!validator.includes(rawSql.query)) {
            throw new Error(`Query "${rawSql.query}" is not in the allowed list`);
        }
        return rawSql;
    } else {
        if (isStringValidator(validator)) {
            if (typeof input === 'string') {
                if (!validator(input)) {
                    throw new Error(`Query "${input}" is not valid`);
                }
            } else {
                if (!validator(rawSql.query)) {
                    throw new Error(`Query "${rawSql.query}" is not valid`);
                }
            }
        } else if (isRawSQLValidator(validator)) {
            if (!validator(rawSql, true)) {
                throw new Error(`Query "${rawSql.query}" is not valid`);
            }
        } else {
            throw new Error('Invalid validator type');
        }
        return rawSql;
    }
}

export const v = validate;