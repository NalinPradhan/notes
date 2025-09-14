-- SQL migration script for Supabase

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Tenant table
CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE
);

-- Create index on User.tenantId
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User" ("tenantId");

-- Create Note table
CREATE TABLE IF NOT EXISTS "Note" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tenantId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Create indexes on Note.tenantId and Note.userId
CREATE INDEX IF NOT EXISTS "Note_tenantId_idx" ON "Note" ("tenantId");
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note" ("userId");

-- Create trigger to update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenant_updated_at
BEFORE UPDATE ON "Tenant"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_note_updated_at
BEFORE UPDATE ON "Note"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();
