import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build, insert, into, raw, fragment } from '../src/index';
import Database from 'better-sqlite3';

interface User {
  id: number;
  name: string;
  age: number;
  email: string | null;
  created_at: string;
  metadata: string | null;
}

describe('Query Builder', () => {
  let db: Database.Database;

  beforeEach(() => {
    // Initialize with verbose mode to help debug
    db = new Database(':memory:', { verbose: console.log });
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);

    // Insert test data
    db.exec(`
      INSERT INTO users (name, age, email, created_at, metadata) VALUES
      ('John', 30, 'john@example.com', datetime('now', '-2 days'), '{"role": "user"}'),
      ('Jane', 25, 'jane@example.com', datetime('now', '-1 day'), '{"role": "admin"}'),
      ('Bob', 35, 'bob@example.com', datetime('now'), '{"role": "user"}')
    `);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  describe('build function', () => {
    it('should build a simple SELECT query', () => {
      const query = build`SELECT * FROM users WHERE id = ${1}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('should handle multiple parameters', () => {
      const query = build`SELECT * FROM users WHERE name = ${'John'} AND age > ${25}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('should handle IN clauses with arrays', () => {
      const query = build`SELECT * FROM users WHERE id IN ${[1, 2]}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(['John', 'Jane']);
    });

    it('should handle empty IN clauses', () => {
      const query = build`SELECT * FROM users WHERE id IN ${[]}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(0);
    });

    it('should handle NULL values', () => {
      const query = build`SELECT * FROM users WHERE email IS ${null}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(0);
    });
  });

  describe('insert function', () => {
    it('should insert a single row', () => {
      const query = build`${insert(into('users'), { name: 'Alice', age: 28 })}`;
      const result = db.prepare(query.query).run(...query.params);
      expect(result.changes).toBe(1);

      // Verify the inserted data
      const verify = db.prepare('SELECT * FROM users WHERE name = ?').get('Alice') as User;
      expect(verify).toBeDefined();
      expect(verify.age).toBe(28);
    });

    it('should insert with raw SQL values', () => {
      const query = build`${insert(into('users'), { 
        name: 'Eve', 
        created_at: raw('datetime(\'now\', \'-3 days\')') 
      })}`;
      const result = db.prepare(query.query).run(...query.params);
      expect(result.changes).toBe(1);

      // Verify the inserted data
      const verify = db.prepare('SELECT * FROM users WHERE name = ?').get('Eve') as User;
      expect(verify).toBeDefined();
    });

    it('should insert with JSON metadata', () => {
      const query = build`${insert(into('users'), { 
        name: 'Charlie', 
        metadata: JSON.stringify({ role: 'admin', active: true }) 
      })}`;
      const result = db.prepare(query.query).run(...query.params);
      expect(result.changes).toBe(1);

      // Verify the inserted data
      const verify = db.prepare('SELECT * FROM users WHERE name = ?').get('Charlie') as User;
      expect(verify).toBeDefined();
      expect(JSON.parse(verify.metadata!)).toEqual({ role: 'admin', active: true });
    });

    it('should auto parse JSON metadata when inserting', () => {
        const query = build`${insert(into('users'), { 
          name: 'Charlie', 
          metadata: { role: 'admin', active: true } 
        })}`;
        const result = db.prepare(query.query).run(...query.params);
        expect(result.changes).toBe(1);
  
        // Verify the inserted data
        const verify = db.prepare('SELECT * FROM users WHERE name = ?').get('Charlie') as User;
        expect(verify).toBeDefined();
        expect(JSON.parse(verify.metadata!)).toEqual({ role: 'admin', active: true });
      });

  });

  describe('raw function', () => {
    it('should handle raw SQL in WHERE clause', () => {
      const query = build`SELECT * FROM users WHERE ${raw('created_at > datetime(\'now\', \'-1 day\')')}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob');
    });

    it('should handle raw SQL with parameters', () => {
      const query = build`SELECT * FROM users WHERE ${raw('age > ?', [30])}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob');
    });
  });

  describe('fragment function', () => {
    it('should handle SQL fragments in SELECT clause', () => {
      const columns = fragment`id, name, age`;
      const query = build`SELECT ${columns} FROM users WHERE name = ${'John'}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
      expect(result[0].email).toBeUndefined(); // email not in selected columns
    });

    it('should handle SQL fragments with parameters', () => {
      const condition = fragment`name = ${'John'} AND age > ${25}`;
      const query = build`SELECT * FROM users WHERE ${condition}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });
  });

  describe('complex queries', () => {
    it('should handle nested queries', () => {
      const subquery = build`SELECT id FROM users WHERE age > ${30}`;
      const query = build`SELECT * FROM users WHERE id IN ${subquery}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob');
    });

    it('should handle multiple fragments and raw SQL', () => {
      const columns = fragment`id, name, age`;
      const condition = fragment`age > ${25}`;
      const orderBy = raw('created_at DESC');
      const query = build`SELECT ${columns} FROM users WHERE ${condition} ORDER BY ${orderBy}`;
      const result = db.prepare(query.query).all(...query.params) as User[];
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Bob'); // Most recent
      expect(result[1].name).toBe('John'); // Second most recent
    });
  });
});
