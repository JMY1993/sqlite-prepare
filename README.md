# D1 Query Builder

A thin helper which builds parameterized tagged template literal query.

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
import { build, prepare } from "sqlite-prepare";

// Create a simple query with parameters
const query = build`
  SELECT * FROM users 
  WHERE age > ${21} 
  AND status = ${"active"}
`;

// Execute with Cloudflare D1
const results = await prepare(db, query).all();

// Or

const sql = wrapD1(db);
const query = await sql`
  SELECT * FROM users 
  WHERE age > ${21} 
  AND status = ${"active"}
`.all();

// Nested queries
const subquery = build`SELECT id FROM users WHERE age > ${21}`;
const mainQuery = build`SELECT * FROM posts WHERE author_id IN ${subquery}`;
const posts = await prepare(db, mainQuery).all();

// Raw SQL (use carefully, in case of sql injection)
import { raw } from "sqlite-prepare";
const rawQuery = build`SELECT * FROM ${raw("users")}`;

// example: use raw to create generically dynamic query functions:
const newestEntry = async (table: string) => {
  const allowedTables = ["cache", "pages"];
  const sql = wrapD1(db);
  if (allowedTables.includes(table)) {
    const query = await sql`
      SELECT * FROM ${raw(table)} 
      WHERE age > ${21} 
      AND status = ${"active"}
    `.all();
  } else {
    throw new Error("Illegal operation!");
  }
};

// example: use raw to create queries with optional conditions:
const getEntries = async (table: string, condition?: { field: string, value: any }) => {
  const allowedTables = ["cache", "pages"];
  const sql = wrapD1(db);
  
  if (allowedTables.includes(table)) {
    let query = sql`SELECT * FROM ${raw(table)}`;
    
    if (condition) {
      query = sql`SELECT * FROM ${raw(table)} WHERE ${raw(condition.field)} = ${condition.value}`;
    }
    
    return await query.all();
  } else {
    throw new Error("Illegal operation!");
  }
};
```

## Syntax Highlighting
[Inline SQL](https://marketplace.visualstudio.com/items/?itemName=qufiwefefwoyn.inline-sql-syntax) is a very nice vscode extension, enabling inline sqlite syntax highlighting for not only html but also jsx and tsx files.

(There are tons of such extensions. Search at the marketplace if you want to try them out. )

## Features

- Parsing parameters:
  * Array: `[1, 2, 3, 4, 5] => (?, ?, ?, ?, ?) & [1, 2, 3, 4, 5]`
  * Date: Only parameterize, value unchanged, SQLite parameter binding handles this conversion automatically
  * Uint8Array | ArrayBuffer: Only parameterize, value unchanged, SQLite parameter binding handles this conversion automatically
  * Normal javascript object: JSON.stringify
- Parameterized queries for SQL injection protection
- Support for nested subqueries
- Works with Cloudflare D1

## License

MIT
