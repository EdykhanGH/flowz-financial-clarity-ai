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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_types: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          normal_balance: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          normal_balance: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          normal_balance?: string
        }
        Relationships: []
      }
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
      analytics_metrics: {
        Row: {
          created_at: string
          direct_costs: number | null
          fixed_costs: number | null
          gross_profit: number | null
          id: string
          indirect_costs: number | null
          metric_date: string
          net_profit: number | null
          total_expenses: number | null
          total_revenue: number | null
          transaction_count: number | null
          updated_at: string
          user_id: string
          variable_costs: number | null
        }
        Insert: {
          created_at?: string
          direct_costs?: number | null
          fixed_costs?: number | null
          gross_profit?: number | null
          id?: string
          indirect_costs?: number | null
          metric_date: string
          net_profit?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
          transaction_count?: number | null
          updated_at?: string
          user_id: string
          variable_costs?: number | null
        }
        Update: {
          created_at?: string
          direct_costs?: number | null
          fixed_costs?: number | null
          gross_profit?: number | null
          id?: string
          indirect_costs?: number | null
          metric_date?: string
          net_profit?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
          transaction_count?: number | null
          updated_at?: string
          user_id?: string
          variable_costs?: number | null
        }
        Relationships: []
      }
      bill_items: {
        Row: {
          bill_id: string
          created_at: string
          description: string | null
          id: string
          line_total: number
          product_name: string
          quantity: number
          unit_cost: number
        }
        Insert: {
          bill_id: string
          created_at?: string
          description?: string | null
          id?: string
          line_total?: number
          product_name: string
          quantity?: number
          unit_cost?: number
        }
        Update: {
          bill_id?: string
          created_at?: string
          description?: string | null
          id?: string
          line_total?: number
          product_name?: string
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount_due: number
          amount_paid: number
          bill_date: string
          bill_number: string
          created_at: string
          due_date: string
          id: string
          notes: string | null
          reference: string | null
          status: string
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          bill_date?: string
          bill_number: string
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          reference?: string | null
          status?: string
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          bill_date?: string
          bill_number?: string
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          reference?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
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
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type_id: string
          created_at: string
          current_balance: number | null
          description: string | null
          id: string
          is_active: boolean
          opening_balance: number | null
          parent_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type_id: string
          created_at?: string
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          opening_balance?: number | null
          parent_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type_id?: string
          created_at?: string
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          opening_balance?: number | null
          parent_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_account_type_id_fkey"
            columns: ["account_type_id"]
            isOneToOne: false
            referencedRelation: "account_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_center_performance: {
        Row: {
          avg_cost_per_transaction: number | null
          budget_allocated: number | null
          budget_utilized: number | null
          cost_center_id: string | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          total_costs: number | null
          transaction_count: number | null
          updated_at: string
          user_id: string
          variance_amount: number | null
          variance_percentage: number | null
        }
        Insert: {
          avg_cost_per_transaction?: number | null
          budget_allocated?: number | null
          budget_utilized?: number | null
          cost_center_id?: string | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          total_costs?: number | null
          transaction_count?: number | null
          updated_at?: string
          user_id: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Update: {
          avg_cost_per_transaction?: number | null
          budget_allocated?: number | null
          budget_utilized?: number | null
          cost_center_id?: string | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          total_costs?: number | null
          transaction_count?: number | null
          updated_at?: string
          user_id?: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_center_performance_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
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
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          credit_limit: number | null
          customer_code: string
          email: string | null
          id: string
          is_active: boolean
          payment_terms: number | null
          phone: string | null
          state: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_code: string
          email?: string | null
          id?: string
          is_active?: boolean
          payment_terms?: number | null
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_code?: string
          email?: string | null
          id?: string
          is_active?: boolean
          payment_terms?: number | null
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          base_salary: number
          created_at: string
          department: string | null
          email: string | null
          employee_id: string
          first_name: string
          hire_date: string
          hourly_rate: number | null
          id: string
          is_active: boolean
          last_name: string
          pension_pin: string | null
          phone: string | null
          position: string | null
          salary_type: string
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          base_salary?: number
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id: string
          first_name: string
          hire_date: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          last_name: string
          pension_pin?: string | null
          phone?: string | null
          position?: string | null
          salary_type?: string
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          base_salary?: number
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string
          first_name?: string
          hire_date?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          last_name?: string
          pension_pin?: string | null
          phone?: string | null
          position?: string | null
          salary_type?: string
          tax_id?: string | null
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
      invoice_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          line_total: number
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          line_total?: number
          product_name: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          line_total?: number
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          customer_id: string
          discount_amount: number | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          terms: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          customer_id: string
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          customer_id?: string
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          description: string
          entry_date: string
          entry_number: string
          id: string
          reference: string | null
          status: string
          total_credit: number
          total_debit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          entry_date: string
          entry_number: string
          id?: string
          reference?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          entry_date?: string
          entry_number?: string
          id?: string
          reference?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string
          line_number: number
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
          line_number: number
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
          line_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          payment_type: string
          reference_id: string | null
          reference_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          payment_type: string
          reference_id?: string | null
          reference_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_type?: string
          reference_id?: string | null
          reference_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll_items: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string
          employee_id: string
          gross_pay: number
          id: string
          net_pay: number
          nhf_contribution: number | null
          other_deductions: number | null
          overtime_pay: number | null
          paye_tax: number | null
          payroll_run_id: string
          pension_contribution: number | null
          total_deductions: number
        }
        Insert: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          employee_id: string
          gross_pay?: number
          id?: string
          net_pay?: number
          nhf_contribution?: number | null
          other_deductions?: number | null
          overtime_pay?: number | null
          paye_tax?: number | null
          payroll_run_id: string
          pension_contribution?: number | null
          total_deductions?: number
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          employee_id?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          nhf_contribution?: number | null
          other_deductions?: number | null
          overtime_pay?: number | null
          paye_tax?: number | null
          payroll_run_id?: string
          pension_contribution?: number | null
          total_deductions?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          status: string
          total_deductions: number
          total_gross_pay: number
          total_net_pay: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          status?: string
          total_deductions?: number
          total_gross_pay?: number
          total_net_pay?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          pay_date?: string
          pay_period_end?: string
          pay_period_start?: string
          status?: string
          total_deductions?: number
          total_gross_pay?: number
          total_net_pay?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_performance: {
        Row: {
          avg_cost_price: number | null
          avg_selling_price: number | null
          created_at: string
          gross_profit: number | null
          id: string
          inventory_turnover: number | null
          period_end: string
          period_start: string
          product_id: string | null
          total_costs: number | null
          total_revenue: number | null
          units_sold: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_cost_price?: number | null
          avg_selling_price?: number | null
          created_at?: string
          gross_profit?: number | null
          id?: string
          inventory_turnover?: number | null
          period_end: string
          period_start: string
          product_id?: string | null
          total_costs?: number | null
          total_revenue?: number | null
          units_sold?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_cost_price?: number | null
          avg_selling_price?: number | null
          created_at?: string
          gross_profit?: number | null
          id?: string
          inventory_turnover?: number | null
          period_end?: string
          period_start?: string
          product_id?: string | null
          total_costs?: number | null
          total_revenue?: number | null
          units_sold?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_performance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          payment_terms: number | null
          phone: string | null
          state: string | null
          supplier_code: string
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          payment_terms?: number | null
          phone?: string | null
          state?: string | null
          supplier_code: string
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          payment_terms?: number | null
          phone?: string | null
          state?: string | null
          supplier_code?: string
          tax_id?: string | null
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
