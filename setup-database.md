# ClaMax DTRIS Database Setup

## Quick Setup Instructions

### Step 1: Access Your Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your ClaMax DTRIS project

### Step 2: Run the Database Migration
1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Copy the entire content from the `database-setup.sql` file in your project
4. Paste it into the SQL Editor
5. Click **"Run"** to execute the migration

### Step 3: Verify the Setup
1. Go to **"Table Editor"** in the left sidebar
2. You should see these tables:
   - `users`
   - `vehicles`
   - `vehicle_documents`
   - `inspections`
   - `incidents`
   - `payments`
   - `device_tokens`
   - `announcements`

### Step 4: Create Your First Admin User
1. Go back to **"SQL Editor"**
2. Run this query (replace with your email):

```sql
INSERT INTO users (id, email, name, role, created_at) 
VALUES (
  gen_random_uuid(), 
  'your-email@example.com', 
  'Admin User', 
  'admin', 
  now()
);
```

### Step 5: Test the App
1. Go back to your app
2. Refresh the page
3. The "Failed to load" errors should be gone
4. Try adding a user - it should work now!

## Troubleshooting

### If you get "permission denied" errors:
- Make sure you have admin access to your Supabase project
- Check that you're logged in with the correct account

### If tables don't appear after running the migration:
- Check the SQL Editor for any error messages
- Make sure you copied the entire content from `database-setup.sql`
- Try running the migration again

### If the app still shows "Failed to load":
- Make sure you created the admin user
- Check that your Supabase URL and API keys are correct in the app configuration

## What This Migration Creates

The migration sets up:
- ✅ User management with role-based access
- ✅ Vehicle registration system
- ✅ Document storage for vehicles
- ✅ Inspection records
- ✅ Incident reporting
- ✅ Payment tracking
- ✅ Push notification support
- ✅ System announcements
- ✅ Security policies for data protection

Once this is set up, all the "Add User" and other functionality will work properly! 