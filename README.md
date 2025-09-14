# Multi-tenant SaaS Notes Application

A multi-tenant SaaS Notes Application that allows multiple organizations to manage notes securely.

## Architecture

This application is built with:

- Next.js for the frontend and API routes
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

- Node.js 14+ and npm
- Supabase account and project

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd notesapp
```
