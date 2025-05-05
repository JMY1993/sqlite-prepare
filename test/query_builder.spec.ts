/// <reference types="../src/types/worker-types" />
import { describe, it, expect } from 'vitest';
import { build, raw, fragment, SQLQuery } from '../src/index';

describe("Query builder", () => {
  describe("build function", () => {
    it("should handle array parameters for IN clauses", () => {
      const ids = [1, 2, 3];
      const result = build`SELECT * FROM users WHERE id IN ${ids}`;
      expect(result.query).toBe("SELECT * FROM users WHERE id IN (?, ?, ?)");
      expect(result.params).toEqual([1, 2, 3]);
    });

    it("should handle empty array parameters for IN clauses", () => {
      const ids: number[] = [];
      const result = build`SELECT * FROM users WHERE id IN ${ids}`;
      expect(result.query).toBe("SELECT * FROM users WHERE id IN (NULL)");
      expect(result.params).toEqual([]);
    });

    it("should handle raw SQL fragments", () => {
      const orderBy = raw("created_at DESC");
      const result = build`SELECT * FROM users ORDER BY ${orderBy}`;
      expect(result.query).toBe("SELECT * FROM users ORDER BY created_at DESC");
      expect(result.params).toEqual([]);
    });

    it("should handle raw SQL with template literals", () => {
      const orderField = "created_at";
      const direction = "DESC";
      const ordering = raw`${orderField} ${direction}`;
      const result = build`SELECT * FROM users ORDER BY ${ordering}`;
      expect(result.query).toBe("SELECT * FROM users ORDER BY created_at DESC");
      expect(result.params).toEqual([]);
    });

    it("should handle various data types as parameters", () => {
      const str = "test";
      const num = 42;
      const bool = true;
      const nullVal = null;
      const date = new Date("2023-01-01");
      const uint8 = new Uint8Array([1, 2, 3]);
      
      const result = build`SELECT * FROM test WHERE 
        str = ${str} AND 
        num = ${num} AND 
        bool = ${bool} AND 
        null_val = ${nullVal} AND 
        date = ${date} AND 
        binary = ${uint8}`;
      
      expect(result.params.length).toBe(6);
      expect(result.params[0]).toBe(str);
      expect(result.params[1]).toBe(num);
      expect(result.params[2]).toBe(bool);
      expect(result.params[3]).toBe(nullVal);
      expect(result.params[4]).toBe(date);
      expect(result.params[5]).toBe(uint8);
    });
    
    it("should handle nested queries", () => {
      const innerQuery = build`SELECT id FROM categories WHERE active = ${true}`;
      const result = build`SELECT * FROM products WHERE category_id IN ${innerQuery}`;
      expect(result.query).toBe("SELECT * FROM products WHERE category_id IN (SELECT id FROM categories WHERE active = ?)");
      expect(result.params).toEqual([true]);
    });
    
    it("should handle multiple nested queries", () => {
      const categoryQuery = build`SELECT id FROM categories WHERE active = ${true}`;
      const tagQuery = build`SELECT product_id FROM product_tags WHERE tag_id = ${5}`;
      const result = build`SELECT * FROM products WHERE category_id IN ${categoryQuery} AND id IN ${tagQuery}`;
      expect(result.query).toBe("SELECT * FROM products WHERE category_id IN (SELECT id FROM categories WHERE active = ?) AND id IN (SELECT product_id FROM product_tags WHERE tag_id = ?)");
      expect(result.params).toEqual([true, 5]);
    });
  });

  describe("raw function", () => {
    it("should create raw SQL fragment from string", () => {
      const fragment = raw("COUNT(*) as count");
      expect(fragment).toEqual({ __raw: true, query: "COUNT(*) as count" });
    });

    it("should create raw SQL fragment from template literal", () => {
      const column = "users";
      const fragment = raw`COUNT(${column}) as count`;
      expect(fragment).toEqual({ __raw: true, query: "COUNT(users) as count" });
    });
    
    it("should allow raw SQL fragments in WHERE conditions", () => {
      const condition = raw("date_created > date_sub(now(), interval 1 day)");
      const result = build`SELECT * FROM events WHERE ${condition}`;
      expect(result.query).toBe("SELECT * FROM events WHERE date_created > date_sub(now(), interval 1 day)");
      expect(result.params).toEqual([]);
    });
    
    it("should combine multiple raw SQL fragments", () => {
      const select = raw("COUNT(*) as count");
      const from = raw("users");
      const where = raw("status = 'active'");
      const result = build`SELECT ${select} FROM ${from} WHERE ${where}`;
      expect(result.query).toBe("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
      expect(result.params).toEqual([]);
    });
  });
  
  describe("SQL injection prevention", () => {
    it("should safely handle user input through parameterization", () => {
      const maliciousInput = "1'; DROP TABLE users; --";
      const result = build`SELECT * FROM users WHERE id = ${maliciousInput}`;
      expect(result.query).toBe("SELECT * FROM users WHERE id = ?");
      expect(result.params).toEqual(["1'; DROP TABLE users; --"]);
    });
    
    it("should handle objects safely by JSON stringifying them", () => {
      const obj = { id: 1, name: "test" };
      const result = build`SELECT * FROM users WHERE data = ${obj}`;
      expect(result.query).toBe("SELECT * FROM users WHERE data = ?");
      expect(result.params[0]).toEqual(JSON.stringify(obj));
    });
  });

  describe("fragment function", () => {
    it("should create SQL fragments without parentheses", () => {
      const columns = fragment`id, name, created_at`;
      const result = build`SELECT ${columns} FROM users`;
      expect(result.query).toBe("SELECT id, name, created_at FROM users");
      expect(result.params).toEqual([]);
    });

    it("should handle fragments with parameters", () => {
      const condition = fragment`status = ${'active'} AND type = ${'user'}`;
      const result = build`SELECT * FROM users WHERE ${condition}`;
      expect(result.query).toBe("SELECT * FROM users WHERE status = ? AND type = ?");
      expect(result.params).toEqual(['active', 'user']);
    });

    it("should allow fragments in column lists", () => {
      const count = fragment`COUNT(*) as count`;
      const result = build`SELECT ${count}, name FROM users`;
      expect(result.query).toBe("SELECT COUNT(*) as count, name FROM users");
      expect(result.params).toEqual([]);
    });

    it("should work with insert statements", () => {
      const columns = fragment`id, name, created_at`;
      const values = fragment`1, 'John', NOW()`;
      const result = build`INSERT INTO users (${columns}) VALUES (${values})`;
      expect(result.query).toBe("INSERT INTO users (id, name, created_at) VALUES (1, 'John', NOW())");
      expect(result.params).toEqual([]);
    });
  });
});