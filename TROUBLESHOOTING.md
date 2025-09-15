# Troubleshooting Guide: Authentication and Supabase Issues

This guide helps you resolve common authentication and Supabase connection issues in the NotesApp application.

## Common Issues

### 1. Login Timeout Errors

**Symptoms:**

- Login request hangs and then times out
- Error: "Task timed out after 300 seconds"
- Log showing: "Using dummy Supabase client"

**Solutions:**

1. **Check Environment Variables**:

   ```bash
   npm run check:env
   ```

   Ensure all required variables are set:

   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_KEY
   - JWT_SECRET

2. **Test Supabase Connection**:

   ```bash
   npm run test:supabase
   ```

   This should connect successfully to your Supabase project.

3. **Verify Vercel Deployment Variables**:

   ```bash
   vercel env ls
   ```

   All four environment variables should be listed.

4. **Redeploy After Environment Changes**:
   ```bash
   vercel --prod
   ```
   Environment changes require redeployment.

### 2. "eq is not a function" Error

**Symptoms:**

- Error logs: "TypeError: supabaseAdmin.from(...).select(...).eq is not a function"
- Authentication failures

**Solutions:**

1. **Check Supabase Client Implementation**:
   The application has been updated to handle this error, but if it persists:

   ```bash
   npm run debug:login
   ```

   Look for any log messages about using a dummy client.

2. **Direct Creation of Supabase Client**:
   The application will now attempt to create a direct client if the primary one fails.

3. **Check Environment Variables**:
   Incorrect or missing environment variables are the most common cause.

4. **Timeout Implementation**:
   The application now has timeout handling to prevent hanging operations.

### 3. General Authentication Issues

**Symptoms:**

- Unable to log in with correct credentials
- Authentication API returns errors

**Solutions:**

1. **Check User Exists**:
   Verify the user exists in your Supabase database.

2. **Verify Password**:
   All test users have the password: `password`

3. **JWT Secret**:
   Ensure JWT_SECRET is consistent between development and production.

4. **Browser Developer Tools**:
   Check Network tab for specific API response errors.

## Vercel-Specific Issues

### 1. Environment Variable Scope

Ensure variables are accessible in both:

- Build Environment
- Runtime Environment

### 2. Enable Debug Logging

```bash
vercel env add DEBUG_SUPABASE true
vercel --prod
```

### 3. Inspect Vercel Logs

```bash
vercel logs
```

## Supabase-Specific Issues

### 1. Row-Level Security (RLS) Policies

Check that your RLS policies aren't blocking authenticated requests.

### 2. Service Key vs Anon Key

- SUPABASE_SERVICE_KEY: Used for admin operations (unrestricted)
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Used for client operations (restricted by RLS)

### 3. Database Table Structure

Ensure your database has the expected schema:

```bash
npm run setup:supabase
```

## Getting Additional Help

If issues persist after trying these solutions:

1. Check the application logs for specific error messages
2. Review the Supabase documentation for your specific error
3. Ensure your Supabase project is on an active plan (not paused)
4. Verify network connectivity between Vercel and Supabase
