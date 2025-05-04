/// <reference types="./types/d1-types" />

import { prepare } from "./query_builder";


export const wrapD1 = async (db: D1Database) => {
    // Check if the database is connected
    if (!db) {
        throw new Error('Database connection is not established.');
    }
    return () => prepare.bind(null, db);
}