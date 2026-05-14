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
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          category: string | null
          color: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_announcement_only: boolean | null
          is_exclusive: boolean | null
          is_public: boolean | null
          join_price: number | null
          member_count: number | null
          name: string
          pinned_text: string | null
          rules: string | null
          slow_mode_seconds: number | null
          subscription_price: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_announcement_only?: boolean | null
          is_exclusive?: boolean | null
          is_public?: boolean | null
          join_price?: number | null
          member_count?: number | null
          name: string
          pinned_text?: string | null
          rules?: string | null
          slow_mode_seconds?: number | null
          subscription_price?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_announcement_only?: boolean | null
          is_exclusive?: boolean | null
          is_public?: boolean | null
          join_price?: number | null
          member_count?: number | null
          name?: string
          pinned_text?: string | null
          rules?: string | null
          slow_mode_seconds?: number | null
          subscription_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string | null
          role: Database["public"]["Enums"]["community_role"] | null
          status: Database["public"]["Enums"]["membership_status"] | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          role?: Database["public"]["Enums"]["community_role"] | null
          status?: Database["public"]["Enums"]["membership_status"] | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          role?: Database["public"]["Enums"]["community_role"] | null
          status?: Database["public"]["Enums"]["membership_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          streamer_id: string | null
          title: string
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          streamer_id?: string | null
          title: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          streamer_id?: string | null
          title?: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          community_id: string | null
          content: string
          created_at: string | null
          group_id: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          post_id: string | null
          recipient_id: string | null
          sender_id: string
          sticker_url: string | null
        }
        Insert: {
          community_id?: string | null
          content: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          post_id?: string | null
          recipient_id?: string | null
          sender_id: string
          sticker_url?: string | null
        }
        Update: {
          community_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          post_id?: string | null
          recipient_id?: string | null
          sender_id?: string
          sticker_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          target_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          target_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          target_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_confidence_score: number | null
          ai_safety_score: number | null
          author_id: string
          boost_coins: number | null
          comment_count: number | null
          community_id: string | null
          content: string | null
          created_at: string
          engagement_score: number | null
          id: string
          is_boosted: boolean | null
          is_exclusive: boolean | null
          is_flagged: boolean | null
          like_count: number | null
          media_urls: string[] | null
          mentions: string[] | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          music_artist: string | null
          music_start_time: number | null
          music_title: string | null
          music_url: string | null
          music_volume: number | null
          overlays: Json | null
          tags: string[] | null
          updated_at: string
          video_trim_end: number | null
          video_trim_start: number | null
          video_volume: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_safety_score?: number | null
          author_id: string
          boost_coins?: number | null
          comment_count?: number | null
          community_id?: string | null
          content?: string | null
          created_at?: string
          engagement_score?: number | null
          id?: string
          is_boosted?: boolean | null
          is_exclusive?: boolean | null
          is_flagged?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          mentions?: string[] | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          music_artist?: string | null
          music_start_time?: number | null
          music_title?: string | null
          music_url?: string | null
          music_volume?: number | null
          overlays?: Json | null
          tags?: string[] | null
          updated_at?: string
          video_trim_end?: number | null
          video_trim_start?: number | null
          video_volume?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_safety_score?: number | null
          author_id?: string
          boost_coins?: number | null
          comment_count?: number | null
          community_id?: string | null
          content?: string | null
          created_at?: string
          engagement_score?: number | null
          id?: string
          is_boosted?: boolean | null
          is_exclusive?: boolean | null
          is_flagged?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          mentions?: string[] | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          music_artist?: string | null
          music_start_time?: number | null
          music_title?: string | null
          music_url?: string | null
          music_volume?: number | null
          overlays?: Json | null
          tags?: string[] | null
          updated_at?: string
          video_trim_end?: number | null
          video_trim_start?: number | null
          video_volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coins: number | null
          created_at: string
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          is_creator: boolean | null
          payout_account: string | null
          profile_subscription_price: number | null
          referral_code: string | null
          referred_by: string | null
          total_earnings: number | null
          updated_at: string
          username: string
          wallet_balance: number | null
          website: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number | null
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          is_creator?: boolean | null
          payout_account?: string | null
          profile_subscription_price?: number | null
          referral_code?: string | null
          referred_by?: string | null
          total_earnings?: number | null
          updated_at?: string
          username: string
          wallet_balance?: number | null
          website?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number | null
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          is_creator?: boolean | null
          payout_account?: string | null
          profile_subscription_price?: number | null
          referral_code?: string | null
          referred_by?: string | null
          total_earnings?: number | null
          updated_at?: string
          username?: string
          wallet_balance?: number | null
          website?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      razorpay_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          order_id: string
          status: string | null
          target_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id: string
          status?: string | null
          target_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id?: string
          status?: string | null
          target_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "razorpay_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          details: string | null
          id: string
          post_id: string | null
          reason: string | null
          reporter_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          details?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
          reporter_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          details?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
          reporter_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          media_type: string | null
          media_url: string
          mentions: string[] | null
          music_artist: string | null
          music_title: string | null
          music_url: string | null
          overlay_text: string | null
          text_color: string | null
          text_x: number | null
          text_y: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url: string
          mentions?: string[] | null
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          overlay_text?: string | null
          text_color?: string | null
          text_x?: number | null
          text_y?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string
          mentions?: string[] | null
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          overlay_text?: string | null
          text_color?: string | null
          text_x?: number | null
          text_y?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          community_id: string | null
          created_at: string
          creator_id: string
          expires_at: string
          id: string
          status: string | null
          subscriber_id: string
        }
        Insert: {
          amount: number
          community_id?: string | null
          created_at?: string
          creator_id: string
          expires_at: string
          id?: string
          status?: string | null
          subscriber_id: string
        }
        Update: {
          amount?: number
          community_id?: string | null
          created_at?: string
          creator_id?: string
          expires_at?: string
          id?: string
          status?: string | null
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          post_id: string | null
          recipient_id: string
          sender_id: string | null
          status: string | null
          transaction_type: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          post_id?: string | null
          recipient_id: string
          sender_id?: string | null
          status?: string | null
          transaction_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          post_id?: string | null
          recipient_id?: string
          sender_id?: string | null
          status?: string | null
          transaction_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_viewer_count: {
        Args: { stream_id: string }
        Returns: undefined
      }
      get_viral_feed: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          author_id: string
          content: string
          media_urls: string[]
          created_at: string
          like_count: number
          comment_count: number
          music_url: string
          music_title: string
          music_artist: string
          author_username: string
          author_full_name: string
          author_avatar_url: string
          author_followers_count: number
          author_is_creator: boolean
          is_exclusive: boolean
          moderation_status: string
          viral_score: number
          is_liked: boolean
          is_following: boolean
        }[]
      }
      get_trending_reels: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          content: string
          media_urls: string[]
          like_count: number
          comment_count: number
          is_boosted: boolean
          boost_coins: number
          music_url: string
          music_title: string
          music_artist: string
          music_start_time: number
          music_volume: number
          video_volume: number
          video_trim_start: number
          video_trim_end: number
          author_id: string
          author_username: string
          author_full_name: string
          author_avatar_url: string
          is_liked: boolean
          is_following: boolean
        }[]
      }
      increment_viewer_count: {
        Args: { stream_id: string }
        Returns: undefined
      }
      is_group_admin: { Args: { target_group_id: string }; Returns: boolean }
      is_member_of_group: {
        Args: { target_group_id: string }
        Returns: boolean
      }
    }
    Enums: {
      community_role: "owner" | "moderator" | "member"
      membership_status: "pending" | "joined" | "invited" | "rejected"
      moderation_status: "pending" | "approved" | "flagged" | "rejected"
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
      community_role: ["owner", "moderator", "member"],
      membership_status: ["pending", "joined", "invited", "rejected"],
      moderation_status: ["pending", "approved", "flagged", "rejected"],
    },
  },
} as const
