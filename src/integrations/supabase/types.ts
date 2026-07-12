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
      meta_ai_actions: {
        Row: {
          action_params: Json
          action_type: string
          ad_account_id: string | null
          campaign_id: string
          campaign_name: string
          created_at: string
          description: string
          executed_at: string | null
          execution_result: string | null
          feedback_comment: string | null
          feedback_rating: number | null
          id: string
          rejection_reason: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          action_params?: Json
          action_type?: string
          ad_account_id?: string | null
          campaign_id: string
          campaign_name: string
          created_at?: string
          description: string
          executed_at?: string | null
          execution_result?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          rejection_reason?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          action_params?: Json
          action_type?: string
          ad_account_id?: string | null
          campaign_id?: string
          campaign_name?: string
          created_at?: string
          description?: string
          executed_at?: string | null
          execution_result?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          rejection_reason?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      meta_profiles: {
        Row: {
          created_at: string
          followers_count: number | null
          follows_count: number | null
          id: string
          ig_business_id: string
          ig_name: string | null
          ig_username: string
          is_active: boolean
          last_synced_at: string | null
          media_count: number | null
          page_id: string
          page_name: string
          profile_picture_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          followers_count?: number | null
          follows_count?: number | null
          id?: string
          ig_business_id: string
          ig_name?: string | null
          ig_username: string
          is_active?: boolean
          last_synced_at?: string | null
          media_count?: number | null
          page_id: string
          page_name: string
          profile_picture_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          followers_count?: number | null
          follows_count?: number | null
          id?: string
          ig_business_id?: string
          ig_name?: string | null
          ig_username?: string
          is_active?: boolean
          last_synced_at?: string | null
          media_count?: number | null
          page_id?: string
          page_name?: string
          profile_picture_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          caption: string
          created_at: string
          error: string | null
          fb_post_id: string | null
          id: string
          ig_media_id: string | null
          image_url: string
          platforms: string[]
          profile_id: string
          published_at: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          caption: string
          created_at?: string
          error?: string | null
          fb_post_id?: string | null
          id?: string
          ig_media_id?: string | null
          image_url: string
          platforms?: string[]
          profile_id: string
          published_at?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          error?: string | null
          fb_post_id?: string | null
          id?: string
          ig_media_id?: string | null
          image_url?: string
          platforms?: string[]
          profile_id?: string
          published_at?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "meta_profiles"
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
