export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      room_codes: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level_enum"]
          code: string
          room_id: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level_enum"]
          code: string
          room_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level_enum"]
          code?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_codes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          last_active_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_active_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_active_at?: string
        }
        Relationships: []
      }
      timers: {
        Row: {
          created_at: string
          current_round_number: number
          draft_time: number | null
          end_time: string
          event_name: string | null
          has_draft: boolean
          id: string
          is_running: boolean
          room_id: string
          round_time: number
          rounds: number
          time_remaining: number
        }
        Insert: {
          created_at?: string
          current_round_number: number
          draft_time?: number | null
          end_time: string
          event_name?: string | null
          has_draft?: boolean
          id?: string
          is_running?: boolean
          room_id: string
          round_time: number
          rounds: number
          time_remaining: number
        }
        Update: {
          created_at?: string
          current_round_number?: number
          draft_time?: number | null
          end_time?: string
          event_name?: string | null
          has_draft?: boolean
          id?: string
          is_running?: boolean
          room_id?: string
          round_time?: number
          rounds?: number
          time_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "timers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_round: {
        Args: { _timer_id: string }
        Returns: undefined
      }
      change_event_name: {
        Args: { _timer_id: string; _name: string }
        Returns: undefined
      }
      check_room_code: {
        Args: { room_code: string }
        Returns: boolean
      }
      create_room: {
        Args: Record<PropertyKey, never>
        Returns: {
          room_id: string
          access_level: Database["public"]["Enums"]["access_level_enum"]
          edit_code: string
          read_code: string
        }[]
      }
      create_timer: {
        Args: {
          _room_id: string
          _event_name: string
          _rounds: number
          _round_time: number
          _has_draft: boolean
          _draft_time?: number
        }
        Returns: {
          created_at: string
          current_round_number: number
          draft_time: number | null
          end_time: string
          event_name: string | null
          has_draft: boolean
          id: string
          is_running: boolean
          room_id: string
          round_time: number
          rounds: number
          time_remaining: number
        }[]
      }
      delete_timer: {
        Args: { _timer_id: string }
        Returns: undefined
      }
      generate_code: {
        Args: { length: number }
        Returns: string
      }
      get_timers: {
        Args: { _room_id: string }
        Returns: {
          created_at: string
          current_round_number: number
          draft_time: number | null
          end_time: string
          event_name: string | null
          has_draft: boolean
          id: string
          is_running: boolean
          room_id: string
          round_time: number
          rounds: number
          time_remaining: number
        }[]
      }
      join_room: {
        Args: { input_code: string }
        Returns: {
          room_id: string
          access_level: Database["public"]["Enums"]["access_level_enum"]
          read_code: string
          edit_code: string
        }[]
      }
      next_round: {
        Args: { _timer_id: string }
        Returns: undefined
      }
      pause_timer: {
        Args: { _timer_id: string; _pause_time: string }
        Returns: undefined
      }
      previous_round: {
        Args: { _timer_id: string }
        Returns: undefined
      }
      remove_round: {
        Args: { _timer_id: string }
        Returns: undefined
      }
      start_timer: {
        Args: { _timer_id: string; _start_time: string }
        Returns: undefined
      }
      update_end_time: {
        Args: { _timer_id: string; _time_modifier: number }
        Returns: undefined
      }
      update_last_active_at: {
        Args: { room_id: string }
        Returns: undefined
      }
    }
    Enums: {
      access_level_enum: "view" | "edit"
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
    Enums: {
      access_level_enum: ["view", "edit"],
    },
  },
} as const
