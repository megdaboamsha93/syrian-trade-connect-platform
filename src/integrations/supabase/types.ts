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
      business_products: {
        Row: {
          business_id: string
          category: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          minimum_order: string | null
          name_ar: string
          name_en: string
          price_range: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          category: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          minimum_order?: string | null
          name_ar: string
          name_en: string
          price_range?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          minimum_order?: string | null
          name_ar?: string
          name_en?: string
          price_range?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_views: {
        Row: {
          business_id: string
          id: string
          referrer: string | null
          user_agent: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          business_id: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          business_id?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_type: Database["public"]["Enums"]["business_type"]
          contact_email: string
          contact_phone: string | null
          cover_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          founded_year: number | null
          id: string
          industry: string
          is_example: boolean | null
          is_verified: boolean | null
          location: string
          logo_url: string | null
          name_ar: string
          name_en: string
          owner_id: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          business_type: Database["public"]["Enums"]["business_type"]
          contact_email: string
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          founded_year?: number | null
          id?: string
          industry: string
          is_example?: boolean | null
          is_verified?: boolean | null
          location: string
          logo_url?: string | null
          name_ar: string
          name_en: string
          owner_id: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          business_type?: Database["public"]["Enums"]["business_type"]
          contact_email?: string
          contact_phone?: string | null
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          founded_year?: number | null
          id?: string
          industry?: string
          is_example?: boolean | null
          is_verified?: boolean | null
          location?: string
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          owner_id?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          participant_1_blocked: boolean | null
          participant_1_id: string
          participant_1_muted: boolean | null
          participant_1_unread: number | null
          participant_2_blocked: boolean | null
          participant_2_id: string
          participant_2_muted: boolean | null
          participant_2_unread: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1_blocked?: boolean | null
          participant_1_id: string
          participant_1_muted?: boolean | null
          participant_1_unread?: number | null
          participant_2_blocked?: boolean | null
          participant_2_id: string
          participant_2_muted?: boolean | null
          participant_2_unread?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1_blocked?: boolean | null
          participant_1_id?: string
          participant_1_muted?: boolean | null
          participant_1_unread?: number | null
          participant_2_blocked?: boolean | null
          participant_2_id?: string
          participant_2_muted?: boolean | null
          participant_2_unread?: number | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          business_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_on_favorite: boolean | null
          email_on_inquiry: boolean | null
          email_on_message: boolean | null
          email_on_new_business: boolean | null
          email_on_new_product: boolean | null
          email_on_verification: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_on_favorite?: boolean | null
          email_on_inquiry?: boolean | null
          email_on_message?: boolean | null
          email_on_new_business?: boolean | null
          email_on_new_product?: boolean | null
          email_on_verification?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_on_favorite?: boolean | null
          email_on_inquiry?: boolean | null
          email_on_message?: boolean | null
          email_on_new_business?: boolean | null
          email_on_new_product?: boolean | null
          email_on_verification?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content_ar: string
          content_en: string
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title_ar: string
          title_en: string
          type: string
          user_id: string
        }
        Insert: {
          content_ar: string
          content_en: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title_ar: string
          title_en: string
          type: string
          user_id: string
        }
        Update: {
          content_ar?: string
          content_en?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title_ar?: string
          title_en?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      product_views: {
        Row: {
          business_id: string
          id: string
          product_id: string
          referrer: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          business_id: string
          id?: string
          product_id: string
          referrer?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          business_id?: string
          id?: string
          product_id?: string
          referrer?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          location: string | null
          phone: string | null
          preferred_language: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          location?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          source_lang: string
          source_text: string
          target_lang: string
          translated_text: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          source_lang: string
          source_text: string
          target_lang: string
          translated_text: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          source_lang?: string
          source_text?: string
          target_lang?: string
          translated_text?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          business_types: string[] | null
          categories: string[] | null
          created_at: string | null
          industries: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_types?: string[] | null
          categories?: string[] | null
          created_at?: string | null
          industries?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_types?: string[] | null
          categories?: string[] | null
          created_at?: string | null
          industries?: string[] | null
          updated_at?: string | null
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
      verification_documents: {
        Row: {
          business_id: string
          created_at: string
          document_name: string
          document_type: string
          document_url: string
          id: string
          uploaded_at: string
          verification_request_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          document_name: string
          document_type: string
          document_url: string
          id?: string
          uploaded_at?: string
          verification_request_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          document_name?: string
          document_type?: string
          document_url?: string
          id?: string
          uploaded_at?: string
          verification_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_verification_request_id_fkey"
            columns: ["verification_request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          business_id: string
          created_at: string
          id: string
          notes: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          _content_ar: string
          _content_en: string
          _link?: string
          _title_ar: string
          _title_en: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      delete_conversation_for_user: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: undefined
      }
      get_business_daily_views: {
        Args: { _business_id: string; _days?: number }
        Returns: {
          date: string
          view_count: number
        }[]
      }
      get_or_create_conversation: {
        Args: { _participant_1_id: string; _participant_2_id: string }
        Returns: string
      }
      get_product_engagement: {
        Args: { _business_id: string; _days?: number }
        Returns: {
          product_id: string
          product_name: string
          unique_viewers: number
          view_count: number
        }[]
      }
      get_unread_notification_count: {
        Args: { _user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_messages_read: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: undefined
      }
      mark_notifications_read: {
        Args: { _notification_ids: string[] }
        Returns: undefined
      }
      set_conversation_block: {
        Args: { _blocked: boolean; _conversation_id: string; _user_id: string }
        Returns: undefined
      }
      set_conversation_mute: {
        Args: { _conversation_id: string; _muted: boolean; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      business_type: "importer" | "exporter" | "both"
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
      business_type: ["importer", "exporter", "both"],
    },
  },
} as const
