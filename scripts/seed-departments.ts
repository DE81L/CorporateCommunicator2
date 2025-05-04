import { db } from '../server/db';
import { departments } from '../shared/electron-shared/schema';

async function seedDepartments() {
  const defaultDepartments = [
    { name: 'Engineering' },
    { name: 'Marketing' },
    { name: 'Human Resources' },
    { name: 'Executive' }
  ];

  for (const dept of defaultDepartments) {
    await db.insert(departments).values(dept).onConflictDoNothing();
  }

  console.log('Departments seeded successfully');
}

seedDepartments().catch(console.error);
