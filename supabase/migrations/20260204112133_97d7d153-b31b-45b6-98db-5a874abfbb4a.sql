-- Link all bicycle trips to Bike Sharing incentive (numeric_id = 1)
UPDATE trips 
SET incentive_id = (SELECT id FROM incentives WHERE numeric_id = 1)
WHERE vehicle_type = 'bicycle' 
  AND incentive_id IS NULL;

-- Link all cargo_bike trips to Cargo Bike Lease incentive (numeric_id = 2)
UPDATE trips 
SET incentive_id = (SELECT id FROM incentives WHERE numeric_id = 2)
WHERE vehicle_type = 'cargo_bike' 
  AND incentive_id IS NULL;