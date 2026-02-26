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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          base_credit_cost: number
          category: string
          config_schema: Json | null
          created_at: string
          creator_id: string | null
          description: string
          icon_url: string | null
          id: string
          is_published: boolean
          long_description: string | null
          name: string
          rating: number | null
          required_credentials: string[] | null
          slug: string
          total_deployments: number | null
          updated_at: string
          version: string | null
        }
        Insert: {
          base_credit_cost?: number
          category: string
          config_schema?: Json | null
          created_at?: string
          creator_id?: string | null
          description: string
          icon_url?: string | null
          id?: string
          is_published?: boolean
          long_description?: string | null
          name: string
          rating?: number | null
          required_credentials?: string[] | null
          slug: string
          total_deployments?: number | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          base_credit_cost?: number
          category?: string
          config_schema?: Json | null
          created_at?: string
          creator_id?: string | null
          description?: string
          icon_url?: string | null
          id?: string
          is_published?: boolean
          long_description?: string | null
          name?: string
          rating?: number | null
          required_credentials?: string[] | null
          slug?: string
          total_deployments?: number | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      deployments: {
        Row: {
          agent_id: string
          config: Json | null
          created_at: string
          id: string
          last_run_at: string | null
          next_run_at: string | null
          schedule: string | null
          schedule_cron: string | null
          schedule_enabled: boolean | null
          schedule_interval: string | null
          status: Database["public"]["Enums"]["deployment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          config?: Json | null
          created_at?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          schedule?: string | null
          schedule_cron?: string | null
          schedule_enabled?: boolean | null
          schedule_interval?: string | null
          status?: Database["public"]["Enums"]["deployment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          schedule?: string | null
          schedule_cron?: string | null
          schedule_enabled?: boolean | null
          schedule_interval?: string | null
          status?: Database["public"]["Enums"]["deployment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits_balance: number
          display_name: string | null
          id: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits_balance?: number
          display_name?: string | null
          id?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits_balance?: number
          display_name?: string | null
          id?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      runs: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_used: number | null
          deployment_id: string
          error_message: string | null
          id: string
          input_summary: string | null
          output_summary: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["run_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_used?: number | null
          deployment_id: string
          error_message?: string | null
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_used?: number | null
          deployment_id?: string
          error_message?: string | null
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "runs_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_jobs: {
        Row: {
          created_at: string
          cron_job_id: number | null
          deployment_id: string
          id: string
        }
        Insert: {
          created_at?: string
          cron_job_id?: number | null
          deployment_id: string
          id?: string
        }
        Update: {
          created_at?: string
          cron_job_id?: number | null
          deployment_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_jobs_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: true
            referencedRelation: "deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number | null
          created_at: string
          credits: number | null
          id: string
          stripe_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          credits?: number | null
          id?: string
          stripe_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          credits?: number | null
          id?: string
          stripe_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_credentials: {
        Row: {
          created_at: string
          credential_type: string
          encrypted_value: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          encrypted_value: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          encrypted_value?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "admin" | "moderator" | "user"
      deployment_status: "active" | "paused" | "error" | "stopped"
      plan_tier: "free" | "pro" | "business"
      run_status: "queued" | "running" | "success" | "failed"
      transaction_type: "purchase" | "usage" | "refund" | "bonus"
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
      app_role: ["admin", "moderator", "user"],
      deployment_status: ["active", "paused", "error", "stopped"],
      plan_tier: ["free", "pro", "business"],
      run_status: ["queued", "running", "success", "failed"],
      transaction_type: ["purchase", "usage", "refund", "bonus"],
    },
  },
} as const
