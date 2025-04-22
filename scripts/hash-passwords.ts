import { db }            from "../server/db";          // ваш drizzle-объект
import { hashPassword }  from "../server/auth";        // функция из auth.ts
import * as schema       from "../shared/schema";      // таблицы Drizzle
import { eq }            from "drizzle-orm";           // оператор для WHERE

async function main() {
  // 1. Берём всех пользователей
  const users = await db.select().from(schema.users);

  for (const u of users) {
    // 2. Если пароль уже в формате "hash.salt" — пропускаем
    if (typeof u.password === "string" && u.password.includes(".")) {
      continue;
    }

    console.log(`Пользователь ${u.username}: старый пароль="${u.password}" → создаём хеш…`);
    // 3. Хешируем и кладём обратно
    const newHash = await hashPassword(u.password);
    await db
      .update(schema.users)
      .set({ password: newHash })
      .where(eq(schema.users.id, u.id));

    console.log(`  → обновлено: ${newHash}`);
  }

  console.log("Готово.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});