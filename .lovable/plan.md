

# Fix Impact Metrics: Enable PostGIS Extension

## Problem Identified

The Impact Metrics and Mode Shift Sankey are failing with the error:
```
type "geography" does not exist
```

This occurs because the database functions `get_impact_calculation_data` and `get_mode_shift_data` use PostGIS spatial functions for location-based filtering, but **the PostGIS extension was never enabled**.

| Function | PostGIS Usage |
|----------|---------------|
| `get_impact_calculation_data` | `ST_DWithin`, `ST_MakePoint`, `ST_SetSRID`, `::geography` |
| `get_mode_shift_data` | `ST_DWithin`, `ST_MakePoint`, `ST_SetSRID`, `::geography` |

These functions use PostGIS to filter trips by start/end location radius, but since the extension isn't installed, any call to these functions fails - even when location filters aren't being used.

---

## Solution

Enable the PostGIS extension in the database. This is a simple one-line migration that will:
1. Install the PostGIS extension
2. Make the `geography` type and spatial functions available
3. Allow the existing database functions to execute properly

---

## What Will Change

### Database Migration
A single SQL statement to enable PostGIS:

```sql
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
```

No code changes are required - the database functions already use PostGIS correctly, they just need the extension to be available.

---

## Expected Result
After applying this fix:
- Impact Metrics will display correctly on the Impacts page
- Mode Shift Sankey diagram will load and show data
- Location-based filtering will work properly throughout the application

