UPDATE trips 
SET 
  start_time = start_time - INTERVAL '1 year',
  end_time = end_time - INTERVAL '1 year'
WHERE vehicle_type = 'cargo_bike';