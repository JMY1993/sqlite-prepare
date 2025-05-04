# D1 Query Builder

A type-safe SQL query builder for Cloudflare D1.

## Installation

```bash
npm install sqlite-prepare
# or
yarn add sqlite-prepare
# or
pnpm add sqlite-prepare
```

## Usage

```typescript
import { build, prepare } from 'sqlite-prepare';

// Create a simple query with parameters
const query = build`
  SELECT * FROM users 
  WHERE age > ${21} 
  AND status = ${'active'}
`;

// Execute with Cloudflare D1
const results = await prepare(db, query).all();

// Nested queries
const subquery = build`SELECT id FROM users WHERE age > ${21}`;
const mainQuery = build`SELECT * FROM posts WHERE author_id IN ${subquery}`;
const posts = await prepare(db, mainQuery).all();

// Raw SQL (use carefully)
import { raw } from 'sqlite-prepare';
const rawQuery = build`SELECT * FROM ${raw('users')}`;
```

## Features

- Type-safe SQL query building
- Parameterized queries for SQL injection protection
- Support for nested subqueries
- Works with Cloudflare D1

## License

MIT