

# Fix Impact Rate Settings Update Failure

## Problem Identified
The update mutation fails with error `PGRST116: The result contains 0 rows` because:

1. **RLS Policy Requires Authentication**: The `impact_rate_settings` table has an UPDATE policy that only allows `authenticated` users
2. **No Authentication Implemented**: The app has no login/signup flow, so all requests use the anonymous key
3. **Anonymous Users Cannot Update**: When the UPDATE runs, RLS blocks it, returning 0 affected rows, which causes `.single()` to fail

## Solution Options

### Option A: Enable Anonymous Updates (Quick Fix)
Modify the RLS policy to allow anonymous updates for development/testing purposes.

| Pros | Cons |
|------|------|
| Quick to implement | Less secure |
| No code changes needed | Not suitable for production |

### Option B: Implement Authentication (Recommended for Production)
Add a proper login flow so users can authenticate before editing settings.

| Pros | Cons |
|------|------|
| Secure | More work to implement |
| Production-ready | Requires UI changes |

---

## Recommended Approach: Quick Fix for Now

Since this is an admin settings page and appears to be in development, I recommend temporarily enabling anonymous updates on this table, with a note to add authentication later.

### Database Change
Update the RLS policy to allow all users to update (not just authenticated):

```sql
DROP POLICY IF EXISTS "Authenticated users can update impact rate settings" 
  ON impact_rate_settings;

CREATE POLICY "Anyone can update impact rate settings" 
  ON impact_rate_settings 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);
```

### Code Improvement (Optional)
Also improve the hook to handle edge cases better by not requiring `.single()`:

```typescript
// Remove .single() to avoid error when no rows affected
const { data, error } = await supabase
  .from("impact_rate_settings")
  .update({...})
  .eq("mode", setting.mode)
  .select();

if (error) throw error;
if (!data || data.length === 0) {
  throw new Error("No matching rate setting found");
}
return data[0];
```

---

## Files to Modify
- Database migration: Update RLS policy for `impact_rate_settings`
- `src/hooks/useImpactRateSettings.ts`: Improve error handling (optional)

---

## Expected Result
After this fix:
1. Clicking a cell to edit will work
2. Saving changes will persist to the database
3. The success toast "Impact rate updated successfully" will appear
4. The cycling health rate (currently €1.00/km) can be reduced as you originally requested

