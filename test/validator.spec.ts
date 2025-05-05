import { describe, it, expect } from 'vitest';
import { v } from '../src/query-builder/validate';
import { raw } from '../src/query-builder/raw';
import { RawSQL } from '../src/query-builder/types';

describe('Validator Function', () => {
  describe('Array Validator', () => {
    const allowedQueries = ['SELECT * FROM users', 'SELECT id FROM users'];

    it('should validate string input against allowed list', () => {
      const result = v('SELECT * FROM users', allowedQueries);
      expect(result).toEqual(raw('SELECT * FROM users'));
    });

    it('should validate RawSQL input against allowed list', () => {
      const rawSql = raw('SELECT * FROM users');
      const result = v(rawSql, allowedQueries);
      expect(result).toEqual(rawSql);
    });

    it('should throw error for disallowed string query', () => {
      expect(() => v('DELETE FROM users', allowedQueries)).toThrowError(
        'Query "DELETE FROM users" is not in the allowed list'
      );
    });

    it('should throw error for disallowed RawSQL query', () => {
      expect(() => v(raw('DELETE FROM users'), allowedQueries)).toThrowError(
        'Query "DELETE FROM users" is not in the allowed list'
      );
    });
  });

  describe('String Validator', () => {
    const stringValidator = (input: string) => input.startsWith('SELECT');

    it('should validate string input', () => {
      const result = v('SELECT * FROM users', stringValidator);
      expect(result).toEqual(raw('SELECT * FROM users'));
    });

    it('should validate RawSQL input using string validator', () => {
      const rawSql = raw('SELECT * FROM users');
      const result = v(rawSql, stringValidator);
      expect(result).toEqual(rawSql);
    });

    it('should throw error for invalid string input', () => {
      expect(() => v('DELETE FROM users', stringValidator)).toThrowError(
        'Query "DELETE FROM users" is not valid'
      );
    });

    it('should throw error for invalid RawSQL input using string validator', () => {
      const rawSql = raw('DELETE FROM users');
      expect(() => v(rawSql, stringValidator)).toThrowError(
        'Query "DELETE FROM users" is not valid'
      );
    });

    it('should handle parameterized RawSQL with string validator', () => {
      const rawSql = raw('SELECT * FROM users WHERE id = ?', [1]);
      const result = v(rawSql, stringValidator);
      expect(result).toEqual(rawSql);
    });
  });

  describe('RawSQL Validator', () => {
    const rawSQLValidator = (input: RawSQL, parsed: boolean) => {
      expect(parsed).toBe(true); // Verify parsed flag is passed
      return input.query.startsWith('SELECT');
    };

    it('should validate RawSQL input', () => {
      const rawSql = raw('SELECT * FROM users');
      const result = v(rawSql, rawSQLValidator);
      expect(result).toEqual(rawSql);
    });

    it('should validate string input using RawSQL validator', () => {
      const result = v('SELECT * FROM users', rawSQLValidator);
      expect(result).toEqual(raw('SELECT * FROM users'));
    });

    it('should throw error for invalid RawSQL input', () => {
      const rawSql = raw('DELETE FROM users');
      expect(() => v(rawSql, rawSQLValidator)).toThrowError(
        'Query "DELETE FROM users" is not valid'
      );
    });

    it('should throw error for invalid string input using RawSQL validator', () => {
      expect(() => v('DELETE FROM users', rawSQLValidator)).toThrowError(
        'Query "DELETE FROM users" is not valid'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for invalid validator type', () => {
      const invalidValidator = {} as any;
      expect(() => v('SELECT * FROM users', invalidValidator)).toThrowError(
        'Invalid validator type'
      );
    });

    it('should handle empty queries', () => {
      const stringValidator = (input: string) => input === '';
      const result = v('', stringValidator);
      expect(result).toEqual(raw(''));
    });
  });
});