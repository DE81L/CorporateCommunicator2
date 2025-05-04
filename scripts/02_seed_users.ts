// scripts/02_seed_users.ts
import { db } from "../server/db";
import { hashPassword } from "../server/auth";        // already proven to work ✔
import {
  users,
  departments,
} from "../shared/electron-shared/schema";
import { eq } from "drizzle-orm";

async function ensureDepartments() {
  // 1 = HR, 2 = IT – adjust if you nuked / renumbered them
  await db.insert(departments).values([
    { id: 1, name: "HR" },
    { id: 2, name: "IT" },
  ]).onConflictDoNothing();
}

async function seedUsers() {
  // don’t create duplicates if someone ran the script before
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(
      eq(users.username, "alice") // any of them is enough to know we seeded
    );

  if (existing.length) {
    console.log("🙈   Demo users already exist – nothing to do.");
    return;
  }

  const alicePwd = await hashPassword("123456");   // 👉 change if you want
  const bobPwd   = await hashPassword("654321");

  await db.insert(users).values([
    {
      username:   "alice",
      email:      "alice@example.com",
      password:   alicePwd,
      firstName:  "Alice",
      lastName:   "Johnson",
      departmentId: 1,                // HR
      jobTitle:   "Recruiter",
      language:   "en",
      isAdmin:    false,
    },
    {
      username:   "bob",
      email:      "bob@example.com",
      password:   bobPwd,
      firstName:  "Bob",
      lastName:   "Smith",
      departmentId: 2,                // IT
      jobTitle:   "Software Engineer",
      language:   "en",
      isAdmin:    true,               // make Bob an admin so you can log in everywhere
    },
  ]);

  console.log("✅   Demo users inserted.");
}

(async () => {
  await ensureDepartments();
  await seedUsers();
  process.exit(0);
})();
