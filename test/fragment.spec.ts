/// <reference types="../src/types/worker-types" />
import { describe, it, expect } from 'vitest';
import { fragment, build } from '../src/index';

describe("Fragment function", () => {
  describe("Basic functionality", () => {
    it("should create a fragment with template literal", () => {
      const result = fragment`id, name, created_at`;
      expect(result).toEqual({
        __fragment: true,
        query: "id, name, created_at",
        params: []
      });
    });

    it("should create a fragment with string parameter", () => {
      const result = fragment("id, name, created_at");
      expect(result).toEqual({
        __fragment: true,
        query: "id, name, created_at",
        params: []
      });
    });

    it("should handle fragments with parameters", () => {
      const result = fragment`status = ${'active'} AND type = ${'user'}`;
      expect(result).toEqual({
        __fragment: true,
        query: "status = ? AND type = ?",
        params: ['active', 'user']
      });
    });
  });

  describe("Integration with build", () => {
    it("should work in SELECT statements", () => {
      const columns = fragment`id, name, created_at`;
      const result = build`SELECT ${columns} FROM users`;
      expect(result.query).toBe("SELECT id, name, created_at FROM users");
      expect(result.params).toEqual([]);
    });

    it("should work in WHERE clauses", () => {
      const condition = fragment`status = ${'active'} AND type = ${'user'}`;
      const result = build`SELECT * FROM users WHERE ${condition}`;
      expect(result.query).toBe("SELECT * FROM users WHERE status = ? AND type = ?");
      expect(result.params).toEqual(['active', 'user']);
    });

    it("should work in ORDER BY clauses", () => {
      const orderBy = fragment`created_at DESC, name ASC`;
      const result = build`SELECT * FROM users ORDER BY ${orderBy}`;
      expect(result.query).toBe("SELECT * FROM users ORDER BY created_at DESC, name ASC");
      expect(result.params).toEqual([]);
    });

    it("should work in GROUP BY clauses", () => {
      const groupBy = fragment`status, type`;
      const result = build`SELECT status, type, COUNT(*) FROM users GROUP BY ${groupBy}`;
      expect(result.query).toBe("SELECT status, type, COUNT(*) FROM users GROUP BY status, type");
      expect(result.params).toEqual([]);
    });
  });

  describe("Parameter handling", () => {
    it("should handle multiple parameters", () => {
      const result = fragment`id = ${1} AND name = ${'John'} AND age = ${25}`;
      expect(result.query).toBe("id = ? AND name = ? AND age = ?");
      expect(result.params).toEqual([1, 'John', 25]);
    });

    it("should handle null parameters", () => {
      const result = fragment`deleted_at = ${null}`;
      expect(result.query).toBe("deleted_at = ?");
      expect(result.params).toEqual([null]);
    });

    it("should handle boolean parameters", () => {
      const result = fragment`is_active = ${true}`;
      expect(result.query).toBe("is_active = ?");
      expect(result.params).toEqual([true]);
    });

    it("should handle date parameters", () => {
      const date = new Date("2024-01-01");
      const result = fragment`created_at = ${date}`;
      expect(result.query).toBe("created_at = ?");
      expect(result.params).toEqual([date]);
    });
  });

  describe("Complex scenarios", () => {
    it("should handle nested fragments", () => {
      const innerFragment = fragment`status = ${'active'}`;
      const outerFragment = fragment`${innerFragment} AND type = ${'user'}`;
      const result = build`SELECT * FROM users WHERE ${outerFragment}`;
      expect(result.query).toBe("SELECT * FROM users WHERE status = ? AND type = ?");
      expect(result.params).toEqual(['active', 'user']);
    });

    it("should handle fragments in JOIN conditions", () => {
      const joinCondition = fragment`users.id = orders.user_id AND orders.status = ${'pending'}`;
      const result = build`SELECT * FROM users JOIN orders ON ${joinCondition}`;
      expect(result.query).toBe("SELECT * FROM users JOIN orders ON users.id = orders.user_id AND orders.status = ?");
      expect(result.params).toEqual(['pending']);
    });

    it("should handle fragments in subqueries", () => {
      const subquery = fragment`SELECT id FROM users WHERE status = ${'active'}`;
      const result = build`SELECT * FROM orders WHERE user_id IN (${subquery})`;
      expect(result.query).toBe("SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE status = ?)");
      expect(result.params).toEqual(['active']);
    });
  });
}); 