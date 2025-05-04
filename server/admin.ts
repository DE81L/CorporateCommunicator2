import AdminJS from 'adminjs'
import { DrizzleAdapter } from '@adminjs/drizzle'
import { drizzle } from 'drizzle-orm/node-postgres'
import { pool } from './db'
import { departments, users } from '@shared/schema'
import AdminJSExpress from '@adminjs/express'

AdminJS.registerAdapter(DrizzleAdapter)

const db = drizzle(pool)

const admin = new AdminJS({
  databases: [db],
  resources: [
    { resource: departments, options: { parent: { name: 'Org' } } },
    { resource: users, options: { 
      parent: { name: 'Org' },
      properties: {
        password: { isVisible: false },
        isAdmin: { 
          isVisible: true,
          isTitle: false
        }
      }
    }}
  ],
  rootPath: '/admin',
  dashboard: {
    component: AdminJS.bundle('./components/dashboard')
  }
})

const authenticate = async (email: string, password: string) => {
  const userRecord = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email)
  })

  if (userRecord && userRecord.isAdmin === true) {
    return true
  }
  return false
}

export const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate,
    cookieName: 'adminjs',
    cookiePassword: process.env.ADMIN_COOKIE_SECRET || 'complex-secure-secret'
  },
  null,
  {
    resave: false,
    saveUninitialized: true
  }
)

export { admin }
