# Multi-tenant SaaS Notes Application

A multi-tenant SaaS Notes Application that allows multiple organizations to manage notes securely.

## Architecture

This application is built with:

- Next.js for the frontend and API routes
- PostgreSQL database with Prisma ORM
- JWT for authentication
- Deployed on Vercel

## Multi-tenancy Approach

This application uses a **shared schema with tenant ID columns** approach for multi-tenancy. This approach was chosen for:

1. **Simplified Database Management**: A single database schema is easier to maintain, upgrade, and back up.
2. **Efficient Resource Utilization**: Better resource utilization compared to database-per-tenant.
3. **Scalability**: Can handle many tenants without excessive database connections.
4. **Query Simplicity**: Tenant filtering is done via a simple WHERE clause.

With this approach, every data model includes a `tenantId` field, and all queries filter by this field to ensure tenant isolation.

## Setup Instructions

### Prerequisites

- Node.js 14+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd notesapp
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your database connection:

```
DATABASE_URL="postgresql://username:password@localhost:5432/notesapp"
JWT_SECRET="your-secret-key"
```

4. Set up the database:

```bash
npx prisma migrate dev --name init
npm run seed
```

5. Run the development server:

```bash
npm run dev
```

### Test Accounts

The application comes with the following test accounts (all with password: `password`):

- admin@acme.test (Admin, tenant: Acme)
- user@acme.test (Member, tenant: Acme)
- admin@globex.test (Admin, tenant: Globex)
- user@globex.test (Member, tenant: Globex)

## Features

- **Multi-tenant isolation**: Data from one tenant is never accessible to another
- **Role-based access control**: Admin and Member roles
- **JWT-based authentication**
- **Subscription plans**: Free (3 notes limit) and Pro (unlimited notes)
- **CRUD operations for notes**
- **Responsive UI**

## API Endpoints

- `GET /api/health`: Health check endpoint
- `POST /api/auth/login`: Login endpoint
- `GET /api/notes`: Get all notes for current tenant
- `POST /api/notes`: Create a new note
- `GET /api/notes/:id`: Get a specific note
- `PUT /api/notes/:id`: Update a note
- `DELETE /api/notes/:id`: Delete a note
- `POST /api/tenants/:slug/upgrade`: Upgrade tenant subscription (Admin only)
