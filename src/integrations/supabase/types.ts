export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          allocated_amount: number
          category: string
          created_at: string | null
          end_date: string
          id: string
          name: string
          period: string | null
          spent_amount: number | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allocated_amount: number
          category: string
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          period?: string | null
          spent_amount?: number | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allocated_amount?: number
          category?: string
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          period?: string | null
          spent_amount?: number | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      business_cost_centers: {
        Row: {
          cost_center: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_center: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_center?: string
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
          core_activities: string[] | null
          cost_centers: string[] | null
          created_at: string | null
          description: string | null
          employees: string | null
          id: string
          location: string | null
          market_scope: string | null
          revenue_frequency: string[] | null
          revenue_streams: string[] | null
          seasonal_business: boolean | null
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
          core_activities?: string[] | null
          cost_centers?: string[] | null
          created_at?: string | null
          description?: string | null
          employees?: string | null
          id?: string
          location?: string | null
          market_scope?: string | null
          revenue_frequency?: string[] | null
          revenue_streams?: string[] | null
          seasonal_business?: boolean | null
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
          core_activities?: string[] | null
          cost_centers?: string[] | null
          created_at?: string | null
          description?: string | null
          employees?: string | null
          id?: string
          location?: string | null
          market_scope?: string | null
          revenue_frequency?: string[] | null
          revenue_streams?: string[] | null
          seasonal_business?: boolean | null
          turnover?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_revenue_streams: {
        Row: {
          created_at: string
          frequency: string
          id: string
          revenue_stream: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency: string
          id?: string
          revenue_stream: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          revenue_stream?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          created_at: string | null
          date: string
          description: string | null
          id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
