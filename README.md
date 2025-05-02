# Baileys Store

Minimal Baileys data storage for your favorite DBMS built with Prisma. This library is a simple handler for Baileys event emitter that will listen and update your data in the database

## Requirements

- **Prisma** version **4.7.x** or higher
- **Baileys** version **5.x.x** or higher

## Supported Databases

- MySQL and PostgreSQL database should support the default schema out of the box
- For CockroachDB, you need to do this small change in the schema file

```diff prisma
model Session {
  pkId      BigInt    @id @default(autoincrement())
  sessionId String
  id        String
-  data      String @db.Text
+  data      String

  @@unique([sessionId, id], map: "unique_id_per_session_id_session")
  @@index([sessionId])
}
```

- For MongoDB, you need to follow [this convention](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference?query=getdmff&page=1#mongodb-10) and update the `pkId` field. Then follow the previous CockroachDB guide
- SQLite and SQL Server database are not supported since they didn't support Prisma's `JSON` scalar type

## Installation

```bash
# Using npm
npm i @kevineduardo/baileys-store

# Using yarn
yarn add @kevineduardo/baileys-store
```

## Setup

Before you can actually use this library, you have to setup your database first

1. Copy the `.env.example` file from this repository or from the `node_modules` directory (should be located at `node_modules/@kevineduardo/baileys-store/.env.example`). Rename it into `.env` and then update your [connection url](https://www.prisma.io/docs/reference/database-reference/connection-urls) in the `DATABASE_URL` field
1. Copy the `prisma` directory from this repository or from the `node_modules` directory (should be located at `node_modules/@kevineduardo/baileys-store/prisma/`). Additionaly, you may want to update your `provider` in the `schema.prisma` file if you're not using MySQL database
1. Run your [migration](https://www.prisma.io/docs/reference/api-reference/command-reference#prisma-migrate)

## Usage

```ts
import pino from 'pino';
import makeWASocket from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';
import { initStore, Store } from '@kevineduardo/baileys-store';

const logger = pino();
const socket = makeWASocket();
const prisma = new PrismaClient();

// You only need to run this once
initStore({
  prisma, // Prisma client instance
  logger, // Pino logger (Optional)
});

// Create a store and start listening to the events
const store = new Store('unique-session-id-here', socket.ev);

// Or create a store with custom storage options
const customStore = new Store('unique-session-id-here', socket.ev, {
  storeChats: true,     // Set to false to disable storing chats
  storeMessages: true,  // Set to false to disable storing messages
  storeContacts: false, // Set to false to disable storing contacts
});

// That's it, you can now query from the prisma client without having to worry about handling the events
const messages = prisma.message.findMany();
```

## Session Management

This library also provides a session store to manage your Baileys authentication credentials:

```ts
import makeWASocket from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';
import { initStore, useSession } from '@kevineduardo/baileys-store';

const prisma = new PrismaClient();
const sessionId = 'your-unique-session-id';

// Initialize the store
initStore({ prisma });

// Use the session to store auth state
const { state, saveCreds } = await useSession(sessionId);

// Create a WhatsApp socket with the session state
const socket = makeWASocket({
  auth: state,
  // ... other socket options
});

// Listen to credential updates
socket.ev.on('creds.update', saveCreds);

// You can now use your socket as normal
```

The session store will automatically save credentials to your database using Prisma, allowing you to maintain sessions between restarts.

## Combined Usage

You can use both the data store and session store together for a complete solution:

```ts
import makeWASocket from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';
import { initStore, Store, useSession } from '@kevineduardo/baileys-store';

const prisma = new PrismaClient();
const sessionId = 'your-unique-session-id';

// Initialize the store
initStore({ prisma });

// Use the session store for auth
const { state, saveCreds } = await useSession(sessionId);

// Create a WhatsApp socket
const socket = makeWASocket({
  auth: state,
  // ... other socket options
});

// Listen to credential updates
socket.ev.on('creds.update', saveCreds);

// Initialize the data store with storage options
const store = new Store(sessionId, socket.ev, {
  storeChats: true,
  storeMessages: true, 
  storeContacts: true,
});

// Now both your auth credentials and messages/chats/contacts 
// will be stored in the database
```

## Contributing

PRs, issues, suggestions, etc are welcome. Please kindly open a new issue to discuss it
