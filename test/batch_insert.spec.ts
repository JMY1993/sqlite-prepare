import { describe, it, expect } from 'vitest';
import { build, insert, into, raw, fragment } from '../src/index';

describe("Batch Insert", () => {
    it("should handle array of objects with same structure", () => {
        const users = [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 },
            { name: 'Bob', age: 35 }
        ];
        const result = build`${insert(into('users'), users)}`;
        
        expect(result.query).toBe("INSERT INTO users (name, age) VALUES (?, ?), (?, ?), (?, ?)");
        expect(result.params).toEqual(['John', 30, 'Jane', 25, 'Bob', 35]);
    });

    it("should handle array of objects with different columns", () => {
        const users = [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25, role: 'admin' },
            { name: 'Bob', status: 'active' }
        ];
        const result = build`${insert(into('users'), users)}`;
        
        expect(result.query).toBe("INSERT INTO users (name, age, role, status) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)");
        expect(result.params).toEqual(['John', 30, null, null, 'Jane', 25, 'admin', null, 'Bob', null, null, 'active']);
    });

    it("should handle array with complex values", () => {
        const users = [
            { 
                name: 'John',
                created_at: raw('NOW()'),
                metadata: { role: 'user' }
            },
            { 
                name: 'Jane',
                created_at: raw('NOW()'),
                metadata: { role: 'admin' }
            }
        ];
        const result = build`${insert(into('users'), users)}`;
        
        expect(result.query).toBe("INSERT INTO users (name, created_at, metadata) VALUES (?, NOW(), ?), (?, NOW(), ?)");
        expect(result.params).toEqual([
            'John', 
            JSON.stringify({ role: 'user' }),
            'Jane',
            JSON.stringify({ role: 'admin' })
        ]);
    });

    it("should handle array with subqueries", () => {
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
        const result = build`${insert(into('users'), users)}`;
        
        expect(result.query).toBe("INSERT INTO users (name, role_id) VALUES (?, (SELECT id FROM roles WHERE name = ?)), (?, (SELECT id FROM roles WHERE name = ?))");
        expect(result.params).toEqual(['John', 'admin', 'Jane', 'user']);
    });

    it("should handle array with mixed fragments and raw SQL", () => {
        const users = [
            { 
                name: 'John',
                status: fragment`COALESCE(${'active'}, 'pending')`,
                created_at: raw('NOW()')
            },
            { 
                name: 'Jane',
                status: fragment`COALESCE(${'pending'}, 'active')`,
                created_at: raw('NOW()')
            }
        ];
        const result = build`${insert(into('users'), users)}`;
        
        expect(result.query).toBe("INSERT INTO users (name, status, created_at) VALUES (?, COALESCE(?, 'pending'), NOW()), (?, COALESCE(?, 'active'), NOW())");
        expect(result.params).toEqual(['John', 'active', 'Jane', 'pending']);
    });

    it("should throw error for empty array", () => {
        expect(() => {
            build`${insert(into('users'), [])}`;
        }).toThrow('Values array cannot be empty');
    });

    it("should handle single object same as array with one item", () => {
        const singleResult = build`${insert(into('users'), { name: 'John', age: 30 })}`;
        const arrayResult = build`${insert(into('users'), [{ name: 'John', age: 30 }])}`;
        
        expect(singleResult.query).toBe(arrayResult.query);
        expect(singleResult.params).toEqual(arrayResult.params);
    });
});