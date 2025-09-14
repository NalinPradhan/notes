# Supabase Setup for Notes App

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up/login
2. Create a new project
3. Note down the project URL, API keys, and database connection details

### 2. Set Up Environment Variables

Update your `.env` file with the proper Supabase credentials:

```
# Supabase Database URL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"

# Authentication
JWT_SECRET="your-secret-key-change-in-production"

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 3. Create Database Schema

You can set up the database schema in two ways:

#### Option A: Using the setup script (May not work in all environments)

Run the setup script to create the database schema:

```bash
npm run setup:supabase
```

#### Option B: Manually through Supabase SQL Editor (Recommended)

1. Go to the Supabase Dashboard > SQL Editor
2. Create a new query
3. Paste the contents of `scripts/supabase-schema.sql`
4. Run the query to create your tables and triggers

### 4. Seed the Database

Run the seed script to populate the database with test data:

```bash
npm run seed:supabase
```

### 5. Testing the Application

Once everything is set up, you can run the development server:

```bash
npm run dev
```

### Test Accounts

- **Acme Corporation**:

  - Admin: admin@acme.test (Password: password)
  - User: user@acme.test (Password: password)

- **Globex Corporation**:
  - Admin: admin@globex.test (Password: password)
  - User: user@globex.test (Password: password)
