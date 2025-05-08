import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

export async function connectDb() {
  await client.connect();
}

export { client };
