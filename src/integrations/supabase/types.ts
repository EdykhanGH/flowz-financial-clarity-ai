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
      ai_insights: {
        Row: {
          action_items: Json | null
          confidence_score: number | null
          content: string
          created_at: string
          id: string
          insight_type: string
          is_active: boolean | null
          related_data: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          insight_type: string
          is_active?: boolean | null
          related_data?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: Json | null
          confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          is_active?: boolean | null
          related_data?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          allocated_amount: number
          budget_type: string | null
          category: string
          cost_center_id: string | null
          created_at: string | null
          end_date: string
          id: string
          name: string
          period: string | null
          profit_center_id: string | null
          spent_amount: number | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allocated_amount: number
          budget_type?: string | null
          category: string
          cost_center_id?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          period?: string | null
          profit_center_id?: string | null
          spent_amount?: number | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allocated_amount?: number
          budget_type?: string | null
          category?: string
          cost_center_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          period?: string | null
          profit_center_id?: string | null
          spent_amount?: number | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_profit_center_id_fkey"
            columns: ["profit_center_id"]
            isOneToOne: false
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          category_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_cost_patterns: {
        Row: {
          business_category: string
          cost_keywords: string[]
          created_at: string
          id: string
          industry_relevance: number | null
          pattern_name: string
          typical_cost_nature: string
          typical_cost_type: string
        }
        Insert: {
          business_category: string
          cost_keywords: string[]
          created_at?: string
          id?: string
          industry_relevance?: number | null
          pattern_name: string
          typical_cost_nature: string
          typical_cost_type: string
        }
        Update: {
          business_category?: string
          cost_keywords?: string[]
          created_at?: string
          id?: string
          industry_relevance?: number | null
          pattern_name?: string
          typical_cost_nature?: string
          typical_cost_type?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          annual_revenue_range: string | null
          business_model: string | null
          business_name: string | null
          business_size_employees: string | null
          business_size_scale: string | null
          category: string | null
          city: string | null
          core_activities: string[] | null
          cost_centers: string[] | null
          created_at: string | null
          description: string | null
          employees: string | null
          expense_categories: string[] | null
          id: string
          location: string | null
          market_scope: string | null
          revenue_categories: string[] | null
          revenue_frequency: string[] | null
          revenue_streams: string[] | null
          seasonal_business: boolean | null
          state: string | null
          turnover: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_revenue_range?: string | null
          business_model?: string | null
          business_name?: string | null
          business_size_employees?: string | null
          business_size_scale?: string | null
          category?: string | null
          city?: string | null
          core_activities?: string[] | null
          cost_centers?: string[] | null
          created_at?: string | null
          description?: string | null
          employees?: string | null
          expense_categories?: string[] | null
          id?: string
          location?: string | null
          market_scope?: string | null
          revenue_categories?: string[] | null
          revenue_frequency?: string[] | null
          revenue_streams?: string[] | null
          seasonal_business?: boolean | null
          state?: string | null
          turnover?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_revenue_range?: string | null
          business_model?: string | null
          business_name?: string | null
          business_size_employees?: string | null
          business_size_scale?: string | null
          category?: string | null
          city?: string | null
          core_activities?: string[] | null
          cost_centers?: string[] | null
          created_at?: string | null
          description?: string | null
          employees?: string | null
          expense_categories?: string[] | null
          id?: string
          location?: string | null
          market_scope?: string | null
          revenue_categories?: string[] | null
          revenue_frequency?: string[] | null
          revenue_streams?: string[] | null
          seasonal_business?: boolean | null
          state?: string | null
          turnover?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          category_type: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          products: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_type: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          products?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_type?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          products?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_classification_rules: {
        Row: {
          business_category: string
          confidence_score: number | null
          cost_keyword: string
          cost_nature: string
          cost_type: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_category: string
          confidence_score?: number | null
          cost_keyword: string
          cost_nature: string
          cost_type: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_category?: string
          confidence_score?: number | null
          cost_keyword?: string
          cost_nature?: string
          cost_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          category_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          cost_center_id: string | null
          created_at: string
          id: string
          name: string
          profit_center_id: string | null
          standard_cost: number | null
          standard_price: number | null
          sub_category: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          cost_center_id?: string | null
          created_at?: string
          id?: string
          name: string
          profit_center_id?: string | null
          standard_cost?: number | null
          standard_price?: number | null
          sub_category?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          cost_center_id?: string | null
          created_at?: string
          id?: string
          name?: string
          profit_center_id?: string | null
          standard_cost?: number | null
          standard_price?: number | null
          sub_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_profit_center_id_fkey"
            columns: ["profit_center_id"]
            isOneToOne: false
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profit_centers: {
        Row: {
          category_type: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          products: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_type: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          products?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_type?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          products?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_categories: {
        Row: {
          category_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          assumptions: Json | null
          created_at: string
          description: string | null
          id: string
          project_name: string
          results: Json | null
          scenario_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          assumptions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          project_name: string
          results?: Json | null
          scenario_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          assumptions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          project_name?: string
          results?: Json | null
          scenario_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_classifications: {
        Row: {
          ai_confidence: number | null
          cost_nature: string | null
          cost_type: string | null
          created_at: string
          id: string
          manual_override: boolean | null
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          cost_nature?: string | null
          cost_type?: string | null
          created_at?: string
          id?: string
          manual_override?: boolean | null
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          cost_nature?: string | null
          cost_type?: string | null
          created_at?: string
          id?: string
          manual_override?: boolean | null
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_classifications_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          cost_center_id: string | null
          cost_nature: string | null
          cost_type: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          product_name: string | null
          profit_center_id: string | null
          quantity: number | null
          type: string
          unit_cost: number | null
          unit_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          cost_center_id?: string | null
          cost_nature?: string | null
          cost_type?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          product_name?: string | null
          profit_center_id?: string | null
          quantity?: number | null
          type: string
          unit_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          cost_center_id?: string | null
          cost_nature?: string | null
          cost_type?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          product_name?: string | null
          profit_center_id?: string | null
          quantity?: number | null
          type?: string
          unit_cost?: number | null
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_profit_center_id_fkey"
            columns: ["profit_center_id"]
            isOneToOne: false
            referencedRelation: "profit_centers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
