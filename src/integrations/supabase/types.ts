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
      competition_leaderboard: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          period_type: string
          portfolio_value: number
          rank: number | null
          return_percentage: number
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          period_type: string
          portfolio_value: number
          rank?: number | null
          return_percentage: number
          snapshot_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          period_type?: string
          portfolio_value?: number
          rank?: number | null
          return_percentage?: number
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_leaderboard_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "competition_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_participants: {
        Row: {
          all_time_start_date: string
          all_time_start_value: number
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          joined_at: string
          monthly_start_date: string
          monthly_start_value: number
          user_id: string
          yearly_start_date: string
          yearly_start_value: number
        }
        Insert: {
          all_time_start_date?: string
          all_time_start_value?: number
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          joined_at?: string
          monthly_start_date?: string
          monthly_start_value?: number
          user_id: string
          yearly_start_date?: string
          yearly_start_value?: number
        }
        Update: {
          all_time_start_date?: string
          all_time_start_value?: number
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          monthly_start_date?: string
          monthly_start_value?: number
          user_id?: string
          yearly_start_date?: string
          yearly_start_value?: number
        }
        Relationships: []
      }
      competition_portfolios: {
        Row: {
          average_purchase_price: number
          created_at: string
          id: string
          participant_id: string
          quantity: number
          ticker: string
          updated_at: string
        }
        Insert: {
          average_purchase_price?: number
          created_at?: string
          id?: string
          participant_id: string
          quantity?: number
          ticker: string
          updated_at?: string
        }
        Update: {
          average_purchase_price?: number
          created_at?: string
          id?: string
          participant_id?: string
          quantity?: number
          ticker?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_portfolios_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "competition_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_transactions: {
        Row: {
          executed_at: string
          id: string
          participant_id: string
          price_per_share: number
          quantity: number
          ticker: string
          total_amount: number
          transaction_type: string
        }
        Insert: {
          executed_at?: string
          id?: string
          participant_id: string
          price_per_share: number
          quantity: number
          ticker: string
          total_amount: number
          transaction_type: string
        }
        Update: {
          executed_at?: string
          id?: string
          participant_id?: string
          price_per_share?: number
          quantity?: number
          ticker?: string
          total_amount?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_transactions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "competition_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_posts: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string
          id: string
          image_url: string
          instagram_url: string
          posted_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by: string
          id?: string
          image_url: string
          instagram_url: string
          posted_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string
          instagram_url?: string
          posted_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          used?: boolean
        }
        Relationships: []
      }
      oslo_stocks: {
        Row: {
          created_at: string
          exchange: string | null
          id: string
          is_active: boolean
          name: string
          sector: string | null
          ticker: string
        }
        Insert: {
          created_at?: string
          exchange?: string | null
          id?: string
          is_active?: boolean
          name: string
          sector?: string | null
          ticker: string
        }
        Update: {
          created_at?: string
          exchange?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sector?: string | null
          ticker?: string
        }
        Relationships: []
      }
      portfolio_history: {
        Row: {
          created_at: string
          date: string
          id: string
          invested_capital: number | null
          osebx_value: number | null
          portfolio_value: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          invested_capital?: number | null
          osebx_value?: number | null
          portfolio_value: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          invested_capital?: number | null
          osebx_value?: number | null
          portfolio_value?: number
        }
        Relationships: []
      }
      portfolio_holdings: {
        Row: {
          cost_basis: number | null
          created_at: string
          exchange: string | null
          holding_type: string
          id: string
          name: string
          purchase_date: string | null
          purchase_price: number
          quantity: number
          sector: string | null
          ticker: string
          updated_at: string
        }
        Insert: {
          cost_basis?: number | null
          created_at?: string
          exchange?: string | null
          holding_type?: string
          id?: string
          name: string
          purchase_date?: string | null
          purchase_price?: number
          quantity?: number
          sector?: string | null
          ticker: string
          updated_at?: string
        }
        Update: {
          cost_basis?: number | null
          created_at?: string
          exchange?: string | null
          holding_type?: string
          id?: string
          name?: string
          purchase_date?: string | null
          purchase_price?: number
          quantity?: number
          sector?: string | null
          ticker?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quarterly_reports: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_url: string
          id: string
          quarter: string
          title: string
          uploaded_by: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          quarter: string
          title: string
          uploaded_by: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          quarter?: string
          title?: string
          uploaded_by?: string
          year?: number
        }
        Relationships: []
      }
      report_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          subscribed: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          subscribed?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          subscribed?: boolean
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      competition_buy_stock: {
        Args: {
          _participant_id: string
          _price: number
          _quantity: number
          _ticker: string
        }
        Returns: Json
      }
      competition_sell_stock: {
        Args: {
          _participant_id: string
          _price: number
          _quantity: number
          _ticker: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_email_invited: { Args: { _email: string }; Returns: boolean }
      use_invitation: {
        Args: { _email: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
