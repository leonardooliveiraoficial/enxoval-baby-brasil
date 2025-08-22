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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_settings: {
        Row: {
          created_at: string
          goal_cents: number
          id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal_cents?: number
          id?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal_cents?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      guestbook_messages: {
        Row: {
          approved: boolean
          author_name: string
          created_at: string
          id: string
          message: string
        }
        Insert: {
          approved?: boolean
          author_name: string
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          approved?: boolean
          author_name?: string
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      mercadopago_settings: {
        Row: {
          access_token: string
          account_id: string | null
          created_at: string
          id: number
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          access_token: string
          account_id?: string | null
          created_at?: string
          id?: number
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string | null
          created_at?: string
          id?: number
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          infinitepay_payment_id: string | null
          payment_method: string
          purchaser_email: string
          purchaser_name: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          infinitepay_payment_id?: string | null
          payment_method: string
          purchaser_email: string
          purchaser_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          infinitepay_payment_id?: string | null
          payment_method?: string
          purchaser_email?: string
          purchaser_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_cents: number
          purchased_qty: number
          target_qty: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_cents: number
          purchased_qty?: number
          target_qty?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_cents?: number
          purchased_qty?: number
          target_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      story_content: {
        Row: {
          content: string
          couple_photo: string | null
          id: number
          updated_at: string
        }
        Insert: {
          content?: string
          couple_photo?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          content?: string
          couple_photo?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      thankyou_template: {
        Row: {
          body_markdown: string
          id: number
          subject: string
          updated_at: string
        }
        Insert: {
          body_markdown?: string
          id?: number
          subject?: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          id?: number
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_admin_stats: {
        Row: {
          completed_products: number | null
          failed_orders: number | null
          paid_orders: number | null
          pending_orders: number | null
          total_goal_cents: number | null
          total_products: number | null
          total_raised_cents: number | null
        }
        Relationships: []
      }
      v_daily_sales: {
        Row: {
          orders_count: number | null
          sale_date: string | null
          total_cents: number | null
        }
        Relationships: []
      }
      v_progress: {
        Row: {
          goal_cents: number | null
          raised_cents: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_mercadopago_config_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_mercadopago_config: {
        Args: { p_account_id?: string }
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
