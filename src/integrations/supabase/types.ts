export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      impact_rate_settings: {
        Row: {
          access: number
          co2: number
          congestion_non_rush: number
          congestion_rush: number
          health: number
          id: string
          mode: string
          space_suburban: number
          space_urban: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access: number
          co2: number
          congestion_non_rush: number
          congestion_rush: number
          health: number
          id?: string
          mode: string
          space_suburban: number
          space_urban: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access?: number
          co2?: number
          congestion_non_rush?: number
          congestion_rush?: number
          health?: number
          id?: string
          mode?: string
          space_suburban?: number
          space_urban?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      incentives: {
        Row: {
          amount: number
          brief_name: string
          business_model: string | null
          created_at: string | null
          days_of_week: number[] | null
          description: string | null
          end_location_description: string | null
          id: string
          name: string
          numeric_id: number
          propulsion_types: string[] | null
          providers: string[] | null
          start_location_description: string | null
          status: string | null
          time_end: string | null
          time_start: string | null
          valid_from: string
          valid_to: string
          vehicle_types: string[] | null
        }
        Insert: {
          amount: number
          brief_name?: string
          business_model?: string | null
          created_at?: string | null
          days_of_week?: number[] | null
          description?: string | null
          end_location_description?: string | null
          id?: string
          name: string
          numeric_id?: number
          propulsion_types?: string[] | null
          providers?: string[] | null
          start_location_description?: string | null
          status?: string | null
          time_end?: string | null
          time_start?: string | null
          valid_from: string
          valid_to: string
          vehicle_types?: string[] | null
        }
        Update: {
          amount?: number
          brief_name?: string
          business_model?: string | null
          created_at?: string | null
          days_of_week?: number[] | null
          description?: string | null
          end_location_description?: string | null
          id?: string
          name?: string
          numeric_id?: number
          propulsion_types?: string[] | null
          providers?: string[] | null
          start_location_description?: string | null
          status?: string | null
          time_end?: string | null
          time_start?: string | null
          valid_from?: string
          valid_to?: string
          vehicle_types?: string[] | null
        }
        Relationships: []
      }
      rush_hour_settings: {
        Row: {
          day_of_week: number
          evening_end: string | null
          evening_start: string | null
          id: string
          is_enabled: boolean | null
          morning_end: string | null
          morning_start: string | null
          updated_at: string | null
        }
        Insert: {
          day_of_week: number
          evening_end?: string | null
          evening_start?: string | null
          id?: string
          is_enabled?: boolean | null
          morning_end?: string | null
          morning_start?: string | null
          updated_at?: string | null
        }
        Update: {
          day_of_week?: number
          evening_end?: string | null
          evening_start?: string | null
          id?: string
          is_enabled?: boolean | null
          morning_end?: string | null
          morning_start?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_surveys: {
        Row: {
          created_at: string | null
          id: string
          is_mock_data: boolean | null
          previous_mode: string
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_mock_data?: boolean | null
          previous_mode: string
          trip_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_mock_data?: boolean | null
          previous_mode?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_surveys_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
        ]
      }
      trips: {
        Row: {
          accuracy: number
          actual_cost: number | null
          created_at: string
          currency: string | null
          device_id: string
          end_location: Json
          end_time: string
          incentive_id: string | null
          propulsion_types: string[]
          provider_id: string
          provider_name: string
          route: Json
          standard_cost: number | null
          start_location: Json
          start_time: string
          trip_distance: number
          trip_duration: number
          trip_id: string
          vehicle_type: string
        }
        Insert: {
          accuracy: number
          actual_cost?: number | null
          created_at?: string
          currency?: string | null
          device_id: string
          end_location: Json
          end_time: string
          incentive_id?: string | null
          propulsion_types: string[]
          provider_id: string
          provider_name: string
          route: Json
          standard_cost?: number | null
          start_location: Json
          start_time: string
          trip_distance: number
          trip_duration: number
          trip_id: string
          vehicle_type: string
        }
        Update: {
          accuracy?: number
          actual_cost?: number | null
          created_at?: string
          currency?: string | null
          device_id?: string
          end_location?: Json
          end_time?: string
          incentive_id?: string | null
          propulsion_types?: string[]
          provider_id?: string
          provider_name?: string
          route?: Json
          standard_cost?: number | null
          start_location?: Json
          start_time?: string
          trip_distance?: number
          trip_duration?: number
          trip_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_incentive_id_fkey"
            columns: ["incentive_id"]
            isOneToOne: false
            referencedRelation: "incentives"
            referencedColumns: ["id"]
          },
        ]
      }
      urban_area_settings: {
        Row: {
          id: string
          name: string
          polygon: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string
          polygon: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          polygon?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_rush_hour_percent: {
        Args: {
          p_end_time: string
          p_start_time: string
          p_trip_duration: number
        }
        Returns: number
      }
      get_aggregated_routes: {
        Args: {
          p_end_lat?: number
          p_end_lng?: number
          p_end_radius_meters?: number
          p_filter_days_of_week?: number[]
          p_filter_duration_buckets?: string[]
          p_filter_incentive_ids?: string[]
          p_filter_months?: string[]
          p_filter_providers?: string[]
          p_filter_time_slots?: string[]
          p_filter_vehicle_types?: string[]
          p_grid_size_deg: number
          p_max_lat: number
          p_max_lng: number
          p_min_lat: number
          p_min_lng: number
          p_min_trips?: number
          p_start_lat?: number
          p_start_lng?: number
          p_start_radius_meters?: number
        }
        Returns: {
          avg_distance: number
          end_lat: number
          end_lng: number
          start_lat: number
          start_lng: number
          trip_count: number
        }[]
      }
      get_impact_calculation_data: {
        Args: {
          p_end_lat?: number
          p_end_lng?: number
          p_end_radius_meters?: number
          p_filter_days_of_week?: number[]
          p_filter_duration_buckets?: string[]
          p_filter_incentive_ids?: string[]
          p_filter_months?: string[]
          p_filter_providers?: string[]
          p_filter_time_slots?: string[]
          p_filter_vehicle_types?: string[]
          p_start_lat?: number
          p_start_lng?: number
          p_start_radius_meters?: number
        }
        Returns: {
          avg_rush_hour_percent: number
          avg_urban_percent: number
          extrapolated_distance_km: number
          extrapolated_trip_count: number
          previous_mode: string
          total_distance_km: number
          trip_count: number
        }[]
      }
      get_incentive_trip_summary: {
        Args: {
          p_end_lat?: number
          p_end_lng?: number
          p_end_radius_meters?: number
          p_filter_days_of_week?: number[]
          p_filter_duration_buckets?: string[]
          p_filter_incentive_ids?: string[]
          p_filter_months?: string[]
          p_filter_providers?: string[]
          p_filter_time_slots?: string[]
          p_filter_vehicle_types?: string[]
          p_start_lat?: number
          p_start_lng?: number
          p_start_radius_meters?: number
        }
        Returns: {
          incentive_amount: number
          incentive_id: string
          incentive_name: string
          numeric_id: number
          total_earnings: number
          trip_count: number
        }[]
      }
      get_mode_shift_data: {
        Args: {
          p_end_lat?: number
          p_end_lng?: number
          p_end_radius_meters?: number
          p_filter_days_of_week?: number[]
          p_filter_duration_buckets?: string[]
          p_filter_incentive_ids?: string[]
          p_filter_months?: string[]
          p_filter_providers?: string[]
          p_filter_time_slots?: string[]
          p_filter_vehicle_types?: string[]
          p_start_lat?: number
          p_start_lng?: number
          p_start_radius_meters?: number
        }
        Returns: {
          bike_type: string
          extrapolated_count: number
          previous_mode: string
          surveyed_count: number
        }[]
      }
      get_trip_aggregation: {
        Args: {
          p_dimension: string
          p_end_lat?: number
          p_end_lng?: number
          p_end_radius_meters?: number
          p_filter_days_of_week?: number[]
          p_filter_duration_buckets?: string[]
          p_filter_incentive_ids?: string[]
          p_filter_months?: string[]
          p_filter_providers?: string[]
          p_filter_time_slots?: string[]
          p_filter_vehicle_types?: string[]
          p_metric: string
          p_min_aggregation_threshold?: number
          p_start_lat?: number
          p_start_lng?: number
          p_start_radius_meters?: number
        }
        Returns: {
          dimension: string
          value: number
        }[]
      }
      get_trip_summary_for_export: {
        Args: {
          p_end_lat?: number
          p_end_lng?: number
          p_end_radius_meters?: number
          p_filter_days_of_week?: number[]
          p_filter_duration_buckets?: string[]
          p_filter_incentive_ids?: string[]
          p_filter_months?: string[]
          p_filter_providers?: string[]
          p_filter_time_slots?: string[]
          p_filter_vehicle_types?: string[]
          p_start_lat?: number
          p_start_lng?: number
          p_start_radius_meters?: number
        }
        Returns: {
          avg_distance: number
          avg_duration: number
          bike_type: string
          day_of_week: string
          duration_bucket: string
          hour_of_day: string
          month: string
          provider_name: string
          total_distance: number
          total_duration: number
          trip_count: number
        }[]
      }
      point_in_copenhagen_urban: {
        Args: { p_lat: number; p_lng: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
