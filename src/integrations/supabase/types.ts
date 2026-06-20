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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          business_name: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_activity_at: string
          lead_code: string
          mobile: string
          name: string
          notes: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          wa_status: Database["public"]["Enums"]["wa_status"]
        }
        Insert: {
          assigned_to?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_activity_at?: string
          lead_code?: string
          mobile: string
          name: string
          notes?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          wa_status?: Database["public"]["Enums"]["wa_status"]
        }
        Update: {
          assigned_to?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_activity_at?: string
          lead_code?: string
          mobile?: string
          name?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          wa_status?: Database["public"]["Enums"]["wa_status"]
        }
        Relationships: []
      }
      message_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["message_event_type"]
          id: string
          lead_id: string
          message_id: string | null
          metadata: Json | null
          occurred_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: Database["public"]["Enums"]["message_event_type"]
          id?: string
          lead_id: string
          message_id?: string | null
          metadata?: Json | null
          occurred_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["message_event_type"]
          id?: string
          lead_id?: string
          message_id?: string | null
          metadata?: Json | null
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          api_response: Json | null
          body: string | null
          created_at: string
          delivered_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          error: string | null
          failed_at: string | null
          id: string
          lead_id: string
          phone: string
          read_at: string | null
          replied_at: string | null
          retry_count: number
          sent_at: string | null
          status: Database["public"]["Enums"]["wa_status"]
          template_name: string | null
          updated_at: string
          wa_message_id: string | null
        }
        Insert: {
          api_response?: Json | null
          body?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          error?: string | null
          failed_at?: string | null
          id?: string
          lead_id: string
          phone: string
          read_at?: string | null
          replied_at?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["wa_status"]
          template_name?: string | null
          updated_at?: string
          wa_message_id?: string | null
        }
        Update: {
          api_response?: Json | null
          body?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          error?: string | null
          failed_at?: string | null
          id?: string
          lead_id?: string
          phone?: string
          read_at?: string | null
          replied_at?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["wa_status"]
          template_name?: string | null
          updated_at?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          language: string
          name: string
          updated_at: string
          variables: Json
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          language?: string
          name: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          language?: string
          name?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wa_retry_queue: {
        Row: {
          attempts: number
          created_at: string
          done: boolean
          id: string
          last_error: string | null
          lead_id: string
          max_attempts: number
          message_id: string
          next_attempt_at: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          done?: boolean
          id?: string
          last_error?: string | null
          lead_id: string
          max_attempts?: number
          message_id: string
          next_attempt_at?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          done?: boolean
          id?: string
          last_error?: string | null
          lead_id?: string
          max_attempts?: number
          message_id?: string
          next_attempt_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_retry_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_retry_queue_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          error: string | null
          headers: Json | null
          id: string
          payload: Json
          processed: boolean
          source: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          headers?: Json | null
          id?: string
          payload: Json
          processed?: boolean
          source: string
        }
        Update: {
          created_at?: string
          error?: string | null
          headers?: Json | null
          id?: string
          payload?: Json
          processed?: boolean
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "sales_executive"
      lead_source:
        | "justdial"
        | "website"
        | "webhook"
        | "email"
        | "csv"
        | "manual"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "won"
        | "lost"
      message_direction: "outbound" | "inbound"
      message_event_type:
        | "queued"
        | "sending"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "replied"
        | "assigned"
        | "note"
        | "status_change"
      wa_status:
        | "pending"
        | "sending"
        | "sent"
        | "delivered"
        | "read"
        | "replied"
        | "failed"
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
      app_role: ["admin", "manager", "sales_executive"],
      lead_source: [
        "justdial",
        "website",
        "webhook",
        "email",
        "csv",
        "manual",
        "other",
      ],
      lead_status: ["new", "contacted", "qualified", "proposal", "won", "lost"],
      message_direction: ["outbound", "inbound"],
      message_event_type: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "read",
        "failed",
        "replied",
        "assigned",
        "note",
        "status_change",
      ],
      wa_status: [
        "pending",
        "sending",
        "sent",
        "delivered",
        "read",
        "replied",
        "failed",
      ],
    },
  },
} as const
