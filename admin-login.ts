import { db } from './db'

export async function checkIsAdmin(email: string) {
  const userRecord = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email)
  })
  return userRecord?.isAdmin === true
}