import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build, insert, into, raw, fragment } from '../src/index';
import Database from 'better-sqlite3';

interface User {
    id: number;
    name: string;
    age?: number;
    email?: string;
    created_at: string;
    metadata?: string;
    role?: string;
    status?: string;
    role_id?: number;
}

describe('Batch Insert with better-sqlite3', () => {
    let db: Database.Database;

    beforeEach(() => {
        db = new Database(':memory:', { verbose: console.log });
        
        // Create roles table first due to foreign key constraint
        db.exec(`
            CREATE TABLE roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            );

            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT,
                role TEXT,
                status TEXT,
                role_id INTEGER,
                FOREIGN KEY (role_id) REFERENCES roles(id)
            );

            -- Insert default roles for tests
            INSERT INTO roles (name) VALUES ('admin'), ('user');
        `);
    });

    afterEach(() => {
        db.close();
    });

    it('should insert multiple rows with same structure', () => {
        const users = [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 },
            { name: 'Bob', age: 35 }
        ];
        const query = build`${insert(into('users'), users)}`;
        const result = db.prepare(query.query).run(...query.params);
        
        expect(result.changes).toBe(3); // Should insert 3 rows

        // Verify the inserted data
        const inserted = db.prepare('SELECT * FROM users ORDER BY name').all() as User[];
        expect(inserted).toHaveLength(3);
        // Sort the original array to match the SQL ORDER BY
        const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));
        expect(inserted.map(u => ({ name: u.name, age: u.age }))).toEqual(sortedUsers);
    });

    it('should insert rows with different column structures', () => {
        const users = [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25, role: 'admin' },
            { name: 'Bob', status: 'active' }
        ];
        const query = build`${insert(into('users'), users)}`;
        const result = db.prepare(query.query).run(...query.params);
        
        expect(result.changes).toBe(3);

        // Verify each row individually
        const john = db.prepare('SELECT * FROM users WHERE name = ?').get('John') as User;
        expect(john.age).toBe(30);
        expect(john.role).toBeNull();
        expect(john.status).toBeNull();

        const jane = db.prepare('SELECT * FROM users WHERE name = ?').get('Jane') as User;
        expect(jane.age).toBe(25);
        expect(jane.role).toBe('admin');
        expect(jane.status).toBeNull();

        const bob = db.prepare('SELECT * FROM users WHERE name = ?').get('Bob') as User;
        expect(bob.age).toBeNull();
        expect(bob.role).toBeNull();
        expect(bob.status).toBe('active');
    });

    it('should insert rows with raw SQL and complex values', () => {
        const users = [
            { 
                name: 'John',
                created_at: raw("datetime('now', '-1 day')"),  // Added quotes
                metadata: { role: 'user', permissions: ['read'] }
            },
            { 
                name: 'Jane',
                created_at: raw("datetime('now')"),  // Added quotes
                metadata: { role: 'admin', permissions: ['read', 'write'] }
            }
        ];
        const query = build`${insert(into('users'), users)}`;
        const result = db.prepare(query.query).run(...query.params);
        
        expect(result.changes).toBe(2);

        // Verify the inserted data
        const inserted = db.prepare('SELECT * FROM users ORDER BY name').all() as User[];
        expect(inserted).toHaveLength(2);
        
        // Verify metadata was properly JSON stringified
        const john = inserted.find(u => u.name === 'John')!;
        const jane = inserted.find(u => u.name === 'Jane')!;
        
        expect(JSON.parse(john.metadata!)).toEqual({ role: 'user', permissions: ['read'] });
        expect(JSON.parse(jane.metadata!)).toEqual({ role: 'admin', permissions: ['read', 'write'] });
        
        // Verify dates are different
        expect(john.created_at).not.toBe(jane.created_at);
    });

    it('should handle batch insert with fragments and expressions', () => {
        const users = [
            { 
                name: 'John',
                status: fragment`COALESCE(${'active'}, 'pending')`,
                email: raw('lower(?)', ['JOHN@EXAMPLE.COM'])
            },
            { 
                name: 'Jane',
                status: fragment`COALESCE(${'pending'}, 'active')`,
                email: raw('lower(?)', ['JANE@EXAMPLE.COM'])
            }
        ];
        const query = build`${insert(into('users'), users)}`;
        const result = db.prepare(query.query).run(...query.params);
        
        expect(result.changes).toBe(2);

        // Verify the inserted data
        const john = db.prepare('SELECT * FROM users WHERE name = ?').get('John') as User;
        expect(john.status).toBe('active');
        expect(john.email).toBe('john@example.com');

        const jane = db.prepare('SELECT * FROM users WHERE name = ?').get('Jane') as User;
        expect(jane.status).toBe('pending');
        expect(jane.email).toBe('jane@example.com');
    });

    it('should handle large batch inserts efficiently', () => {
        const users = Array.from({ length: 1000 }, (_, i) => ({
            name: `User${i}`,
            age: 20 + (i % 50),
            email: `user${i}@example.com`
        }));
        
        const query = build`${insert(into('users'), users)}`;
        const result = db.prepare(query.query).run(...query.params);
        
        expect(result.changes).toBe(1000);

        // Verify some random samples
        const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
        expect(count.count).toBe(1000);

        const user42 = db.prepare('SELECT * FROM users WHERE name = ?').get('User42') as User;
        expect(user42.email).toBe('user42@example.com');
    });

    it('should handle subqueries in batch insert', () => {
        const users = [
            { 
                name: 'John',
                role_id: build`SELECT id FROM roles WHERE name = ${'admin'}`
            },
            { 
                name: 'Jane',
                role_id: build`SELECT id FROM roles WHERE name = ${'user'}`
            }
        ];
        
        const query = build`${insert(into('users'), users)}`;
        const result = db.prepare(query.query).run(...query.params);
        
        expect(result.changes).toBe(2);

        // Verify the inserted data
        const john = db.prepare(`
            SELECT u.*, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.name = ?
        `).get('John') as User & { role_name: string };
        
        expect(john.role_name).toBe('admin');

        const jane = db.prepare(`
            SELECT u.*, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.name = ?
        `).get('Jane') as User & { role_name: string };
        
        expect(jane.role_name).toBe('user');
    });
});