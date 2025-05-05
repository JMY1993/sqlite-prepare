/// <reference types="../src/types/worker-types" />
import { describe, it, expect } from 'vitest';
import { build, insert, into, raw, fragment } from '../src/index';

describe("Insert builder", () => {
  describe("insert function", () => {
    it("should create a simple insert query", () => {
      const result = build`${insert(into('users'), { name: 'John', age: 30 })}`;
      expect(result.query).toBe("INSERT INTO users (name, age) VALUES (?, ?)");
      expect(result.params).toEqual(['John', 30]);
    });

    describe("value parsing", () => {
      it("should handle primitive types", () => {
        const result = build`${insert(into('test'), {
          str: 'text',
          num: 42,
          bool: true,
          null_val: null,
          undefined_val: undefined
        })}`;
        expect(result.query).toBe("INSERT INTO test (str, num, bool, null_val, undefined_val) VALUES (?, ?, ?, ?, ?)");
        expect(result.params).toEqual(['text', 42, true, null, null]);
      });

      it("should handle Date objects", () => {
        const date = new Date('2023-01-01T12:00:00Z');
        const result = build`${insert(into('test'), { created_at: date })}`;
        expect(result.query).toBe("INSERT INTO test (created_at) VALUES (?)");
        expect(result.params).toEqual([date]);
      });

      it("should handle binary data", () => {
        const uint8 = new Uint8Array([1, 2, 3]);
        const arrayBuffer = new ArrayBuffer(8);
        const result = build`${insert(into('test'), {
          binary1: uint8,
          binary2: arrayBuffer
        })}`;
        expect(result.query).toBe("INSERT INTO test (binary1, binary2) VALUES (?, ?)");
        expect(result.params).toEqual([uint8, arrayBuffer]);
      });

      it("should handle nested objects by JSON stringifying them", () => {
        const result = build`${insert(into('users'), {
          name: 'John',
          metadata: { role: 'admin', permissions: ['read', 'write'] },
          settings: { theme: 'dark', notifications: { email: true, push: false } }
        })}`;
        expect(result.query).toBe("INSERT INTO users (name, metadata, settings) VALUES (?, ?, ?)");
        expect(result.params[0]).toBe('John');
        expect(result.params[1]).toBe(JSON.stringify({ role: 'admin', permissions: ['read', 'write'] }));
        expect(result.params[2]).toBe(JSON.stringify({ theme: 'dark', notifications: { email: true, push: false } }));
      });

      it("should handle arrays by JSON stringifying them", () => {
        const result = build`${insert(into('users'), {
          tags: ['admin', 'premium'],
          scores: [1, 2, 3],
          matrix: [[1, 2], [3, 4]]
        })}`;
        expect(result.query).toBe("INSERT INTO users (tags, scores, matrix) VALUES (?, ?, ?)");
        expect(result.params[0]).toBe(JSON.stringify(['admin', 'premium']));
        expect(result.params[1]).toBe(JSON.stringify([1, 2, 3]));
        expect(result.params[2]).toBe(JSON.stringify([[1, 2], [3, 4]]));
      });

      it("should handle raw SQL values", () => {
        const result = build`${insert(into('users'), {
          name: 'John',
          created_at: raw('NOW()'),
          updated_at: raw('CURRENT_TIMESTAMP'),
          status: raw('COALESCE(?, "active")', ['pending'])
        })}`;
        expect(result.query).toBe('INSERT INTO users (name, created_at, updated_at, status) VALUES (?, NOW(), CURRENT_TIMESTAMP, COALESCE(?, "active"))');
        expect(result.params).toEqual(['John', 'pending']);
      });

      it("should handle subquery values", () => {
        const subquery = build`SELECT id FROM active_users WHERE status = ${'active'}`;
        const result = build`${insert(into('users'), {
          name: 'John',
          user_id: subquery,
          role_id: build`SELECT id FROM roles WHERE name = ${'admin'}`
        })}`;
        expect(result.query).toBe('INSERT INTO users (name, user_id, role_id) VALUES (?, (SELECT id FROM active_users WHERE status = ?), (SELECT id FROM roles WHERE name = ?))');
        expect(result.params).toEqual(['John', 'active', 'admin']);
      });

      it("should handle mixed raw SQL and subquery values", () => {
        const subquery = build`SELECT id FROM active_users WHERE status = ${'active'}`;
        const result = build`${insert(into('users'), {
          name: 'John',
          created_at: raw('NOW()'),
          user_id: subquery,
          updated_at: raw('CURRENT_TIMESTAMP')
        })}`;
        expect(result.query).toBe('INSERT INTO users (name, created_at, user_id, updated_at) VALUES (?, NOW(), (SELECT id FROM active_users WHERE status = ?), CURRENT_TIMESTAMP)');
        expect(result.params).toEqual(['John', 'active']);
      });

      it("should handle fragment values", () => {
        const result = build`${insert(into('users'), {
          name: 'John',
          created_at: fragment`NOW()`,
          updated_at: fragment`CURRENT_TIMESTAMP`,
          status: fragment`COALESCE(${'pending'}, 'active')`
        })}`;
        expect(result.query).toBe('INSERT INTO users (name, created_at, updated_at, status) VALUES (?, NOW(), CURRENT_TIMESTAMP, COALESCE(?, \'active\'))');
        expect(result.params).toEqual(['John', 'pending']);
      });
    });

    it("should handle empty object values", () => {
      const result = build`${insert(into('users'), {})}`;
      expect(result.query).toBe("INSERT INTO users () VALUES ()");
      expect(result.params).toEqual([]);
    });

    it("should handle special characters in column names", () => {
      const result = build`${insert(into('users'), { 'first-name': 'John', 'last-name': 'Doe' })}`;
      expect(result.query).toBe("INSERT INTO users (first-name, last-name) VALUES (?, ?)");
      expect(result.params).toEqual(['John', 'Doe']);
    });
  });

  describe("SQL injection prevention", () => {
    it("should safely handle user input through parameterization", () => {
      const maliciousInput = "1'; DROP TABLE users; --";
      const result = build`${insert(into('users'), { name: maliciousInput })}`;
      expect(result.query).toBe("INSERT INTO users (name) VALUES (?)");
      expect(result.params).toEqual([maliciousInput]);
    });

    it("should handle malicious column names safely", () => {
      const maliciousColumn = "name; DROP TABLE users; --";
      const result = build`${insert(into('users'), { [maliciousColumn]: 'John' })}`;
      expect(result.query).toBe("INSERT INTO users (name; DROP TABLE users; --) VALUES (?)");
      expect(result.params).toEqual(['John']);
    });
  });
});
