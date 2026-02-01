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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          attestation_details: Json | null
          attestation_token: string | null
          attestation_verdict: string | null
          created_at: string | null
          device_id: string
          event_type: string | null
          id: number
          ip_address: string | null
          metadata: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          attestation_details?: Json | null
          attestation_token?: string | null
          attestation_verdict?: string | null
          created_at?: string | null
          device_id: string
          event_type?: string | null
          id?: number
          ip_address?: string | null
          metadata?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          attestation_details?: Json | null
          attestation_token?: string | null
          attestation_verdict?: string | null
          created_at?: string | null
          device_id?: string
          event_type?: string | null
          id?: number
          ip_address?: string | null
          metadata?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      account_activation_codes: {
        Row: {
          account_id: string
          code_hash: string
          created_at: string
          created_at_sys: string | null
          created_by_account_id: string | null
          expires_at: string
          expires_at_sys: string | null
          id: string
          used_at: string | null
          used_at_sys: string | null
        }
        Insert: {
          account_id: string
          code_hash: string
          created_at?: string
          created_at_sys?: string | null
          created_by_account_id?: string | null
          expires_at: string
          expires_at_sys?: string | null
          id?: string
          used_at?: string | null
          used_at_sys?: string | null
        }
        Update: {
          account_id?: string
          code_hash?: string
          created_at?: string
          created_at_sys?: string | null
          created_by_account_id?: string | null
          expires_at?: string
          expires_at_sys?: string | null
          id?: string
          used_at?: string | null
          used_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_activation_codes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_activation_codes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_activation_codes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_activation_codes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_activation_codes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_activation_codes_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_activation_codes_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_activation_codes_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_activation_codes_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_activation_codes_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          arabic_name: string | null
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          created_at_sys: string | null
          deactivated_at: string | null
          deactivated_at_sys: string | null
          device_limit: number
          division_id: string | null
          email: string | null
          field_role: Database["public"]["Enums"]["field_role"]
          fraud_lock_reason: string[] | null
          full_name: string | null
          id: string
          is_fraud_locked: boolean | null
          last_login_at: string | null
          last_login_at_sys: string | null
          last_password_changed_at: string | null
          last_password_changed_at_sys: string | null
          org_id: string | null
          org_type: Database["public"]["Enums"]["org_type"]
          phone_number: string | null
          portal_role: Database["public"]["Enums"]["portal_role"]
          require_biometrics: boolean
          status_reason:
            | Database["public"]["Enums"]["account_status_reason"]
            | null
          updated_at: string
          updated_at_sys: string | null
          user_expires_at: string | null
          user_expires_at_sys: string | null
          username: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          arabic_name?: string | null
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          created_at_sys?: string | null
          deactivated_at?: string | null
          deactivated_at_sys?: string | null
          device_limit?: number
          division_id?: string | null
          email?: string | null
          field_role?: Database["public"]["Enums"]["field_role"]
          fraud_lock_reason?: string[] | null
          full_name?: string | null
          id?: string
          is_fraud_locked?: boolean | null
          last_login_at?: string | null
          last_login_at_sys?: string | null
          last_password_changed_at?: string | null
          last_password_changed_at_sys?: string | null
          org_id?: string | null
          org_type: Database["public"]["Enums"]["org_type"]
          phone_number?: string | null
          portal_role?: Database["public"]["Enums"]["portal_role"]
          require_biometrics?: boolean
          status_reason?:
            | Database["public"]["Enums"]["account_status_reason"]
            | null
          updated_at?: string
          updated_at_sys?: string | null
          user_expires_at?: string | null
          user_expires_at_sys?: string | null
          username: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          arabic_name?: string | null
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          created_at_sys?: string | null
          deactivated_at?: string | null
          deactivated_at_sys?: string | null
          device_limit?: number
          division_id?: string | null
          email?: string | null
          field_role?: Database["public"]["Enums"]["field_role"]
          fraud_lock_reason?: string[] | null
          full_name?: string | null
          id?: string
          is_fraud_locked?: boolean | null
          last_login_at?: string | null
          last_login_at_sys?: string | null
          last_password_changed_at?: string | null
          last_password_changed_at_sys?: string | null
          org_id?: string | null
          org_type?: Database["public"]["Enums"]["org_type"]
          phone_number?: string | null
          portal_role?: Database["public"]["Enums"]["portal_role"]
          require_biometrics?: boolean
          status_reason?:
            | Database["public"]["Enums"]["account_status_reason"]
            | null
          updated_at?: string
          updated_at_sys?: string | null
          user_expires_at?: string | null
          user_expires_at_sys?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          force_update_active: boolean | null
          id: number
          maintenance_mode: boolean | null
          min_version: string | null
        }
        Insert: {
          force_update_active?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          min_version?: string | null
        }
        Update: {
          force_update_active?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          min_version?: string | null
        }
        Relationships: []
      }
      app_versions: {
        Row: {
          active: boolean | null
          created_at: string | null
          current_version: string
          id: string
          maintenance_mode: boolean | null
          min_version: string
          platform: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          current_version?: string
          id?: string
          maintenance_mode?: boolean | null
          min_version?: string
          platform: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          current_version?: string
          id?: string
          maintenance_mode?: boolean | null
          min_version?: string
          platform?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_questions: {
        Row: {
          category_ar: string
          category_en: string
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          market_id: string | null
          photo_required: boolean | null
          question_ar: string
          question_en: string
          sort_order: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          category_ar: string
          category_en: string
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          market_id?: string | null
          photo_required?: boolean | null
          question_ar: string
          question_en: string
          sort_order?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          category_ar?: string
          category_en?: string
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          market_id?: string | null
          photo_required?: boolean | null
          question_ar?: string
          question_en?: string
          sort_order?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_questions_client_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_questions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_responses: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_compliant: boolean
          notes: string | null
          photo_url: string | null
          question_id: string
          score_earned: number | null
          visit_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          is_compliant: boolean
          notes?: string | null
          photo_url?: string | null
          question_id: string
          score_earned?: number | null
          visit_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_compliant?: boolean
          notes?: string | null
          photo_url?: string | null
          question_id?: string
          score_earned?: number | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_responses_question_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "audit_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_responses_visit_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "audit_responses_visit_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_responses_visit_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_place_products_v2: {
        Row: {
          chain_id: string | null
          client_id: string
          created_at: string
          created_at_sys: string | null
          display_order: number | null
          id: string
          is_mandatory: boolean
          market_id: string | null
          place_id: string
          product_id: string
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          chain_id?: string | null
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          display_order?: number | null
          id?: string
          is_mandatory?: boolean
          market_id?: string | null
          place_id: string
          product_id: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          chain_id?: string | null
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          display_order?: number | null
          id?: string
          is_mandatory?: boolean
          market_id?: string | null
          place_id?: string
          product_id?: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_place_products_v2_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_place_products_v2_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_place_products_v2_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_place_products_v2_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_place_products_v2_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_place_products_v2_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
        ]
      }
      availability_places: {
        Row: {
          code: string
          created_at: string | null
          created_at_sys: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string | null
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      brand_categories: {
        Row: {
          brand_id: string
          category_id: string
          is_primary: boolean
        }
        Insert: {
          brand_id: string
          category_id: string
          is_primary?: boolean
        }
        Update: {
          brand_id?: string
          category_id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "brand_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "brand_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          code: string | null
          created_at: string
          created_at_sys: string | null
          id: string
          is_active: boolean
          manufacturer: string | null
          name_ar: string | null
          name_en: string
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          name_ar?: string | null
          name_en: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          name_ar?: string | null
          name_en?: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          code: string | null
          created_at: string
          created_at_sys: string | null
          id: string
          is_active: boolean
          level: number
          name: string | null
          name_ar: string | null
          name_en: string | null
          parent_code: string | null
          parent_id: string | null
          sort_order: number
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name?: string | null
          name_ar?: string | null
          name_en?: string | null
          parent_code?: string | null
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name?: string | null
          name_ar?: string | null
          name_en?: string | null
          parent_code?: string | null
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      chains: {
        Row: {
          code: string | null
          created_at: string
          created_at_sys: string | null
          id: string
          logo_url: string | null
          name_ar: string | null
          name_en: string
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          logo_url?: string | null
          name_ar?: string | null
          name_en: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          logo_url?: string | null
          name_ar?: string | null
          name_en?: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          created_at_sys: string | null
          id: string
          name_ar: string
          name_en: string
          region_id: string
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          created_at?: string
          created_at_sys?: string | null
          id?: string
          name_ar: string
          name_en: string
          region_id: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          created_at?: string
          created_at_sys?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          region_id?: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_categories: {
        Row: {
          category_id: string
          client_id: string
          linked_at: string
          linked_at_sys: string | null
        }
        Insert: {
          category_id: string
          client_id: string
          linked_at?: string
          linked_at_sys?: string | null
        }
        Update: {
          category_id?: string
          client_id?: string
          linked_at?: string
          linked_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "client_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_categories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_complaint_categories: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_divisions: {
        Row: {
          client_id: string
          code: string
          created_at: string
          created_at_sys: string | null
          id: string
          is_active: boolean
          name_ar: string | null
          name_en: string
          sort_order: number
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string | null
          name_en: string
          sort_order?: number
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string | null
          name_en?: string
          sort_order?: number
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_divisions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_features: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_at_sys: string | null
          feature_key: Database["public"]["Enums"]["feature_key_enum"]
          id: string
          is_enabled: boolean | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_at_sys?: string | null
          feature_key: Database["public"]["Enums"]["feature_key_enum"]
          id?: string
          is_enabled?: boolean | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_at_sys?: string | null
          feature_key?: Database["public"]["Enums"]["feature_key_enum"]
          id?: string
          is_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_features_feature_fk"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "feature_catalog"
            referencedColumns: ["key"]
          },
        ]
      }
      client_markets: {
        Row: {
          client_id: string
          created_at: string
          created_at_sys: string | null
          market_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          market_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          market_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_markets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_markets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_hierarchy: {
        Row: {
          child_account_id: string
          child_auth_id: string | null
          client_id: string
          created_at: string
          created_at_sys: string | null
          division_id: string | null
          id: string
          parent_account_id: string | null
          parent_auth_id: string | null
        }
        Insert: {
          child_account_id: string
          child_auth_id?: string | null
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          id?: string
          parent_account_id?: string | null
          parent_auth_id?: string | null
        }
        Update: {
          child_account_id?: string
          child_auth_id?: string | null
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          id?: string
          parent_account_id?: string | null
          parent_auth_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_hierarchy_child_account_id_fkey"
            columns: ["child_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_child_account_id_fkey"
            columns: ["child_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_child_account_id_fkey"
            columns: ["child_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_child_account_id_fkey"
            columns: ["child_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_child_account_id_fkey"
            columns: ["child_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_hierarchy_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      client_portal_role_catalog: {
        Row: {
          created_at: string
          created_at_sys: string | null
          is_active: boolean
          is_default: boolean
          key: string
          label_ar: string
          label_en: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          created_at_sys?: string | null
          is_active?: boolean
          is_default?: boolean
          key: string
          label_ar: string
          label_en: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          created_at_sys?: string | null
          is_active?: boolean
          is_default?: boolean
          key?: string
          label_ar?: string
          label_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      client_portal_user_roles: {
        Row: {
          account_id: string
          client_id: string
          created_at: string
          created_at_sys: string | null
          division_id: string | null
          id: string
          role_key: string
        }
        Insert: {
          account_id: string
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          id?: string
          role_key: string
        }
        Update: {
          account_id?: string
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          id?: string
          role_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_user_roles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_user_roles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_user_roles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_user_roles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_user_roles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_portal_user_roles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_user_roles_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_user_roles_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "client_portal_role_catalog"
            referencedColumns: ["key"]
          },
        ]
      }
      client_products: {
        Row: {
          alt_code: string | null
          client_barcode: string | null
          client_id: string
          client_sku_code: string | null
          created_at: string
          created_at_sys: string | null
          division_id: string | null
          end_date: string | null
          end_date_sys: string | null
          id: string
          is_active: boolean
          is_listed: boolean
          name_ar: string | null
          name_en: string | null
          product_id: string
          start_date: string | null
          start_date_sys: string | null
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          alt_code?: string | null
          client_barcode?: string | null
          client_id: string
          client_sku_code?: string | null
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          end_date?: string | null
          end_date_sys?: string | null
          id?: string
          is_active?: boolean
          is_listed?: boolean
          name_ar?: string | null
          name_en?: string | null
          product_id: string
          start_date?: string | null
          start_date_sys?: string | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          alt_code?: string | null
          client_barcode?: string | null
          client_id?: string
          client_sku_code?: string | null
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          end_date?: string | null
          end_date_sys?: string | null
          id?: string
          is_active?: boolean
          is_listed?: boolean
          name_ar?: string | null
          name_en?: string | null
          product_id?: string
          start_date?: string | null
          start_date_sys?: string | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
        ]
      }
      client_reasons: {
        Row: {
          allow_custom_text: boolean | null
          client_id: string
          created_at: string | null
          division_id: string | null
          id: string
          is_active: boolean
          reason_id: string
          requires_photo: boolean | null
          stage: string
        }
        Insert: {
          allow_custom_text?: boolean | null
          client_id: string
          created_at?: string | null
          division_id?: string | null
          id?: string
          is_active?: boolean
          reason_id: string
          requires_photo?: boolean | null
          stage: string
        }
        Update: {
          allow_custom_text?: boolean | null
          client_id?: string
          created_at?: string | null
          division_id?: string | null
          id?: string
          is_active?: boolean
          reason_id?: string
          requires_photo?: boolean | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_reasons_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reasons_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reasons_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      client_user_products_v2: {
        Row: {
          account_id: string
          client_id: string
          created_at: string
          created_at_sys: string | null
          id: string
          is_active: boolean
          product_id: string
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          account_id: string
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          product_id: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          account_id?: string
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          product_id?: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_user_products_v2_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_user_products_v2_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_user_products_v2_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_user_products_v2_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_user_products_v2_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_user_products_v2_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_user_products_v2_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_user_products_v2_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
        ]
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string
          created_at_sys: string | null
          is_active: boolean
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          is_active?: boolean
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      clients: {
        Row: {
          activate_users: boolean
          address: string | null
          agreement_file_url: string | null
          commercial_file_url: string | null
          created_at: string
          created_at_sys: string | null
          enable_ai_sos: boolean
          enable_location_check: boolean
          id: string
          location_check_threshold: number | null
          logo_url: string | null
          national_address: string | null
          national_file_url: string | null
          require_biometrics: boolean
          tax_file_url: string | null
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          activate_users?: boolean
          address?: string | null
          agreement_file_url?: string | null
          commercial_file_url?: string | null
          created_at?: string
          created_at_sys?: string | null
          enable_ai_sos?: boolean
          enable_location_check?: boolean
          id: string
          location_check_threshold?: number | null
          logo_url?: string | null
          national_address?: string | null
          national_file_url?: string | null
          require_biometrics?: boolean
          tax_file_url?: string | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          activate_users?: boolean
          address?: string | null
          agreement_file_url?: string | null
          commercial_file_url?: string | null
          created_at?: string
          created_at_sys?: string | null
          enable_ai_sos?: boolean
          enable_location_check?: boolean
          id?: string
          location_check_threshold?: number | null
          logo_url?: string | null
          national_address?: string | null
          national_file_url?: string | null
          require_biometrics?: boolean
          tax_file_url?: string | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_targets: {
        Row: {
          account_id: string
          assigned_at: string | null
          complaint_id: string
          id: string
        }
        Insert: {
          account_id: string
          assigned_at?: string | null
          complaint_id: string
          id?: string
        }
        Update: {
          account_id?: string
          assigned_at?: string | null
          complaint_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_targets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_targets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaint_targets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaint_targets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaint_targets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaint_targets_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_timeline: {
        Row: {
          action_type: Database["public"]["Enums"]["complaint_action_enum"]
          actor_id: string | null
          complaint_id: string
          created_at: string | null
          created_at_sys: string | null
          evidence_photo: string | null
          id: string
          message_ar: string | null
          message_en: string | null
          notes: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["complaint_action_enum"]
          actor_id?: string | null
          complaint_id: string
          created_at?: string | null
          created_at_sys?: string | null
          evidence_photo?: string | null
          id?: string
          message_ar?: string | null
          message_en?: string | null
          notes?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["complaint_action_enum"]
          actor_id?: string | null
          complaint_id?: string
          created_at?: string | null
          created_at_sys?: string | null
          evidence_photo?: string | null
          id?: string
          message_ar?: string | null
          message_en?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_timeline_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_timeline_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaint_timeline_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaint_timeline_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaint_timeline_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaint_timeline_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          category: string | null
          client_id: string
          created_at: string | null
          created_at_sys: string | null
          current_assignee_id: string | null
          description: string
          division_id: string
          id: string
          market_id: string | null
          photos: string[] | null
          requester_id: string
          sla_deadline: string
          status: Database["public"]["Enums"]["complaint_status_enum"] | null
          target_custom_details: Json | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string | null
          created_at_sys?: string | null
          current_assignee_id?: string | null
          description: string
          division_id: string
          id?: string
          market_id?: string | null
          photos?: string[] | null
          requester_id: string
          sla_deadline: string
          status?: Database["public"]["Enums"]["complaint_status_enum"] | null
          target_custom_details?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string | null
          created_at_sys?: string | null
          current_assignee_id?: string | null
          description?: string
          division_id?: string
          id?: string
          market_id?: string | null
          photos?: string[] | null
          requester_id?: string
          sla_deadline?: string
          status?: Database["public"]["Enums"]["complaint_status_enum"] | null
          target_custom_details?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "complaints_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_current_assignee_id_fkey"
            columns: ["current_assignee_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_current_assignee_id_fkey"
            columns: ["current_assignee_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaints_current_assignee_id_fkey"
            columns: ["current_assignee_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaints_current_assignee_id_fkey"
            columns: ["current_assignee_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaints_current_assignee_id_fkey"
            columns: ["current_assignee_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaints_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaints_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaints_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "complaints_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      email_job_log: {
        Row: {
          error_msg: string | null
          id: number
          note: string | null
          ran_at: string | null
          ran_at_sys: string | null
          resp_preview: string | null
          status_code: number | null
        }
        Insert: {
          error_msg?: string | null
          id?: number
          note?: string | null
          ran_at?: string | null
          ran_at_sys?: string | null
          resp_preview?: string | null
          status_code?: number | null
        }
        Update: {
          error_msg?: string | null
          id?: number
          note?: string | null
          ran_at?: string | null
          ran_at_sys?: string | null
          resp_preview?: string | null
          status_code?: number | null
        }
        Relationships: []
      }
      feature_catalog: {
        Row: {
          default_enabled: boolean
          description_ar: string | null
          description_en: string | null
          domain: string
          is_plan_limited: boolean
          key: Database["public"]["Enums"]["feature_key_enum"]
          label_ar: string
          label_en: string
          metadata: Json | null
          sort_order: number
        }
        Insert: {
          default_enabled?: boolean
          description_ar?: string | null
          description_en?: string | null
          domain: string
          is_plan_limited?: boolean
          key: Database["public"]["Enums"]["feature_key_enum"]
          label_ar: string
          label_en: string
          metadata?: Json | null
          sort_order?: number
        }
        Update: {
          default_enabled?: boolean
          description_ar?: string | null
          description_en?: string | null
          domain?: string
          is_plan_limited?: boolean
          key?: Database["public"]["Enums"]["feature_key_enum"]
          label_ar?: string
          label_en?: string
          metadata?: Json | null
          sort_order?: number
        }
        Relationships: []
      }
      inventory_batches: {
        Row: {
          created_at: string | null
          created_at_sys: string | null
          expiry_date: string | null
          id: string
          pack_type_code: string | null
          quantity: number
          report_id: string
        }
        Insert: {
          created_at?: string | null
          created_at_sys?: string | null
          expiry_date?: string | null
          id?: string
          pack_type_code?: string | null
          quantity?: number
          report_id: string
        }
        Update: {
          created_at?: string | null
          created_at_sys?: string | null
          expiry_date?: string | null
          id?: string
          pack_type_code?: string | null
          quantity?: number
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_pack_type_fkey"
            columns: ["pack_type_code"]
            isOneToOne: false
            referencedRelation: "product_pack_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "inventory_batches_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "inventory_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_photos: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_at_sys: string | null
          created_by: string | null
          id: string
          photo_url: string
          report_id: string | null
          scope: string
          visit_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_at_sys?: string | null
          created_by?: string | null
          id?: string
          photo_url: string
          report_id?: string | null
          scope: string
          visit_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_at_sys?: string | null
          created_by?: string | null
          id?: string
          photo_url?: string
          report_id?: string | null
          scope?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_photos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_photos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "inventory_photos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_photos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_photos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_photos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_photos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_photos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "inventory_photos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "inventory_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_photos_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "inventory_photos_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_photos_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reports: {
        Row: {
          bypass_reason: string | null
          client_id: string | null
          created_at: string
          created_at_sys: string | null
          custom_reason: string | null
          distance_from_checkin: number | null
          division_id: string | null
          id: string
          is_available: boolean | null
          is_forced_upload: boolean | null
          market_id: string | null
          not_available_reason: string | null
          product_id: string | null
          updated_at: string | null
          upload_location_lat: number | null
          upload_location_lng: number | null
          user_id: string | null
          visit_id: string | null
        }
        Insert: {
          bypass_reason?: string | null
          client_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          custom_reason?: string | null
          distance_from_checkin?: number | null
          division_id?: string | null
          id?: string
          is_available?: boolean | null
          is_forced_upload?: boolean | null
          market_id?: string | null
          not_available_reason?: string | null
          product_id?: string | null
          updated_at?: string | null
          upload_location_lat?: number | null
          upload_location_lng?: number | null
          user_id?: string | null
          visit_id?: string | null
        }
        Update: {
          bypass_reason?: string | null
          client_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          custom_reason?: string | null
          distance_from_checkin?: number | null
          division_id?: string | null
          id?: string
          is_available?: boolean | null
          is_forced_upload?: boolean | null
          market_id?: string | null
          not_available_reason?: string | null
          product_id?: string | null
          updated_at?: string | null
          upload_location_lat?: number | null
          upload_location_lng?: number | null
          user_id?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reports_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reports_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "inventory_reports_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reports_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "InventoryReports_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "InventoryReports_not_available_reason_fkey"
            columns: ["not_available_reason"]
            isOneToOne: false
            referencedRelation: "reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          branch: string | null
          branch_ar: string | null
          chain_id: string | null
          city_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          region_id: string | null
        }
        Insert: {
          branch?: string | null
          branch_ar?: string | null
          chain_id?: string | null
          city_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          region_id?: string | null
        }
        Update: {
          branch?: string | null
          branch_ar?: string | null
          chain_id?: string | null
          city_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          region_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "markets_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      mch_availability: {
        Row: {
          category_id: string | null
          created_at: string
          created_at_sys: string | null
          custom_reason: string | null
          division_id: string | null
          event_id: string
          id: string
          is_available: boolean
          place_id: string | null
          product_id: string
          quantity: number | null
          reason_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          custom_reason?: string | null
          division_id?: string | null
          event_id: string
          id?: string
          is_available: boolean
          place_id?: string | null
          product_id: string
          quantity?: number | null
          reason_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          custom_reason?: string | null
          division_id?: string | null
          event_id?: string
          id?: string
          is_available?: boolean
          place_id?: string | null
          product_id?: string
          quantity?: number | null
          reason_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mch_availability_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_availability_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "mch_availability_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_availability_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_availability_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mch_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_availability_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_availability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_availability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "mch_availability_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      mch_competitor: {
        Row: {
          activity_type: string | null
          category_id: string
          competitor_name: string
          created_at: string
          created_at_sys: string | null
          division_id: string | null
          event_id: string
          id: string
          new_price: number | null
          notes: string | null
          old_price: number | null
          photos: string[] | null
          place_id: string | null
          product_id: string | null
          product_name: string | null
        }
        Insert: {
          activity_type?: string | null
          category_id: string
          competitor_name: string
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          event_id: string
          id?: string
          new_price?: number | null
          notes?: string | null
          old_price?: number | null
          photos?: string[] | null
          place_id?: string | null
          product_id?: string | null
          product_name?: string | null
        }
        Update: {
          activity_type?: string | null
          category_id?: string
          competitor_name?: string
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          event_id?: string
          id?: string
          new_price?: number | null
          notes?: string | null
          old_price?: number | null
          photos?: string[] | null
          place_id?: string | null
          product_id?: string | null
          product_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mch_competitor_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_competitor_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "mch_competitor_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_competitor_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_competitor_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mch_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_competitor_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_competitor_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_competitor_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
        ]
      }
      mch_damage: {
        Row: {
          category_id: string
          created_at: string
          created_at_sys: string | null
          custom_reason: string | null
          division_id: string | null
          event_id: string
          expiry_date: string | null
          expiry_date_sys: string | null
          id: string
          place_id: string | null
          product_id: string
          reason_id: string | null
          units: number
        }
        Insert: {
          category_id: string
          created_at?: string
          created_at_sys?: string | null
          custom_reason?: string | null
          division_id?: string | null
          event_id: string
          expiry_date?: string | null
          expiry_date_sys?: string | null
          id?: string
          place_id?: string | null
          product_id: string
          reason_id?: string | null
          units: number
        }
        Update: {
          category_id?: string
          created_at?: string
          created_at_sys?: string | null
          custom_reason?: string | null
          division_id?: string | null
          event_id?: string
          expiry_date?: string | null
          expiry_date_sys?: string | null
          id?: string
          place_id?: string | null
          product_id?: string
          reason_id?: string | null
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "mch_damage_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_damage_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "mch_damage_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_damage_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_damage_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mch_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_damage_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_damage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_damage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "mch_damage_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      mch_events: {
        Row: {
          category_id: string | null
          client_id: string
          created_at: string
          created_at_sys: string | null
          created_by: string | null
          division_id: string | null
          event_type_enum:
            | Database["public"]["Enums"]["mch_event_type_enum"]
            | null
          id: string
          is_out_of_range: boolean | null
          market_id: string
          place_id: string | null
          user_id: string
          visit_id: string
        }
        Insert: {
          category_id?: string | null
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          division_id?: string | null
          event_type_enum?:
            | Database["public"]["Enums"]["mch_event_type_enum"]
            | null
          id?: string
          is_out_of_range?: boolean | null
          market_id: string
          place_id?: string | null
          user_id: string
          visit_id: string
        }
        Update: {
          category_id?: string | null
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          division_id?: string | null
          event_type_enum?:
            | Database["public"]["Enums"]["mch_event_type_enum"]
            | null
          id?: string
          is_out_of_range?: boolean | null
          market_id?: string
          place_id?: string | null
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mch_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "mch_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "mch_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "mch_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "mch_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "mch_events_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_events_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_events_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "mch_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "mch_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "mch_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "mch_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "mch_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      mch_sos: {
        Row: {
          ai_analysis_details: Json | null
          ai_client_facing: number | null
          ai_percentage: number | null
          ai_status: string | null
          ai_total_facing: number | null
          category_id: string
          created_at: string
          created_at_sys: string | null
          division_id: string | null
          event_id: string
          extra_visibility: boolean
          id: string
          photos: string[] | null
          place_id: string | null
          product_id: string | null
          shelf_share_percent: number
        }
        Insert: {
          ai_analysis_details?: Json | null
          ai_client_facing?: number | null
          ai_percentage?: number | null
          ai_status?: string | null
          ai_total_facing?: number | null
          category_id: string
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          event_id: string
          extra_visibility?: boolean
          id?: string
          photos?: string[] | null
          place_id?: string | null
          product_id?: string | null
          shelf_share_percent: number
        }
        Update: {
          ai_analysis_details?: Json | null
          ai_client_facing?: number | null
          ai_percentage?: number | null
          ai_status?: string | null
          ai_total_facing?: number | null
          category_id?: string
          created_at?: string
          created_at_sys?: string | null
          division_id?: string | null
          event_id?: string
          extra_visibility?: boolean
          id?: string
          photos?: string[] | null
          place_id?: string | null
          product_id?: string | null
          shelf_share_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "mch_sos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_sos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "mch_sos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_sos_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_sos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mch_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_sos_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_sos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_sos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
        ]
      }
      mch_sos_ai_queue: {
        Row: {
          client_id: string
          created_at: string
          created_at_sys: string | null
          event_id: string
          id: string
          last_error: string | null
          photo_paths: string[]
          retry_count: number
          sos_id: string
          status: string
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          event_id: string
          id?: string
          last_error?: string | null
          photo_paths: string[]
          retry_count?: number
          sos_id: string
          status?: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          event_id?: string
          id?: string
          last_error?: string | null
          photo_paths?: string[]
          retry_count?: number
          sos_id?: string
          status?: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mch_sos_ai_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_sos_ai_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mch_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_sos_ai_queue_sos_id_fkey"
            columns: ["sos_id"]
            isOneToOne: false
            referencedRelation: "mch_sos"
            referencedColumns: ["id"]
          },
        ]
      }
      mch_whcount: {
        Row: {
          category_id: string | null
          created_at: string
          created_at_sys: string | null
          custom_reason: string | null
          division_id: string | null
          event_id: string
          id: string
          is_available: boolean
          pack_type_code: string | null
          place_id: string | null
          product_id: string
          quantity: number
          reason_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          custom_reason?: string | null
          division_id?: string | null
          event_id: string
          id?: string
          is_available?: boolean
          pack_type_code?: string | null
          place_id?: string | null
          product_id: string
          quantity: number
          reason_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          custom_reason?: string | null
          division_id?: string | null
          event_id?: string
          id?: string
          is_available?: boolean
          pack_type_code?: string | null
          place_id?: string | null
          product_id?: string
          quantity?: number
          reason_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mch_whcount_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_whcount_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "mch_whcount_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_whcount_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_whcount_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mch_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_whcount_pack_type_fkey"
            columns: ["pack_type_code"]
            isOneToOne: false
            referencedRelation: "product_pack_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "mch_whcount_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_whcount_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mch_whcount_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "mch_whcount_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_actions: {
        Row: {
          action_payload: Json | null
          action_type: string
          id: string
          notification_id: string
          performed_at: string
          performed_at_sys: string | null
          user_id: string
        }
        Insert: {
          action_payload?: Json | null
          action_type: string
          id?: string
          notification_id: string
          performed_at?: string
          performed_at_sys?: string | null
          user_id: string
        }
        Update: {
          action_payload?: Json | null
          action_type?: string
          id?: string
          notification_id?: string
          performed_at?: string
          performed_at_sys?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_actions_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          read_at_sys: string | null
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          read_at_sys?: string | null
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          read_at_sys?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience_type:
            | Database["public"]["Enums"]["notification_audience_type"]
            | null
          client_id: string | null
          completed_at_sys: string | null
          created_at: string | null
          created_at_sys: string | null
          division_id: string | null
          for_all: boolean | null
          for_roles: string[] | null
          for_user: string | null
          id: string
          message_ar: string | null
          message_en: string | null
          team_leader: string | null
          title_ar: string | null
          title_en: string
          unified_status:
            | Database["public"]["Enums"]["notification_status"]
            | null
        }
        Insert: {
          audience_type?:
            | Database["public"]["Enums"]["notification_audience_type"]
            | null
          client_id?: string | null
          completed_at_sys?: string | null
          created_at?: string | null
          created_at_sys?: string | null
          division_id?: string | null
          for_all?: boolean | null
          for_roles?: string[] | null
          for_user?: string | null
          id?: string
          message_ar?: string | null
          message_en?: string | null
          team_leader?: string | null
          title_ar?: string | null
          title_en: string
          unified_status?:
            | Database["public"]["Enums"]["notification_status"]
            | null
        }
        Update: {
          audience_type?:
            | Database["public"]["Enums"]["notification_audience_type"]
            | null
          client_id?: string | null
          completed_at_sys?: string | null
          created_at?: string | null
          created_at_sys?: string | null
          division_id?: string | null
          for_all?: boolean | null
          for_roles?: string[] | null
          for_user?: string | null
          id?: string
          message_ar?: string | null
          message_en?: string | null
          team_leader?: string | null
          title_ar?: string | null
          title_en?: string
          unified_status?:
            | Database["public"]["Enums"]["notification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notifications_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notifications_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notifications_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      organizations: {
        Row: {
          code: string | null
          commercial_number: string | null
          created_at: string
          created_at_sys: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["organization_kind"]
          name: string
          name_ar: string | null
          parent_org_id: string | null
          tax_number: string | null
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          code?: string | null
          commercial_number?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["organization_kind"]
          name: string
          name_ar?: string | null
          parent_org_id?: string | null
          tax_number?: string | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          code?: string | null
          commercial_number?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["organization_kind"]
          name?: string
          name_ar?: string | null
          parent_org_id?: string | null
          tax_number?: string | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      place_client_policies: {
        Row: {
          client_id: string
          created_at: string
          created_at_sys: string | null
          id: string
          is_active: boolean
          place_id: string
          requires_full_entry: boolean
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          place_id: string
          requires_full_entry?: boolean
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          place_id?: string
          requires_full_entry?: boolean
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "place_client_policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_client_policies_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
        ]
      }
      planogram_templates: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_at_sys: string | null
          description: string | null
          id: string
          market_id: string | null
          photo_url: string
          section_name: string | null
          section_name_ar: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_at_sys?: string | null
          description?: string | null
          id?: string
          market_id?: string | null
          photo_url: string
          section_name?: string | null
          section_name_ar?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_at_sys?: string | null
          description?: string | null
          id?: string
          market_id?: string | null
          photo_url?: string
          section_name?: string | null
          section_name_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PlanogramTemplates_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      product_barcodes: {
        Row: {
          barcode: string
          barcode_type: string
          created_at: string
          created_at_sys: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          product_id: string
        }
        Insert: {
          barcode: string
          barcode_type?: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          product_id: string
        }
        Update: {
          barcode?: string
          barcode_type?: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_barcodes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_barcodes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_pack_types: {
        Row: {
          code: string
          name_ar: string
          name_en: string
        }
        Insert: {
          code: string
          name_ar: string
          name_en: string
        }
        Update: {
          code?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      product_units: {
        Row: {
          code: string
          name_ar: string
          name_en: string
        }
        Insert: {
          code: string
          name_ar: string
          name_en: string
        }
        Update: {
          code?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string
          created_at: string
          created_at_sys: string | null
          global_sku_code: string
          id: string
          is_active: boolean
          name_ar: string | null
          name_en: string
          pack_count: number | null
          pack_type_code: string | null
          photo_path: string | null
          size_unit_code: string | null
          size_value: number | null
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id: string
          created_at?: string
          created_at_sys?: string | null
          global_sku_code: string
          id?: string
          is_active?: boolean
          name_ar?: string | null
          name_en: string
          pack_count?: number | null
          pack_type_code?: string | null
          photo_path?: string | null
          size_unit_code?: string | null
          size_value?: number | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string
          created_at?: string
          created_at_sys?: string | null
          global_sku_code?: string
          id?: string
          is_active?: boolean
          name_ar?: string | null
          name_en?: string
          pack_count?: number | null
          pack_type_code?: string | null
          photo_path?: string | null
          size_unit_code?: string | null
          size_value?: number | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "products_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_pack_type_code_fkey"
            columns: ["pack_type_code"]
            isOneToOne: false
            referencedRelation: "product_pack_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "products_size_unit_code_fkey"
            columns: ["size_unit_code"]
            isOneToOne: false
            referencedRelation: "product_units"
            referencedColumns: ["code"]
          },
        ]
      }
      promoter_plus_report_lines: {
        Row: {
          created_at: string | null
          created_at_sys: string | null
          id: string
          is_available: boolean | null
          product_id: string
          quantity: number | null
          report_id: string
        }
        Insert: {
          created_at?: string | null
          created_at_sys?: string | null
          id?: string
          is_available?: boolean | null
          product_id: string
          quantity?: number | null
          report_id: string
        }
        Update: {
          created_at?: string | null
          created_at_sys?: string | null
          id?: string
          is_available?: boolean | null
          product_id?: string
          quantity?: number | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_plus_report_lines_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "promoter_plus_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_plus_reports: {
        Row: {
          client_id: string
          created_at: string
          created_at_sys: string | null
          created_by: string | null
          id: string
          market_id: string
          report_date: string
          report_date_sys: string | null
          total_sales_value: number | null
          updated_at: string | null
          updated_at_sys: string | null
          updated_by: string | null
          user_id: string
          visit_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          id?: string
          market_id: string
          report_date: string
          report_date_sys?: string | null
          total_sales_value?: number | null
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          user_id: string
          visit_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          id?: string
          market_id?: string
          report_date?: string
          report_date_sys?: string | null
          total_sales_value?: number | null
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_plus_reports_client_id_fkey1"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_plus_reports_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_report_lines: {
        Row: {
          accepted_count: number | null
          created_at: string
          created_at_sys: string | null
          extra: Json | null
          id: string
          product_id: string
          rejected_count: number | null
          report_id: string
          tasted_count: number | null
        }
        Insert: {
          accepted_count?: number | null
          created_at?: string
          created_at_sys?: string | null
          extra?: Json | null
          id?: string
          product_id: string
          rejected_count?: number | null
          report_id: string
          tasted_count?: number | null
        }
        Update: {
          accepted_count?: number | null
          created_at?: string
          created_at_sys?: string | null
          extra?: Json | null
          id?: string
          product_id?: string
          rejected_count?: number | null
          report_id?: string
          tasted_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_report_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_report_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "promoter_report_lines_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "promoter_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_reports: {
        Row: {
          best_seller_product_id: string | null
          client_id: string
          created_at: string
          created_at_sys: string | null
          id: string
          market_id: string
          report_date: string
          report_date_sys: string | null
          total_buyers: number | null
          total_contacts: number | null
          total_refusals: number | null
          total_users: number | null
          updated_at: string | null
          updated_at_sys: string | null
          updated_by: string | null
          user_id: string
          visit_id: string
        }
        Insert: {
          best_seller_product_id?: string | null
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          market_id: string
          report_date: string
          report_date_sys?: string | null
          total_buyers?: number | null
          total_contacts?: number | null
          total_refusals?: number | null
          total_users?: number | null
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          user_id: string
          visit_id: string
        }
        Update: {
          best_seller_product_id?: string | null
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          market_id?: string
          report_date?: string
          report_date_sys?: string | null
          total_buyers?: number | null
          total_contacts?: number | null
          total_refusals?: number | null
          total_users?: number | null
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_reports_best_seller_fkey"
            columns: ["best_seller_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_reports_best_seller_fkey"
            columns: ["best_seller_product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "promoter_reports_best_seller_product_id_fkey"
            columns: ["best_seller_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_reports_best_seller_product_id_fkey"
            columns: ["best_seller_product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "promoter_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_reports_market_id_fkey1"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "promoter_reports_visit_id_fkey1"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "promoter_reports_visit_id_fkey1"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_reports_visit_id_fkey1"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      reason_domains: {
        Row: {
          code: string
          id: number
          is_active: boolean
          label_ar: string
          label_en: string
        }
        Insert: {
          code: string
          id?: number
          is_active?: boolean
          label_ar: string
          label_en: string
        }
        Update: {
          code?: string
          id?: number
          is_active?: boolean
          label_ar?: string
          label_en?: string
        }
        Relationships: []
      }
      reasons: {
        Row: {
          allow_custom_text: boolean
          code: string
          created_at: string | null
          created_at_sys: string | null
          domain_code: string
          id: string
          is_active: boolean
          min_photos: number
          reason_ar: string
          reason_en: string
          requires_photo: boolean | null
          sort_order: number
        }
        Insert: {
          allow_custom_text?: boolean
          code: string
          created_at?: string | null
          created_at_sys?: string | null
          domain_code: string
          id?: string
          is_active?: boolean
          min_photos?: number
          reason_ar: string
          reason_en: string
          requires_photo?: boolean | null
          sort_order?: number
        }
        Update: {
          allow_custom_text?: boolean
          code?: string
          created_at?: string | null
          created_at_sys?: string | null
          domain_code?: string
          id?: string
          is_active?: boolean
          min_photos?: number
          reason_ar?: string
          reason_en?: string
          requires_photo?: boolean | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "reasons_domain_code_fkey"
            columns: ["domain_code"]
            isOneToOne: false
            referencedRelation: "reason_domains"
            referencedColumns: ["code"]
          },
        ]
      }
      regions: {
        Row: {
          code: string | null
          created_at: string
          created_at_sys: string | null
          id: string
          name_ar: string
          name_en: string
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          name_ar: string
          name_en: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: []
      }
      scheduled_email_reports: {
        Row: {
          client_id: string | null
          created_at: string
          created_at_sys: string | null
          filter_version: number
          filters: Json | null
          id: string
          is_active: boolean
          last_error_message: string | null
          last_run_at: string | null
          last_run_at_sys: string | null
          last_sent_at: string | null
          last_sent_at_sys: string | null
          next_run_at: string | null
          next_run_at_sys: string | null
          recipient_email: string
          report_type: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          filter_version?: number
          filters?: Json | null
          id?: string
          is_active?: boolean
          last_error_message?: string | null
          last_run_at?: string | null
          last_run_at_sys?: string | null
          last_sent_at?: string | null
          last_sent_at_sys?: string | null
          next_run_at?: string | null
          next_run_at_sys?: string | null
          recipient_email: string
          report_type?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          filter_version?: number
          filters?: Json | null
          id?: string
          is_active?: boolean
          last_error_message?: string | null
          last_run_at?: string | null
          last_run_at_sys?: string | null
          last_sent_at?: string | null
          last_sent_at_sys?: string | null
          next_run_at?: string | null
          next_run_at_sys?: string | null
          recipient_email?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_email_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      security_incidents: {
        Row: {
          admin_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          screen_name: string | null
          team_leader_id: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          screen_name?: string | null
          team_leader_id?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          screen_name?: string | null
          team_leader_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "security_incidents_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "security_incidents_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "security_incidents_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      sub_admin_clients: {
        Row: {
          client_id: string
          created_at: string | null
          sub_admin_account_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          sub_admin_account_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          sub_admin_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_admin_clients_account_fk"
            columns: ["sub_admin_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_admin_clients_account_fk"
            columns: ["sub_admin_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sub_admin_clients_account_fk"
            columns: ["sub_admin_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sub_admin_clients_account_fk"
            columns: ["sub_admin_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sub_admin_clients_account_fk"
            columns: ["sub_admin_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sub_admin_clients_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          active_from: string
          active_from_sys: string | null
          active_to: string | null
          active_to_sys: string | null
          client_id: string
          created_at: string
          created_at_sys: string | null
          id: string
          member_account_id: string
          team_leader_account_id: string
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          active_from?: string
          active_from_sys?: string | null
          active_to?: string | null
          active_to_sys?: string | null
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          member_account_id: string
          team_leader_account_id: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          active_from?: string
          active_from_sys?: string | null
          active_to?: string | null
          active_to_sys?: string | null
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          id?: string
          member_account_id?: string
          team_leader_account_id?: string
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_client_org_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_member_account_id_fkey"
            columns: ["member_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_member_account_id_fkey"
            columns: ["member_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_member_account_id_fkey"
            columns: ["member_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_member_account_id_fkey"
            columns: ["member_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_member_account_id_fkey"
            columns: ["member_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          auth_user_id: string | null
          device_id: string
          device_name: string | null
          last_accessed_at: string
          last_accessed_at_sys: string | null
          linked_at: string
          linked_at_sys: string | null
          platform: string | null
          user_id: string
        }
        Insert: {
          auth_user_id?: string | null
          device_id: string
          device_name?: string | null
          last_accessed_at?: string
          last_accessed_at_sys?: string | null
          linked_at?: string
          linked_at_sys?: string | null
          platform?: string | null
          user_id: string
        }
        Update: {
          auth_user_id?: string | null
          device_id?: string
          device_name?: string | null
          last_accessed_at?: string
          last_accessed_at_sys?: string | null
          linked_at?: string
          linked_at_sys?: string | null
          platform?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trusted_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "trusted_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "trusted_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "trusted_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      user_allowed_chains: {
        Row: {
          account_id: string
          chain_id: string
          client_id: string
          created_at: string
          created_at_sys: string | null
        }
        Insert: {
          account_id: string
          chain_id: string
          client_id: string
          created_at?: string
          created_at_sys?: string | null
        }
        Update: {
          account_id?: string
          chain_id?: string
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_allowed_chains_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_allowed_chains_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_allowed_chains_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_allowed_chains_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_allowed_chains_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_allowed_chains_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_allowed_chains_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_allowed_markets: {
        Row: {
          market_id: string
          user_id: string
        }
        Insert: {
          market_id: string
          user_id: string
        }
        Update: {
          market_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_allowed_markets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_allowed_markets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_allowed_markets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_allowed_markets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_allowed_markets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_allowed_markets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      user_app_sessions: {
        Row: {
          app_version: string | null
          auth_user_id: string
          client_id: string | null
          created_at: string
          created_at_sys: string | null
          device_id: string | null
          ended_at: string | null
          ended_at_sys: string | null
          id: string
          is_active: boolean
          last_seen_at: string
          last_seen_at_sys: string | null
          platform: string
          session_key: string
          started_at: string
          started_at_sys: string | null
        }
        Insert: {
          app_version?: string | null
          auth_user_id: string
          client_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          device_id?: string | null
          ended_at?: string | null
          ended_at_sys?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          last_seen_at_sys?: string | null
          platform: string
          session_key: string
          started_at?: string
          started_at_sys?: string | null
        }
        Update: {
          app_version?: string | null
          auth_user_id?: string
          client_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          device_id?: string | null
          ended_at?: string | null
          ended_at_sys?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          last_seen_at_sys?: string | null
          platform?: string
          session_key?: string
          started_at?: string
          started_at_sys?: string | null
        }
        Relationships: []
      }
      user_default_cities: {
        Row: {
          city_name: string
          created_at: string | null
          created_at_sys: string | null
          user_id: string
        }
        Insert: {
          city_name: string
          created_at?: string | null
          created_at_sys?: string | null
          user_id: string
        }
        Update: {
          city_name?: string
          created_at?: string | null
          created_at_sys?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_default_regions: {
        Row: {
          created_at: string | null
          created_at_sys: string | null
          region_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_at_sys?: string | null
          region_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_at_sys?: string | null
          region_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_divisions: {
        Row: {
          account_id: string
          client_id: string
          created_at: string
          created_at_sys: string | null
          division_id: string
          id: string
        }
        Insert: {
          account_id: string
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          division_id: string
          id?: string
        }
        Update: {
          account_id?: string
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          division_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_divisions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_divisions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_divisions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_divisions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_divisions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_divisions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_divisions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_managed_team_leaders: {
        Row: {
          created_at: string | null
          created_at_sys: string | null
          team_leader_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_at_sys?: string | null
          team_leader_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_at_sys?: string | null
          team_leader_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_managed_team_leaders_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_managed_team_leaders_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_managed_team_leaders_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_managed_team_leaders_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_managed_team_leaders_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_managed_team_leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_managed_team_leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_managed_team_leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_managed_team_leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_managed_team_leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      user_monthly_stats: {
        Row: {
          completed_visits: number | null
          last_updated: string | null
          month_date: string
          total_visits: number | null
          user_id: string
        }
        Insert: {
          completed_visits?: number | null
          last_updated?: string | null
          month_date: string
          total_visits?: number | null
          user_id: string
        }
        Update: {
          completed_visits?: number | null
          last_updated?: string | null
          month_date?: string
          total_visits?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          device_type: string | null
          id: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          device_type?: string | null
          id?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          device_type?: string | null
          id?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          created_at_sys: string | null
          id: string
          notifications: boolean | null
          requests: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_at_sys?: string | null
          id?: string
          notifications?: boolean | null
          requests?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_at_sys?: string | null
          id?: string
          notifications?: boolean | null
          requests?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      user_territories: {
        Row: {
          account_id: string
          city_id: string | null
          created_at: string
          created_at_sys: string | null
          id: string
          region_id: string | null
          updated_at: string
          updated_at_sys: string | null
        }
        Insert: {
          account_id: string
          city_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          region_id?: string | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Update: {
          account_id?: string
          city_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          region_id?: string | null
          updated_at?: string
          updated_at_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_territories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_territories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_territories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_territories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_territories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "user_territories_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_territories_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      users_devices: {
        Row: {
          app_version: string | null
          compromise_reason: string | null
          device_id: string
          device_name: string | null
          first_seen_at: string | null
          id: string
          is_compromised: boolean | null
          last_seen_at: string | null
          os_version: string | null
          platform: string | null
          signing_secret: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          compromise_reason?: string | null
          device_id: string
          device_name?: string | null
          first_seen_at?: string | null
          id?: string
          is_compromised?: boolean | null
          last_seen_at?: string | null
          os_version?: string | null
          platform?: string | null
          signing_secret: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          compromise_reason?: string | null
          device_id?: string
          device_name?: string | null
          first_seen_at?: string | null
          id?: string
          is_compromised?: boolean | null
          last_seen_at?: string | null
          os_version?: string | null
          platform?: string | null
          signing_secret?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_devices_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_devices_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "users_devices_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "users_devices_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "users_devices_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      visit_attachments: {
        Row: {
          attachment_type: string
          availability_id: string | null
          category_id: string | null
          created_at: string
          created_at_sys: string | null
          created_by: string | null
          division_id: string | null
          file_path: string
          id: string
          mch_event_id: string | null
          place_id: string | null
          visit_id: string
        }
        Insert: {
          attachment_type: string
          availability_id?: string | null
          category_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          division_id?: string | null
          file_path: string
          id?: string
          mch_event_id?: string | null
          place_id?: string | null
          visit_id: string
        }
        Update: {
          attachment_type?: string
          availability_id?: string | null
          category_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          division_id?: string | null
          file_path?: string
          id?: string
          mch_event_id?: string | null
          place_id?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_attachments_availability_id_fkey"
            columns: ["availability_id"]
            isOneToOne: false
            referencedRelation: "mch_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "visit_attachments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_attachments_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_mch_event_id_fkey"
            columns: ["mch_event_id"]
            isOneToOne: false
            referencedRelation: "mch_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "visit_attachments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_core: {
        Row: {
          actual_end: string | null
          actual_end_sys: string | null
          actual_start: string | null
          actual_start_sys: string | null
          client_id: string
          created_at: string
          created_at_sys: string | null
          created_by: string | null
          device_info: Json | null
          division_id: string | null
          end_photo: string | null
          id: string
          is_out_of_range: boolean | null
          market_id: string
          planned_end: string | null
          planned_end_sys: string | null
          planned_start: string | null
          planned_start_sys: string | null
          security_flags: string[] | null
          source: string
          start_location_point: string | null
          status: Database["public"]["Enums"]["visit_status_enum"]
          trust_score: number | null
          updated_at: string | null
          updated_at_sys: string | null
          updated_by: string | null
          user_id: string
          visit_date: string
          visit_date_sys: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_end_sys?: string | null
          actual_start?: string | null
          actual_start_sys?: string | null
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          device_info?: Json | null
          division_id?: string | null
          end_photo?: string | null
          id?: string
          is_out_of_range?: boolean | null
          market_id: string
          planned_end?: string | null
          planned_end_sys?: string | null
          planned_start?: string | null
          planned_start_sys?: string | null
          security_flags?: string[] | null
          source?: string
          start_location_point?: string | null
          status?: Database["public"]["Enums"]["visit_status_enum"]
          trust_score?: number | null
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          user_id: string
          visit_date: string
          visit_date_sys?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_end_sys?: string | null
          actual_start?: string | null
          actual_start_sys?: string | null
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          device_info?: Json | null
          division_id?: string | null
          end_photo?: string | null
          id?: string
          is_out_of_range?: boolean | null
          market_id?: string
          planned_end?: string | null
          planned_end_sys?: string | null
          planned_start?: string | null
          planned_start_sys?: string | null
          security_flags?: string[] | null
          source?: string
          start_location_point?: string | null
          status?: Database["public"]["Enums"]["visit_status_enum"]
          trust_score?: number | null
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          user_id?: string
          visit_date?: string
          visit_date_sys?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_core_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      visit_end_reason_policy: {
        Row: {
          allow_custom_text: boolean
          client_id: string | null
          id: string
          is_active: boolean
          min_photos: number
          reason_id: string
          requires_photo: boolean
        }
        Insert: {
          allow_custom_text?: boolean
          client_id?: string | null
          id?: string
          is_active?: boolean
          min_photos?: number
          reason_id: string
          requires_photo?: boolean
        }
        Update: {
          allow_custom_text?: boolean
          client_id?: string | null
          id?: string
          is_active?: boolean
          min_photos?: number
          reason_id?: string
          requires_photo?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "visit_end_reason_policy_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_end_reason_policy_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_eod_snapshot_runs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: number
          rows_inserted: number | null
          run_started_at: string
          snapshot_date: string
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          rows_inserted?: number | null
          run_started_at?: string
          snapshot_date: string
          status: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          rows_inserted?: number | null
          run_started_at?: string
          snapshot_date?: string
          status?: string
        }
        Relationships: []
      }
      visit_events: {
        Row: {
          actor_account_id: string | null
          actor_role: string | null
          client_id: string
          effective_at: string
          effective_at_sys: string
          event_type: Database["public"]["Enums"]["visit_event_type_enum"]
          from_status: Database["public"]["Enums"]["visit_status_enum"] | null
          id: string
          market_id: string
          meta: Json
          reason_custom: string | null
          reason_id: string | null
          snapshot_date: string | null
          source: string | null
          to_status: Database["public"]["Enums"]["visit_status_enum"] | null
          user_id: string
          visit_id: string
        }
        Insert: {
          actor_account_id?: string | null
          actor_role?: string | null
          client_id: string
          effective_at?: string
          effective_at_sys?: string
          event_type: Database["public"]["Enums"]["visit_event_type_enum"]
          from_status?: Database["public"]["Enums"]["visit_status_enum"] | null
          id?: string
          market_id: string
          meta?: Json
          reason_custom?: string | null
          reason_id?: string | null
          snapshot_date?: string | null
          source?: string | null
          to_status?: Database["public"]["Enums"]["visit_status_enum"] | null
          user_id: string
          visit_id: string
        }
        Update: {
          actor_account_id?: string | null
          actor_role?: string | null
          client_id?: string
          effective_at?: string
          effective_at_sys?: string
          event_type?: Database["public"]["Enums"]["visit_event_type_enum"]
          from_status?: Database["public"]["Enums"]["visit_status_enum"] | null
          id?: string
          market_id?: string
          meta?: Json
          reason_custom?: string | null
          reason_id?: string | null
          snapshot_date?: string | null
          source?: string | null
          to_status?: Database["public"]["Enums"]["visit_status_enum"] | null
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "visit_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_kpi_daily: {
        Row: {
          cancelled_visits: number
          completed_visits: number
          completion_rate_pct: number
          created_at: string
          created_at_sys: string
          id: number
          pending_visits: number
          remark_ar: string
          remark_en: string
          remark_level: number
          scope_id: string | null
          scope_type: string
          snapshot_date: string
          total_visits: number
        }
        Insert: {
          cancelled_visits: number
          completed_visits: number
          completion_rate_pct: number
          created_at?: string
          created_at_sys?: string
          id?: number
          pending_visits: number
          remark_ar: string
          remark_en: string
          remark_level: number
          scope_id?: string | null
          scope_type?: string
          snapshot_date: string
          total_visits: number
        }
        Update: {
          cancelled_visits?: number
          completed_visits?: number
          completion_rate_pct?: number
          created_at?: string
          created_at_sys?: string
          id?: number
          pending_visits?: number
          remark_ar?: string
          remark_en?: string
          remark_level?: number
          scope_id?: string | null
          scope_type?: string
          snapshot_date?: string
          total_visits?: number
        }
        Relationships: []
      }
      visit_offroute_request_events: {
        Row: {
          action_at: string | null
          action_at_sys: string
          action_type: string
          actor_account_id: string | null
          actor_source: string | null
          id: string
          new_status:
            | Database["public"]["Enums"]["offroute_request_status"]
            | null
          notes: string | null
          old_status:
            | Database["public"]["Enums"]["offroute_request_status"]
            | null
          reason_custom: string | null
          reason_id: string | null
          request_id: string
        }
        Insert: {
          action_at?: string | null
          action_at_sys?: string
          action_type: string
          actor_account_id?: string | null
          actor_source?: string | null
          id?: string
          new_status?:
            | Database["public"]["Enums"]["offroute_request_status"]
            | null
          notes?: string | null
          old_status?:
            | Database["public"]["Enums"]["offroute_request_status"]
            | null
          reason_custom?: string | null
          reason_id?: string | null
          request_id: string
        }
        Update: {
          action_at?: string | null
          action_at_sys?: string
          action_type?: string
          actor_account_id?: string | null
          actor_source?: string | null
          id?: string
          new_status?:
            | Database["public"]["Enums"]["offroute_request_status"]
            | null
          notes?: string | null
          old_status?:
            | Database["public"]["Enums"]["offroute_request_status"]
            | null
          reason_custom?: string | null
          reason_id?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_offroute_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "visit_offroute_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_offroute_request_history: {
        Row: {
          action_by_user_id: string | null
          action_note: string | null
          action_type: string
          client_id: string | null
          created_at: string
          created_at_sys: string | null
          id: string
          new_status: string | null
          old_status: string | null
          request_id: string
          user_id: string | null
          visit_id: string | null
        }
        Insert: {
          action_by_user_id?: string | null
          action_note?: string | null
          action_type: string
          client_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          request_id: string
          user_id?: string | null
          visit_id?: string | null
        }
        Update: {
          action_by_user_id?: string | null
          action_note?: string | null
          action_type?: string
          client_id?: string | null
          created_at?: string
          created_at_sys?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          request_id?: string
          user_id?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_offroute_request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "visit_offroute_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_offroute_requests: {
        Row: {
          approver_account_id: string | null
          auto_approved: boolean
          client_id: string
          created_at: string
          created_at_sys: string | null
          decided_at: string | null
          decided_at_sys: string | null
          division_id: string | null
          id: string
          market_id: string
          reason_custom: string | null
          reason_id: string | null
          requested_at: string
          requested_at_sys: string | null
          requester_account_id: string
          source: string
          status: Database["public"]["Enums"]["offroute_request_status"]
          updated_at: string
          updated_at_sys: string | null
          visit_id: string | null
          wait_seconds: number | null
        }
        Insert: {
          approver_account_id?: string | null
          auto_approved?: boolean
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          decided_at?: string | null
          decided_at_sys?: string | null
          division_id?: string | null
          id?: string
          market_id: string
          reason_custom?: string | null
          reason_id?: string | null
          requested_at?: string
          requested_at_sys?: string | null
          requester_account_id: string
          source?: string
          status?: Database["public"]["Enums"]["offroute_request_status"]
          updated_at?: string
          updated_at_sys?: string | null
          visit_id?: string | null
          wait_seconds?: number | null
        }
        Update: {
          approver_account_id?: string | null
          auto_approved?: boolean
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          decided_at?: string | null
          decided_at_sys?: string | null
          division_id?: string | null
          id?: string
          market_id?: string
          reason_custom?: string | null
          reason_id?: string | null
          requested_at?: string
          requested_at_sys?: string | null
          requester_account_id?: string
          source?: string
          status?: Database["public"]["Enums"]["offroute_request_status"]
          updated_at?: string
          updated_at_sys?: string | null
          visit_id?: string | null
          wait_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_offroute_requests_approver_account_id_fkey"
            columns: ["approver_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_approver_account_id_fkey"
            columns: ["approver_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_approver_account_id_fkey"
            columns: ["approver_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_approver_account_id_fkey"
            columns: ["approver_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_approver_account_id_fkey"
            columns: ["approver_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_requester_account_id_fkey"
            columns: ["requester_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_requester_account_id_fkey"
            columns: ["requester_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_requester_account_id_fkey"
            columns: ["requester_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_requester_account_id_fkey"
            columns: ["requester_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_requester_account_id_fkey"
            columns: ["requester_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_offroute_requests_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_outcomes: {
        Row: {
          end_photo: string | null
          end_reason_custom: string | null
          end_reason_id: string | null
          ended_at: string
          ended_at_sys: string | null
          ended_by: string | null
          outcome_status: Database["public"]["Enums"]["visit_outcome_status_enum"]
          visit_id: string
        }
        Insert: {
          end_photo?: string | null
          end_reason_custom?: string | null
          end_reason_id?: string | null
          ended_at?: string
          ended_at_sys?: string | null
          ended_by?: string | null
          outcome_status: Database["public"]["Enums"]["visit_outcome_status_enum"]
          visit_id: string
        }
        Update: {
          end_photo?: string | null
          end_reason_custom?: string | null
          end_reason_id?: string | null
          ended_at?: string
          ended_at_sys?: string | null
          ended_by?: string | null
          outcome_status?: Database["public"]["Enums"]["visit_outcome_status_enum"]
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_outcomes_end_reason_id_fkey"
            columns: ["end_reason_id"]
            isOneToOne: false
            referencedRelation: "reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_outcomes_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_outcomes_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_outcomes_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_outcomes_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_outcomes_ended_by_fkey"
            columns: ["ended_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_outcomes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "visit_outcomes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_outcomes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_remarks: {
        Row: {
          author_account_id: string
          author_role: string
          channel: string
          created_at: string
          created_at_sys: string | null
          created_by: string | null
          id: string
          note: string
          updated_at: string | null
          updated_at_sys: string | null
          updated_by: string | null
          visibility_scope: string | null
          visit_id: string
        }
        Insert: {
          author_account_id: string
          author_role: string
          channel?: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          id?: string
          note: string
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          visibility_scope?: string | null
          visit_id: string
        }
        Update: {
          author_account_id?: string
          author_role?: string
          channel?: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          id?: string
          note?: string
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          visibility_scope?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_remarks_author_account_id_fkey"
            columns: ["author_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_remarks_author_account_id_fkey"
            columns: ["author_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_author_account_id_fkey"
            columns: ["author_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_author_account_id_fkey"
            columns: ["author_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_author_account_id_fkey"
            columns: ["author_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_remarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_remarks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_remarks_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "visit_remarks_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_remarks_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_schedule_rules: {
        Row: {
          client_id: string
          created_at: string
          created_at_sys: string | null
          created_by: string | null
          days_of_week: number[]
          division_id: string | null
          end_date: string | null
          end_date_sys: string | null
          field_role: string
          frequency_per_month: number
          id: string
          is_active: boolean
          market_id: string
          start_date: string
          start_date_sys: string | null
          start_week: number
          updated_at: string | null
          updated_at_sys: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          days_of_week: number[]
          division_id?: string | null
          end_date?: string | null
          end_date_sys?: string | null
          field_role: string
          frequency_per_month: number
          id?: string
          is_active?: boolean
          market_id: string
          start_date: string
          start_date_sys?: string | null
          start_week: number
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          days_of_week?: number[]
          division_id?: string | null
          end_date?: string | null
          end_date_sys?: string | null
          field_role?: string
          frequency_per_month?: number
          id?: string
          is_active?: boolean
          market_id?: string
          start_date?: string
          start_date_sys?: string | null
          start_week?: number
          updated_at?: string | null
          updated_at_sys?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_schedule_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "client_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_schedule_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      visit_status_history: {
        Row: {
          created_at: string
          created_at_sys: string | null
          created_by: string | null
          from_status: string | null
          id: string
          reason_code: string | null
          reason_text: string | null
          to_status: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          from_status?: string | null
          id?: string
          reason_code?: string | null
          reason_text?: string | null
          to_status: string
          visit_id: string
        }
        Update: {
          created_at?: string
          created_at_sys?: string | null
          created_by?: string | null
          from_status?: string | null
          id?: string
          reason_code?: string | null
          reason_text?: string | null
          to_status?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_status_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_status_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_status_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_status_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_status_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_status_history_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "visit_status_history_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_status_history_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_team_map_new: {
        Row: {
          created_at: string
          created_at_sys: string | null
          field_role: string
          id: string
          is_owner: boolean
          role: string
          user_id: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          created_at_sys?: string | null
          field_role?: string
          id?: string
          is_owner?: boolean
          role: string
          user_id: string
          visit_id: string
        }
        Update: {
          created_at?: string
          created_at_sys?: string | null
          field_role?: string
          id?: string
          is_owner?: boolean
          role?: string
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_team_map_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_team_map_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_team_map_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_team_map_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_team_map_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_team_map_new_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "visit_team_map_new_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_team_map_new_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_trigger_check: {
        Row: {
          actual_events: string[] | null
          actual_function: unknown
          actual_schema: unknown
          actual_table: unknown
          actual_timing: string | null
          expected_events: string[] | null
          expected_function: string | null
          expected_schema: string | null
          expected_table: string | null
          expected_timing: string | null
          is_ok: boolean | null
          trigger_name: string | null
        }
        Relationships: []
      }
      index_advisor_missing_fk_indexes: {
        Row: {
          column_name: unknown
          constraint_def: string | null
          constraint_name: unknown
          relid: unknown
          schema_name: unknown
          table_name: unknown
        }
        Relationships: []
      }
      mv_client_place_products: {
        Row: {
          category_id: string | null
          category_name_ar: string | null
          category_name_en: string | null
          client_id: string | null
          client_name_ar: string | null
          client_name_en: string | null
          client_product_active: boolean | null
          client_product_listed: boolean | null
          display_order: number | null
          global_sku_code: string | null
          is_mandatory: boolean | null
          place_code: string | null
          place_id: string | null
          place_name_ar: string | null
          place_name_en: string | null
          place_policy_active: boolean | null
          product_id: string | null
          product_name_ar: string | null
          product_name_en: string | null
          requires_full_entry: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_place_products_v2_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_place_products_v2_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "availability_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_place_products_v2_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_place_products_v2_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_unified"
            referencedColumns: ["product_id"]
          },
        ]
      }
      v_account_effective_status: {
        Row: {
          account_id: string | null
          account_status: Database["public"]["Enums"]["account_status"] | null
          client_user_active: boolean | null
          effective_status: string | null
          email: string | null
          org_id: string | null
          org_is_active: boolean | null
          org_name: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_active_client: {
        Row: {
          client_id: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_categories_unified: {
        Row: {
          id: string | null
          name_ar: string | null
          name_en: string | null
        }
        Insert: {
          id?: string | null
          name_ar?: string | null
          name_en?: string | null
        }
        Update: {
          id?: string | null
          name_ar?: string | null
          name_en?: string | null
        }
        Relationships: []
      }
      v_client_portal_hierarchy_flat: {
        Row: {
          account_id: string | null
          client_id: string | null
          depth: number | null
          division_id: string | null
          root_account_id: string | null
        }
        Relationships: []
      }
      v_client_portal_users: {
        Row: {
          account_id: string | null
          client_id: string | null
          created_at: string | null
          division_code: string | null
          division_name_ar: string | null
          division_name_en: string | null
          email: string | null
          full_name: string | null
          role_key: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_user_roles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_user_roles_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "client_portal_role_catalog"
            referencedColumns: ["key"]
          },
        ]
      }
      v_field_user_presence_today: {
        Row: {
          account_id: string | null
          account_status: Database["public"]["Enums"]["account_status"] | null
          arabic_name: string | null
          auth_user_id: string | null
          ended_at: string | null
          field_role: Database["public"]["Enums"]["field_role"] | null
          first_login_ever_at: string | null
          first_login_today_at: string | null
          full_name: string | null
          is_active: boolean | null
          last_login_at: string | null
          last_seen_at: string | null
          org_id: string | null
          platform: string | null
          presence_status: string | null
          session_client_id: string | null
          session_started_at: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_clients: {
        Row: {
          account_id: string | null
          client_id: string | null
          field_role: Database["public"]["Enums"]["field_role"] | null
          portal_role: Database["public"]["Enums"]["portal_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_notification_execution: {
        Row: {
          action_payload: Json | null
          action_type: string | null
          id: string | null
          notification_id: string | null
          performed_at: string | null
          performed_at_sys: string | null
          user_id: string | null
        }
        Insert: {
          action_payload?: Json | null
          action_type?: string | null
          id?: string | null
          notification_id?: string | null
          performed_at?: string | null
          performed_at_sys?: string | null
          user_id?: string | null
        }
        Update: {
          action_payload?: Json | null
          action_type?: string | null
          id?: string | null
          notification_id?: string | null
          performed_at?: string | null
          performed_at_sys?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_actions_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "notification_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_products_unified: {
        Row: {
          alt_code: string | null
          brand_id: string | null
          brand_name_ar: string | null
          brand_name_en: string | null
          category_code: string | null
          category_id: string | null
          category_level: number | null
          category_name_ar: string | null
          category_name_en: string | null
          client_barcode: string | null
          client_code: string | null
          client_id: string | null
          client_name_ar: string | null
          client_name_en: string | null
          client_product_is_active: boolean | null
          client_product_name_ar: string | null
          client_product_name_en: string | null
          client_sku_code: string | null
          end_date: string | null
          global_sku_code: string | null
          is_effectively_active: boolean | null
          is_listed: boolean | null
          pack_count: number | null
          pack_type_code: string | null
          pack_type_name_ar: string | null
          pack_type_name_en: string | null
          primary_barcode: string | null
          primary_barcode_type: string | null
          product_id: string | null
          product_is_active: boolean | null
          product_name_ar: string | null
          product_name_en: string | null
          size_unit_code: string | null
          size_unit_name_ar: string | null
          size_unit_name_en: string | null
          size_value: number | null
          start_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_client_place_products"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "products_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_categories_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_pack_type_code_fkey"
            columns: ["pack_type_code"]
            isOneToOne: false
            referencedRelation: "product_pack_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "products_size_unit_code_fkey"
            columns: ["size_unit_code"]
            isOneToOne: false
            referencedRelation: "product_units"
            referencedColumns: ["code"]
          },
        ]
      }
      v_team_live_status: {
        Row: {
          account_id: string | null
          alert_type: string | null
          arabic_name: string | null
          avatar_url: string | null
          field_role: string | null
          first_login_at: string | null
          full_name: string | null
          is_online: boolean | null
          last_active_at: string | null
          phone_number: string | null
          team_leader_account_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "team_memberships_team_leader_account_id_fkey"
            columns: ["team_leader_account_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      v_user_daily_sessions: {
        Row: {
          auth_user_id: string | null
          client_id: string | null
          first_login_at: string | null
          last_seen_at: string | null
          sessions_count: number | null
          total_work_minutes: number | null
          work_date: string | null
        }
        Relationships: []
      }
      v_visit_daily_snapshot: {
        Row: {
          client_id: string | null
          event_id: string | null
          finished_at: string | null
          market_id: string | null
          reason_custom: string | null
          reason_id: string | null
          snapshot_date: string | null
          source: string | null
          started_at: string | null
          status_at_eod: Database["public"]["Enums"]["visit_status_enum"] | null
          status_text: string | null
          user_id: string | null
          visit_date: string | null
          visit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_visits_normalized"
            referencedColumns: ["visit_id"]
          },
          {
            foreignKeyName: "visit_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "view_mch_yesterday_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visit_core"
            referencedColumns: ["id"]
          },
        ]
      }
      v_visits_normalized: {
        Row: {
          chain_id: string | null
          city_id: string | null
          client_id: string | null
          market_id: string | null
          region_id: string | null
          user_id: string | null
          visit_date: string | null
          visit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "markets_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markets_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
      view_mch_yesterday_visits: {
        Row: {
          branch_name: string | null
          branch_name_ar: string | null
          client_id: string | null
          client_name_ar: string | null
          client_name_en: string | null
          id: string | null
          market_id: string | null
          status: Database["public"]["Enums"]["visit_status_enum"] | null
          store_name: string | null
          user_id: string | null
          visit_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_core_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_account_effective_status"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_client_portal_users"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_field_user_presence_today"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "visit_core_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_team_live_status"
            referencedColumns: ["account_id"]
          },
        ]
      }
    }
    Functions: {
      _current_user_id: { Args: never; Returns: string }
      account_can_access_client: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      account_can_access_visit: {
        Args: { p_visit_id: string }
        Returns: boolean
      }
      account_mark_password_changed: { Args: never; Returns: undefined }
      active_weeks: {
        Args: { p_frequency: number; p_start_week: number }
        Returns: number[]
      }
      admin_availability_kpis: {
        Args: {
          p_cities?: string[]
          p_client: string
          p_filter_city?: string
          p_filter_region?: string
          p_filter_store?: string
          p_from?: string
          p_regions?: string[]
          p_stores?: string[]
          p_team_leader?: string
          p_to?: string
          p_user_ids?: string[]
        }
        Returns: {
          available_items: number
          not_available_items: number
          total_items: number
        }[]
      }
      admin_kpis:
        | {
            Args: {
              p_cities?: string[]
              p_client: string
              p_filter_city?: string
              p_filter_region?: string
              p_filter_store?: string
              p_from?: string
              p_regions?: string[]
              p_stores?: string[]
              p_team_leader?: string
              p_to?: string
              p_user_ids?: string[]
            }
            Returns: {
              completed_visits: number
              incomplete_visits: number
              total_visit_minutes: number
              total_visits: number
              total_work_minutes: number
            }[]
          }
        | {
            Args: {
              p_cities?: string[]
              p_client: string
              p_filter_city?: string
              p_filter_region?: string
              p_filter_store?: string
              p_from?: string
              p_regions?: string[]
              p_stores?: string[]
              p_to?: string
              p_user_ids?: string[]
            }
            Returns: {
              completed_visits: number
              compliant_items: number
              incomplete_visits: number
              non_compliant_items: number
              total_visit_minutes: number
              total_visits: number
              total_work_minutes: number
            }[]
          }
      admin_kpis_all_clients: {
        Args: {
          p_cities: string[]
          p_filter_city: string
          p_filter_region: string
          p_filter_store: string
          p_from: string
          p_regions: string[]
          p_stores: string[]
          p_team_leader: string
          p_to: string
          p_user_ids: string[]
        }
        Returns: {
          client_id: string
          completed_visits: number
          incomplete_visits: number
          total_visit_minutes: number
          total_visits: number
        }[]
      }
      admin_provision_field_account: {
        Args: {
          p_arabic_name: string
          p_client_id: string
          p_email: string
          p_field_role: Database["public"]["Enums"]["field_role"]
          p_full_name: string
          p_portal_role?: Database["public"]["Enums"]["portal_role"]
          p_username: string
        }
        Returns: string
      }
      admin_provision_field_user: {
        Args: {
          p_arabic_name: string
          p_auth_email: string
          p_client_org_id: string
          p_field_role: Database["public"]["Enums"]["field_role"]
          p_full_name: string
          p_portal_role: Database["public"]["Enums"]["portal_role"]
          p_temp_code: string
          p_username: string
        }
        Returns: string
      }
      admin_provision_team_leader: {
        Args: {
          p_arabic_name: string
          p_auth_email: string
          p_client_org_id: string
          p_full_name: string
          p_temp_code: string
          p_username: string
        }
        Returns: string
      }
      admin_reset_trusted_device: {
        Args: { p_account_id: string }
        Returns: boolean
      }
      approve_offroute_request: {
        Args: { p_approver_account_id: string; p_request_id: string }
        Returns: string
      }
      assert_offroute_permission: {
        Args: {
          p_client_id: string
          p_market_id: string
          p_user_account_id: string
          p_visit_date: string
        }
        Returns: string
      }
      can_access_client: { Args: { _client_id: string }; Returns: boolean }
      can_access_client_folder: {
        Args: { folder_name: string }
        Returns: boolean
      }
      can_access_complaint_file: {
        Args: { path_name: string }
        Returns: boolean
      }
      can_access_event: { Args: { _event_id: string }; Returns: boolean }
      can_access_inventory_report: {
        Args: { _report_id: string }
        Returns: boolean
      }
      can_access_market: {
        Args: { p_client_id: string; p_market_id: string; p_user_id: string }
        Returns: boolean
      }
      can_access_portal_account: {
        Args: { p_client_id: string; p_target_account_id: string }
        Returns: boolean
      }
      can_access_promoter_plus_report: {
        Args: { _report_id: string }
        Returns: boolean
      }
      can_access_promoter_report: {
        Args: { _report_id: string }
        Returns: boolean
      }
      can_access_visit:
        | { Args: { _client_id: string; _user_id: string }; Returns: boolean }
        | { Args: { _visit_id: string }; Returns: boolean }
      can_access_visit_id: { Args: { _visit_id: string }; Returns: boolean }
      can_account_access_client: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      can_account_access_organization: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      can_admin_access_client: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      can_admin_access_visit: { Args: { p_visit_id: string }; Returns: boolean }
      can_view_storage_file: {
        Args: { target_auth_id_text: string }
        Returns: boolean
      }
      capture_email_job_response: {
        Args: { p_req_id: number }
        Returns: undefined
      }
      capture_visit_eod_snapshot: {
        Args: { p_snapshot_date?: string }
        Returns: undefined
      }
      check_access_by_path_translation: {
        Args: { file_name: string }
        Returns: boolean
      }
      check_client_access_smart: {
        Args: { folder_name: string }
        Returns: boolean
      }
      check_client_folder_access: {
        Args: { client_folder_text: string }
        Returns: boolean
      }
      check_complaint_access: { Args: { file_path: string }; Returns: boolean }
      check_complaint_access_v2: {
        Args: { file_owner_id: string }
        Returns: boolean
      }
      check_email_exists: { Args: { email_to_check: string }; Returns: boolean }
      check_my_division_access: {
        Args: { target_division_id: string }
        Returns: boolean
      }
      check_ownership: { Args: { record_user_id: string }; Returns: boolean }
      check_photo_upload_perm: {
        Args: { target_visit_id: string }
        Returns: boolean
      }
      close_stale_sessions: { Args: never; Returns: undefined }
      complete_notification: { Args: { p_id: string }; Returns: undefined }
      compute_jp_status_for_date_v2: {
        Args: { p_date: string; p_visit_id: string }
        Returns: string
      }
      compute_tl_jp_status_for_date: {
        Args: { p_date: string; p_tlvisit_id: string }
        Returns: string
      }
      create_ad_hoc_visit: {
        Args: { p_client_id: string; p_market_id: string }
        Returns: string
      }
      create_full_inventory_report: {
        Args: {
          p_batches: Json
          p_client_id: string
          p_custom_reason: string
          p_is_available: boolean
          p_market_id: string
          p_not_available_reason: string
          p_photos: string[]
          p_product_id: string
          p_user_id: string
          p_visit_id: string
        }
        Returns: string
      }
      create_notification_for_auth_user: {
        Args: {
          p_auth_user_id: string
          p_client_id?: string
          p_message_ar: string
          p_message_en: string
          p_title_ar: string
          p_title_en: string
        }
        Returns: string
      }
      current_account_id: { Args: never; Returns: string }
      current_app_client_id: { Args: never; Returns: string }
      current_app_user_uuid: { Args: never; Returns: string }
      daily_tasks: { Args: never; Returns: undefined }
      end_visit_transaction:
        | {
            Args: {
              p_end_photo?: string
              p_lat?: number
              p_lon?: number
              p_reason_custom?: string
              p_reason_id: string
              p_status?: string
              p_user_id: string
              p_visit_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_division_id?: string
              p_end_photo: string
              p_reason_custom: string
              p_reason_id: string
              p_status: string
              p_user_id: string
              p_visit_id: string
            }
            Returns: Json
          }
      finish_visit: {
        Args: {
          p_end_reason_custom: string
          p_end_reason_id: string
          p_outcome_status: string
          p_user_id: string
          p_visit_id: string
        }
        Returns: undefined
      }
      fn_av_payload: {
        Args: { p_client_id: string; p_place_id: string }
        Returns: Json
      }
      fn_client_categories: {
        Args: { p_client_id: string }
        Returns: {
          id: string
          name_ar: string
          name_en: string
        }[]
      }
      fn_place_products: {
        Args: {
          p_client_id: string
          p_is_primary?: boolean
          p_place_id: string
        }
        Returns: {
          arabic_name: string
          category_id: string
          category_name_ar: string
          category_name_en: string
          image_url: string
          name: string
          product_id: string
        }[]
      }
      fn_refresh_mem_av: { Args: never; Returns: Json }
      generate_account_activation_code: {
        Args: {
          p_account_id: string
          p_created_by_account_id: string
          p_ttl_minutes?: number
        }
        Returns: string
      }
      generate_daily_visits: { Args: never; Returns: undefined }
      generate_daily_visits_batch: { Args: never; Returns: undefined }
      get_active_client: {
        Args: never
        Returns: {
          client_id: string
        }[]
      }
      get_allowed_client_ids_for_reasons: { Args: never; Returns: string[] }
      get_auth_account_id: { Args: never; Returns: string }
      get_auth_client_id: { Args: never; Returns: string }
      get_auth_division_id: { Args: never; Returns: string }
      get_auth_role_text: { Args: never; Returns: string }
      get_availability_totals: {
        Args: {
          p_city?: string
          p_client_id: string
          p_from_date?: string
          p_region?: string
          p_store?: string
          p_team_leader_id?: string
          p_to_date?: string
        }
        Returns: {
          total_available: number
          total_items: number
          total_unavailable: number
        }[]
      }
      get_cities: {
        Args: { p_client: string; p_region?: string }
        Returns: {
          city: string
          city_norm: string
        }[]
      }
      get_complaint_details_secure: {
        Args: { p_complaint_id: string }
        Returns: Json
      }
      get_complaint_targets: {
        Args: never
        Returns: {
          account_id: string
          arabic_name: string
          avatar_url: string
          full_name: string
          role_key: string
        }[]
      }
      get_coordinator_deep_team_ids: {
        Args: never
        Returns: {
          account_id: string
        }[]
      }
      get_daily_visits_email_payload: {
        Args: { p_schedule_id: string }
        Returns: Json
      }
      get_daily_visits_for_schedule: {
        Args: { p_schedule_id: string }
        Returns: {
          chain_id: string
          city_id: string
          client_id: string
          market_id: string
          region_id: string
          user_id: string
          visit_date: string
          visit_id: string
        }[]
      }
      get_dashboard_metrics: {
        Args: {
          p_city?: string
          p_client: string
          p_completed_value?: string
          p_date_col?: string
          p_date_from?: string
          p_date_to?: string
          p_region?: string
          p_status_col?: string
          p_stores?: string[]
        }
        Returns: {
          completed_visits: number
          incomplete_visits: number
          total_visits: number
        }[]
      }
      get_effective_filters: {
        Args: { p_client_id: string; p_user: string }
        Returns: {
          allowed_markets: string[]
          default_city: string[]
          default_region: string[]
          team_leader_ids: string[]
        }[]
      }
      get_effective_scope: {
        Args: { p_user: string }
        Returns: {
          branch_names: string[]
          city_names: string[]
          market_ids: string[]
          region_names: string[]
          store_names: string[]
        }[]
      }
      get_email_job_log_recent: {
        Args: { p_days?: number }
        Returns: {
          error_msg: string
          id: number
          note: string
          ran_at: string
          resp_preview: string
          status_code: number
        }[]
      }
      get_inventory_filter_options: {
        Args: {
          p_city?: string
          p_client_id: string
          p_region?: string
          p_store?: string
        }
        Returns: Json
      }
      get_inventory_reports: {
        Args: {
          p_city?: string
          p_client_id: string
          p_date_from?: string
          p_date_to?: string
          p_region?: string
          p_store?: string
          p_team_leader?: string
        }
        Returns: {
          branch: string
          city: string
          created_at: string
          custom_reason: string
          expiry_date: string[]
          id: string
          is_available: boolean
          market_id: string
          photos: string[]
          product_name: string
          quantity: number[]
          reason_ar: string
          reason_en: string
          region: string
          store: string
          user_arabic_name: string
          user_id: string
          user_name: string
        }[]
      }
      get_leader_dashboard_stats: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_leader_team: {
        Args: never
        Returns: {
          m_arabic_name: string
          m_full_name: string
          m_id: string
          m_role: string
          m_username: string
        }[]
      }
      get_markets_by_ids: {
        Args: { p_ids: string[] }
        Returns: {
          branch: string | null
          branch_ar: string | null
          chain_id: string | null
          city_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          region_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "markets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_mch_today_visits: {
        Args: never
        Returns: {
          branch_ar: string
          branch_en: string
          chain_id: string
          client_id: string
          client_logo: string
          client_name_ar: string
          client_name_en: string
          planned_start: string
          status: Database["public"]["Enums"]["visit_status_enum"]
          visit_date: string
          visit_id: string
        }[]
      }
      get_member_full_profile: { Args: { p_target_id: string }; Returns: Json }
      get_my_accessible_users_as_text: { Args: never; Returns: string[] }
      get_my_account_id: { Args: never; Returns: string }
      get_my_admin_client_id: { Args: never; Returns: string }
      get_my_assigned_markets: {
        Args: never
        Returns: {
          branch_ar: string
          branch_en: string
          chain_id: string
          city_id: string
          client_id: string
          client_name_ar: string
          client_name_en: string
          market_id: string
        }[]
      }
      get_my_client_features: { Args: never; Returns: Json }
      get_my_complaint_markets: {
        Args: never
        Returns: {
          branch: string
          branch_ar: string
          id: string
        }[]
      }
      get_my_context: {
        Args: never
        Returns: {
          my_client_id: string
          my_role: string
        }[]
      }
      get_my_division_id: { Args: never; Returns: string }
      get_my_leader_id: { Args: never; Returns: string }
      get_my_notifications_v17: {
        Args: { p_page_limit?: number; p_page_offset?: number }
        Returns: {
          action_status: string
          action_type: string
          created_at: string
          id: string
          is_read: boolean
          message_ar: string
          message_en: string
          title_ar: string
          title_en: string
        }[]
      }
      get_my_own_requests: {
        Args: { p_account_id: string }
        Returns: {
          client_name_ar: string
          client_name_en: string
          market_name_ar: string
          market_name_en: string
          reason_ar: string
          reason_en: string
          request_id: string
          requested_at: string
          status: string
        }[]
      }
      get_my_personal_stats: {
        Args: { end_date: string; start_date: string }
        Returns: {
          canceled_visits: number
          completed_visits: number
          completion_percent: number
          pending_visits: number
          performance_code: string
          total_visits: number
        }[]
      }
      get_my_profile: {
        Args: never
        Returns: {
          account_id: string
          allowed_divisions: Json
          arabic_name: string
          client_id: string
          field_role: string
          full_name: string
          multi_client_data: Json
          portal_role: string
        }[]
      }
      get_my_profile_secure: {
        Args: never
        Returns: {
          account_id: string
          allowed_divisions: Json
          arabic_name: string
          auth_user_id: string
          client_id: string
          division_id: string
          field_role: string
          full_name: string
          multi_client_data: Json
          org_id: string
          portal_role: string
        }[]
      }
      get_my_team_stats: {
        Args: { end_date: string; start_date: string }
        Returns: {
          avatar_url: string
          completed_visits: number
          member_id: string
          name_ar: string
          name_en: string
          percent: number
          total_visits: number
        }[]
      }
      get_my_team_status: {
        Args: never
        Returns: {
          account_id: string
          alert_type: string
          arabic_name: string
          avatar_url: string
          field_role: string
          first_login_at: string
          full_name: string
          is_online: boolean
          last_active_at: string
          phone_number: string
          user_id: string
        }[]
      }
      get_my_today_visits_v2: {
        Args: never
        Returns: {
          branch: string
          branch_ar: string
          branch_en: string
          client_logo: string
          client_name_ar: string
          client_name_en: string
          market_id: string
          planned_start: string
          status: string
          visit_id: string
        }[]
      }
      get_my_visits_v2: {
        Args: {
          page_number?: number
          page_size?: number
          query_date_from: string
          query_date_to: string
        }
        Returns: {
          client_id: string
          client_logo: string
          client_name_ar: string
          client_name_en: string
          market_coords: Json
          market_id: string
          market_name_ar: string
          market_name_en: string
          planned_start: string
          status: Database["public"]["Enums"]["visit_status_enum"]
          visit_date: string
          visit_id: string
        }[]
      }
      get_pending_badge_count_v17: { Args: never; Returns: number }
      get_recursive_downline_auth_ids: { Args: never; Returns: string[] }
      get_regions: {
        Args: { p_client: string }
        Returns: {
          region: string
          region_norm: string
        }[]
      }
      get_stores: {
        Args: { p_city?: string; p_client: string; p_region?: string }
        Returns: {
          store: string
          store_norm: string
        }[]
      }
      get_team_complaints_v2: {
        Args: { p_limit?: number; p_status?: string }
        Returns: {
          created_at: string
          description: string
          id: string
          market_name_ar: string
          market_name_en: string
          requester_avatar: string
          requester_name_ar: string
          requester_name_en: string
          status: string
        }[]
      }
      get_team_live_pulse: {
        Args: { p_leader_account_id: string }
        Returns: {
          account_id: string
          alert_type: string
          app_version: string
          arabic_name: string
          avatar_url: string
          field_role: string
          first_login_at: string
          full_name: string
          is_online: boolean
          last_active_at: string
          minutes_offline: number
          phone_number: string
          platform: string
          user_id: string
        }[]
      }
      get_user_notifications: {
        Args: {
          _client_id: string
          _team_leader_id: string
          _user_id: string
          _user_role: string
        }
        Returns: {
          client_id: string
          created_at: string
          is_read: boolean
          message_ar: string
          message_en: string
          notification_id: string
          read_at: string
          status: string
          title_ar: string
          title_en: string
        }[]
      }
      get_user_phone_secure: {
        Args: { target_account_id: string }
        Returns: string
      }
      get_user_pre_login: { Args: { p_identifier: string }; Returns: Json }
      get_user_unread_notifications_count: {
        Args: {
          _client_id: string
          _team_leader_id: string
          _user_id: string
          _user_role: string
        }
        Returns: number
      }
      get_user_visit_plan: {
        Args: { p_from: string; p_to: string; p_user_id: string }
        Returns: {
          client_id: string
          field_role: string
          market_id: string
          rule_id: string
          visit_date: string
        }[]
      }
      get_visit_cards_totals: {
        Args: {
          p_city?: string
          p_client_id: string
          p_from_date?: string
          p_region?: string
          p_store?: string
          p_team_leader_id?: string
          p_to_date?: string
        }
        Returns: {
          finished_pct: number
          finished_visits: number
          total_visits: number
          unfinished_pct: number
          unfinished_visits: number
        }[]
      }
      get_visit_inventory_products: {
        Args: { p_visit_id: string }
        Returns: {
          arabic_name: string
          category_id: string
          category_name_ar: string
          category_name_en: string
          global_sku_code: string
          id: string
          name: string
          photo_path: string
        }[]
      }
      get_visit_reasons: {
        Args: { p_stage: string; p_visit_id: string }
        Returns: {
          allow_custom_text: boolean
          id: string
          reason_ar: string
          reason_en: string
          requires_photo: boolean
        }[]
      }
      get_yesterday_visits_details:
        | {
            Args: { p_client_id: string; p_snapshot_date: string }
            Returns: {
              end_reason: string
              end_reason_ar: string
              end_reason_en: string
              end_visit_photo: string
              finished_at: string
              id: string
              market_branch: string
              market_city: string
              market_id: string
              market_region: string
              market_store: string
              started_at: string
              status: string
              team_leader_arabic_name: string
              team_leader_id: string
              team_leader_name: string
              team_leader_username: string
              user_arabic_name: string
              user_id: string
              user_name: string
              user_username: string
            }[]
          }
        | {
            Args: {
              p_city?: string
              p_client_id: string
              p_jp_state?: string
              p_region?: string
              p_snapshot_date: string
              p_status?: string
              p_store?: string
              p_team_leader_id?: string
            }
            Returns: {
              end_reason: string
              end_reason_ar: string
              end_reason_en: string
              end_visit_photo: string
              finished_at: string
              id: string
              jp_state: string
              market_branch: string
              market_city: string
              market_id: string
              market_region: string
              market_store: string
              started_at: string
              status: string
              team_leader_arabic_name: string
              team_leader_id: string
              team_leader_name: string
              team_leader_username: string
              user_arabic_name: string
              user_id: string
              user_name: string
              user_username: string
            }[]
          }
      insert_category_photo: {
        Args: {
          p_category_id: string
          p_created_by: string
          p_photo_url: string
          p_visit_id: string
        }
        Returns: string
      }
      insert_scheduled_report: {
        Args: {
          p_client_id: string
          p_filters: Json
          p_recipient_email: string
        }
        Returns: undefined
      }
      is_admin_or_service: { Args: never; Returns: boolean }
      is_assigned_via_map: { Args: { p_visit_id: string }; Returns: boolean }
      is_client_folder_accessible: {
        Args: { path_name: string }
        Returns: boolean
      }
      is_date_in_schedule: {
        Args: { p_date: string; p_rule_id: string }
        Returns: boolean
      }
      is_event_owner: { Args: { _event_id: string }; Returns: boolean }
      is_field_user: { Args: never; Returns: boolean }
      is_logged_in_or_admin: { Args: never; Returns: boolean }
      is_my_team_member: { Args: { target_user_id: string }; Returns: boolean }
      is_offroute_visit: {
        Args: {
          p_client_id: string
          p_market_id: string
          p_user_account_id: string
          p_visit_date: string
        }
        Returns: boolean
      }
      is_owner_in_my_team: { Args: { file_owner_id: string }; Returns: boolean }
      is_portal_admin: { Args: never; Returns: boolean }
      is_portal_super_admin: { Args: never; Returns: boolean }
      is_service_role_safe: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_super_admin_safe: { Args: never; Returns: boolean }
      is_team_leader: { Args: never; Returns: boolean }
      is_team_leader_of:
        | { Args: { target_user_uuid: string }; Returns: boolean }
        | { Args: { target_user_uuid_text: string }; Returns: boolean }
      is_tlvisit_scheduled_by_date: {
        Args: { p_date: string; p_tlvisit_id: string }
        Returns: boolean
      }
      is_visit_in_jp_for_date: {
        Args: { p_date: string; p_visit_id: string }
        Returns: boolean
      }
      is_visit_scheduled_by_date: {
        Args: { p_date: string; p_visit_id: string }
        Returns: boolean
      }
      ksa_now: { Args: never; Returns: string }
      link_auth_user:
        | {
            Args: { p_auth_user_id: string; p_user_id: string }
            Returns: undefined
          }
        | {
            Args: { p_auth_uid: string; p_email: string; p_user_id: string }
            Returns: undefined
          }
      link_auth_user_profile: { Args: never; Returns: undefined }
      log_screenshot_event: {
        Args: { p_device_info?: Json; p_screen_name: string }
        Returns: undefined
      }
      login_handshake_v2: {
        Args: {
          p_app_version: string
          p_attestation_token?: string
          p_device_id: string
          p_device_name: string
          p_os_version: string
          p_platform: string
          p_signing_secret: string
        }
        Returns: Json
      }
      logout_session: { Args: { p_session_key?: string }; Returns: boolean }
      mark_notification_done: {
        Args: { done_at: string; n_id: string; u_id: string }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { _notification_id: string }
        Returns: undefined
      }
      mark_notifications_read_v12: {
        Args: { p_notification_ids: string[] }
        Returns: undefined
      }
      norm_text: { Args: { t: string }; Returns: string }
      perform_complaint_action:
        | {
            Args: {
              p_action_type: string
              p_complaint_id: string
              p_note?: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_action_type: string
              p_complaint_id: string
              p_note?: string
              p_photo_path?: string
            }
            Returns: boolean
          }
      portal_get_field_user_presence_today: {
        Args: { p_client_id?: string }
        Returns: {
          account_id: string | null
          account_status: Database["public"]["Enums"]["account_status"] | null
          arabic_name: string | null
          auth_user_id: string | null
          ended_at: string | null
          field_role: Database["public"]["Enums"]["field_role"] | null
          first_login_ever_at: string | null
          first_login_today_at: string | null
          full_name: string | null
          is_active: boolean | null
          last_login_at: string | null
          last_seen_at: string | null
          org_id: string | null
          platform: string | null
          presence_status: string | null
          session_client_id: string | null
          session_started_at: string | null
          username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "v_field_user_presence_today"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      record_daily_visit_status_in_requests: { Args: never; Returns: undefined }
      refresh_v_visit_daily_snapshot: { Args: never; Returns: undefined }
      refresh_visit_kpi_daily: {
        Args: { p_snapshot_date?: string }
        Returns: undefined
      }
      reset_daily_tlvisits: { Args: never; Returns: undefined }
      reset_daily_visits: { Args: never; Returns: undefined }
      reset_tlvisits_today_fn: { Args: never; Returns: undefined }
      reset_visits_today_fn: { Args: never; Returns: undefined }
      resolve_login_identity: {
        Args: { p_identifier: string }
        Returns: {
          allowed_sections: Json
          email: string
        }[]
      }
      route_complaint_logic: {
        Args: {
          p_client_id: string
          p_requester_id: string
          p_target_ids: string[]
        }
        Returns: string
      }
      rpc_end_session: { Args: { p_session_key: string }; Returns: undefined }
      run_daily_visit_snapshoot: { Args: never; Returns: undefined }
      run_visit_eod_snapshot_job: { Args: never; Returns: undefined }
      send_daily_report: { Args: never; Returns: undefined }
      send_daily_report_enqueue: { Args: never; Returns: number }
      send_daily_report_job: { Args: never; Returns: undefined }
      send_leader_notification: {
        Args: {
          p_audience_type: string
          p_message_ar: string
          p_message_en: string
          p_target_role?: string
          p_target_user_ids?: string[]
          p_title_ar: string
          p_title_en: string
        }
        Returns: undefined
      }
      send_manual_notification: {
        Args: {
          p_message_ar: string
          p_message_en: string
          p_target_user_id: string
          p_title_ar: string
          p_title_en: string
        }
        Returns: undefined
      }
      send_notif_secure: {
        Args: {
          p_message_ar: string
          p_message_en: string
          p_target_user_id: string
          p_title_ar: string
          p_title_en: string
        }
        Returns: undefined
      }
      send_notification: {
        Args: {
          p_client_id: string
          p_for_user_single: string
          p_message_ar: string
          p_message_en: string
          p_title_ar: string
          p_title_en: string
        }
        Returns: undefined
      }
      send_notification_master: {
        Args: {
          p_audience_type: string
          p_message_ar: string
          p_message_en: string
          p_target_value?: string
          p_title_ar: string
          p_title_en: string
        }
        Returns: string
      }
      send_notification_to_role: {
        Args: {
          p_client_id: string
          p_message_ar: string
          p_message_en: string
          p_role: string
          p_team_leader?: string
          p_title_ar: string
          p_title_en: string
        }
        Returns: number
      }
      send_notification_to_user: {
        Args: {
          p_client_id: string
          p_message_ar: string
          p_message_en: string
          p_team_leader?: string
          p_title_ar: string
          p_title_en: string
          p_user_id: string
        }
        Returns: undefined
      }
      set_riyadh_time: { Args: never; Returns: string }
      submit_complaint:
        | {
            Args: {
              p_description: string
              p_division_id: string
              p_market_id: string
              p_photos: string[]
              p_target_custom: Json
              p_target_ids: string[]
            }
            Returns: string
          }
        | {
            Args: {
              p_category?: string
              p_description: string
              p_division_id: string
              p_market_id: string
              p_photos: string[]
              p_target_custom: Json
              p_target_ids: string[]
            }
            Returns: string
          }
      unmark_notification_read: {
        Args: { _notification_id: string }
        Returns: undefined
      }
      update_system_config: {
        Args: { p_key: string; p_value: string }
        Returns: string
      }
      upsert_inventory_report_full: {
        Args: {
          p_batches?: Json
          p_category_id?: string
          p_client_id: string
          p_custom_reason?: string
          p_distance_from_checkin?: number
          p_division_id: string
          p_is_available: boolean
          p_is_forced_upload?: boolean
          p_market_id: string
          p_not_available_reason?: string
          p_photos?: string[]
          p_product_id: string
          p_upload_location_lat?: number
          p_upload_location_lng?: number
          p_user_id: string
          p_visit_id: string
        }
        Returns: string
      }
      user_is_super_admin: { Args: never; Returns: boolean }
      validate_saudi_phone: { Args: { p_phone: string }; Returns: boolean }
      verify_device_biometric: {
        Args: { p_device_id: string; p_device_name: string; p_platform: string }
        Returns: Json
      }
      week_of_month_ksa: { Args: { d: string }; Returns: number }
    }
    Enums: {
      account_status:
        | "pending"
        | "must_change_password"
        | "active"
        | "suspended"
        | "inactive"
      account_status_reason:
        | "non_payment"
        | "manual_block"
        | "client_expired"
        | "resigned"
        | "system_migration"
        | "other"
      complaint_action_enum:
        | "CREATED"
        | "COMMENTED"
        | "RESOLVED_BY_ASSIGNEE"
        | "APPROVED_BY_MANAGER"
        | "REJECTED_BY_MANAGER"
        | "MANUAL_ESCALATION"
        | "AUTO_ESCALATION"
      complaint_status_enum:
        | "pending"
        | "waiting_approval"
        | "escalated"
        | "breached"
        | "rejected"
        | "closed"
      feature_key_enum:
        | "visit.whcount"
        | "visit.damage"
        | "visit.sos"
        | "visit.planogram"
        | "visit.competitor_activity"
        | "security.gps"
        | "security.biometrics"
        | "users.auto_activation"
        | "ai.sos"
        | "visit.offroute_approval_required"
        | "client.enable_location_check"
        | "client.require_biometrics"
        | "client.activate_users"
        | "client.enable_ai_sos"
        | "LEADER_AUDIT_FORM"
      field_role:
        | "team_leader"
        | "mch"
        | "promoter"
        | "promoplus"
        | "pharmacy_user"
        | "none"
      mch_event_type_enum:
        | "arrival"
        | "availability"
        | "whcount"
        | "damage"
        | "sos"
        | "competitor"
        | "remarks"
        | "leader"
      notification_audience_type: "all" | "single_user" | "role" | "legacy"
      notification_status: "queued" | "completed" | "archived"
      offroute_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "expired"
      org_type: "tactic_internal" | "aggregator" | "client"
      organization_kind: "client" | "aggregator" | "tactic_internal"
      portal_role:
        | "super_admin"
        | "aggregator_admin"
        | "client_admin"
        | "reporter"
        | "none"
      visit_event_type_enum:
        | "created"
        | "status_changed"
        | "eod_snapshot"
        | "auto_no_show"
        | "offroute_requested"
        | "offroute_approved"
        | "offroute_rejected"
        | "notification_skipped"
        | "notification_sent"
      visit_offroute_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "auto_approved"
      visit_outcome_status_enum:
        | "completed"
        | "no_visit"
        | "false_visit"
        | "partial"
        | "cancelled"
      visit_status_enum:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_visit"
        | "false_visit"
      visit_type_enum: "MCH" | "promoter" | "promoplus"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: [
        "pending",
        "must_change_password",
        "active",
        "suspended",
        "inactive",
      ],
      account_status_reason: [
        "non_payment",
        "manual_block",
        "client_expired",
        "resigned",
        "system_migration",
        "other",
      ],
      complaint_action_enum: [
        "CREATED",
        "COMMENTED",
        "RESOLVED_BY_ASSIGNEE",
        "APPROVED_BY_MANAGER",
        "REJECTED_BY_MANAGER",
        "MANUAL_ESCALATION",
        "AUTO_ESCALATION",
      ],
      complaint_status_enum: [
        "pending",
        "waiting_approval",
        "escalated",
        "breached",
        "rejected",
        "closed",
      ],
      feature_key_enum: [
        "visit.whcount",
        "visit.damage",
        "visit.sos",
        "visit.planogram",
        "visit.competitor_activity",
        "security.gps",
        "security.biometrics",
        "users.auto_activation",
        "ai.sos",
        "visit.offroute_approval_required",
        "client.enable_location_check",
        "client.require_biometrics",
        "client.activate_users",
        "client.enable_ai_sos",
        "LEADER_AUDIT_FORM",
      ],
      field_role: [
        "team_leader",
        "mch",
        "promoter",
        "promoplus",
        "pharmacy_user",
        "none",
      ],
      mch_event_type_enum: [
        "arrival",
        "availability",
        "whcount",
        "damage",
        "sos",
        "competitor",
        "remarks",
        "leader",
      ],
      notification_audience_type: ["all", "single_user", "role", "legacy"],
      notification_status: ["queued", "completed", "archived"],
      offroute_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "expired",
      ],
      org_type: ["tactic_internal", "aggregator", "client"],
      organization_kind: ["client", "aggregator", "tactic_internal"],
      portal_role: [
        "super_admin",
        "aggregator_admin",
        "client_admin",
        "reporter",
        "none",
      ],
      visit_event_type_enum: [
        "created",
        "status_changed",
        "eod_snapshot",
        "auto_no_show",
        "offroute_requested",
        "offroute_approved",
        "offroute_rejected",
        "notification_skipped",
        "notification_sent",
      ],
      visit_offroute_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "auto_approved",
      ],
      visit_outcome_status_enum: [
        "completed",
        "no_visit",
        "false_visit",
        "partial",
        "cancelled",
      ],
      visit_status_enum: [
        "planned",
        "in_progress",
        "completed",
        "cancelled",
        "no_visit",
        "false_visit",
      ],
      visit_type_enum: ["MCH", "promoter", "promoplus"],
    },
  },
} as const
