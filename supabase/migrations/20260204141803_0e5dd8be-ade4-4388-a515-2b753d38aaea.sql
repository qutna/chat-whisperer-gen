-- Enable PostGIS extension for spatial functions used in get_impact_calculation_data and get_mode_shift_data
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;