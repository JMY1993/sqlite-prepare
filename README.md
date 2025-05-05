# sqlite prepare

A tagged template literal styled sqlite query builder.

## Why choose this one?

No, you should probably use drizzle or prisma for robustness, typesafty, and ergonomics.

## Why do you build this?

For small and CRUD based projects, sometimes I want to use more flexible and faster ways to build APIs. These cases, setting up a schema would be a nuisance.

However writing raw sql is cumbersome, and the mismatching between the questions marks and the parameters is a pain.

(consider: `INSERT INTO panel_info (user, login_time, created_at, last_edited, recuring_period, ..., subscriptions) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`... so heart breaking to refactor)

With that being said, I will be more than appreciated and happy if you like this project by a newbie.

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
const getEntries = async (
  table: string,
  condition?: { field: string; value: any }
) => {
  const allowedTables = ["cache", "pages"];
  const sql = wrapD1(db);

  if (allowedTables.includes(table)) {
    let query = sql`SELECT * FROM ${raw(table)}`;

    if (condition) {
      query = sql`SELECT * FROM ${raw(table)} WHERE ${raw(condition.field)} = ${
        condition.value
      }`;
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

### Parsing parameters:

- Array: `[1, 2, 3, 4, 5] => (?, ?, ?, ?, ?) & [1, 2, 3, 4, 5]`
- Date: Only parameterize, value unchanged, SQLite parameter binding handles this conversion automatically
- Uint8Array | ArrayBuffer: Only parameterize, value unchanged, SQLite parameter binding handles this conversion automatically
- Normal javascript object: JSON.stringify

### SQL Fragments

Break down complex queries into reusable parts:

```typescript
import { fragment as f } from "sqlite-prepare";

const columns = f`id, name, created_at`;
const condition = f`status = ${"active"} AND type = ${"user"}`;

const query = sql`
  SELECT ${columns} 
  FROM users 
  WHERE ${condition}
`;
```

### Insert Builder

Type-safe insert operations:

```typescript
import { insert, into } from "sqlite-prepare";

//`insert` is just a wrapper which returns exactly the parameter it receives: `into("users")` will return `"users"`. This is only for semantic sake.

// Basic insert
const query = insert(into("users"), {
  // or: `const query = insert('users'`, into is actually not needed
  name: "John",
  age: 30,
});

// With raw SQL
const query = insert(into("users"), {
  created_at: raw("NOW()"),
});
```

### Enhanced Raw SQL

Raw SQL, with supports for parameterization:

```typescript
import { raw } from "sqlite-prepare";

// Parameterized raw SQL
const condition = raw('age > ? AND status = ?', [18, 'active']);
//or
const condition = raw('age > 18 AND status = 'active''); // not recommended
const query = sql`SELECT * FROM users WHERE ${condition}`;
```

### SQL Validation

Validate raw SQL queries:

```typescript
import { validate as v } from "sqlite-prepare";
//or use alias
import { v } from "sqlite-prepare";

// Validate against allowed queries
const allowed = ["SELECT * FROM users", "SELECT * FROM posts"];
const validated = v("SELECT * FROM users", allowed);

// Custom validator function
const isSelect = (sql: string) => sql.toLowerCase().startsWith("select");
const validated = v("SELECT * FROM users", isSelect);
```

String validators can be used againt both string and RawSQL. It only checks the query part for the latter one, the params are ignored.

Validator functions also supports `(sqlQuery: RawSQL, parsed: true) => boolean`, if you also want to check the params. If the second parameter is passed (no matter true or false), the validate function will pass the entire RawSQL to it.

### Discover more at the test suites and the source code.

### Database Compatibility

Now tested and works with:

- Cloudflare D1
- better-sqlite3
- Bun's SQLite API

```typescript
// With better-sqlite3
import Database from "better-sqlite3";
const db = new Database("mydb.sqlite");
const query = prepare(db)`SELECT * FROM users WHERE age > ${18}`;
const results = query.all();
```

## License

MIT
