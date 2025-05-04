/// <reference types="./types/d1-types" />

import { prepare } from "./query_builder";

/**
 * Creates a function that provides type-safe prepared statements for a D1 database
 * 
 * This function wraps a D1Database instance to provide a more convenient API for
 * creating prepared statements with template literals. It performs validation
 * to ensure the database connection is established.
 * 
 * @param db - The D1Database instance to wrap
 * @returns A function that can be used to create prepared statements with the provided database
 * @throws Error if the database connection is not established
 * 
 * @example
 * ```typescript
 * // In a Cloudflare Worker
 * const prepareD1 = await wrapD1(env.DB);
 * 
 * // Then use it to create prepared statements
 * const users = await prepareD1()`SELECT * FROM users WHERE id = ${userId}`.all();
 * ```
 */
export const wrapD1 = (db: D1Database) => {
    // Check if the database is connected
    if (!db) {
        throw new Error('Database connection is not established.');
    }
    return prepare.bind(null, db);
}