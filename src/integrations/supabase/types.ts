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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_mode_shift_data: {
        Args: {
          p_filter_days_of_week?: number[]
          p_filter_duration_buckets?: string[]
          p_filter_incentive_ids?: string[]
          p_filter_months?: string[]
          p_filter_providers?: string[]
          p_filter_time_slots?: string[]
          p_filter_vehicle_types?: string[]
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
          p_filter_days_of_week?: number[]
          p_filter_duration_buckets?: string[]
          p_filter_incentive_ids?: string[]
          p_filter_months?: string[]
          p_filter_providers?: string[]
          p_filter_time_slots?: string[]
          p_filter_vehicle_types?: string[]
          p_metric: string
        }
        Returns: {
          dimension: string
          value: number
        }[]
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
