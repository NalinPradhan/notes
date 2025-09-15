# Multi-tenant SaaS Notes Application

A multi-tenant SaaS Notes Application that allows multiple organizations to manage notes securely.

## Architecture

This application is built with:

- Next.js 15+ for the frontend and API routes
- Supabase for database storage and management
- PostgreSQL database with direct SQL queries
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

- Node.js 18+ and npm
- Supabase account and project

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

3. Set up environment variables:

Create a `.env` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
JWT_SECRET=your-jwt-secret
```

4. Set up the database schema:

```bash
npm run setup:supabase
```

5. Seed the database:

```bash
npm run seed:supabase
```

6. Run the development server:

```bash
npm run dev
```

## Troubleshooting Common Issues

### Checking Environment Setup

If you're having issues with environment variables, run:

```bash
npm run check:env
```

This will verify that all required environment variables are set correctly.

### Testing Database Connection

If you're having issues connecting to Supabase, run:

```bash
npm run test:supabase
```

This will test the connection to your Supabase instance and verify that the required methods are working correctly.

### Login Issues in Production

If you're experiencing login failures on your deployed application, check the following:

1. **Environment Variables**: Make sure all environment variables are properly set in your Vercel project settings:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`

2. **Supabase Permissions**: Verify that your Supabase project has the correct Row Level Security (RLS) policies for your tables.

3. **Network Requests**: Check the browser's Network tab for any failed requests to your API routes.

4. **Logs**: Check Vercel logs for detailed error messages.

### "eq is not a function" Error

If you're seeing an error like `TypeError: supabaseAdmin.from(...).select(...).eq is not a function`, this typically means:

1. The Supabase client isn't properly initialized with valid credentials
2. Environment variables aren't correctly loaded in the production environment

Solutions:

- Verify environment variables are correctly set in Vercel
- Make sure you're not using dummy client implementations in production
- Check that the client is properly typed and initialized

## Deployment

### Deploying to Vercel

1. Create a Vercel project
2. Link it to your repository
3. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
4. Deploy the project

### Important Notes for Vercel Deployment

- Make sure all environment variables are added in the Vercel project settings
- Consider using Vercel's encrypted environment variables for sensitive keys
- If you update environment variables, you may need to redeploy your project

## Test Accounts

The seeded database includes the following test accounts:

- Admin users:

  - admin@acme.test (Acme tenant)
  - admin@globex.test (Globex tenant)

- Member users:
  - user@acme.test (Acme tenant)
  - user@globex.test (Globex tenant)

All accounts use the password: `password`
