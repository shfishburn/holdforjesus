export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      ai_incident_summary: {
        Row: {
          created_at: string;
          id: string;
          ingest_run_id: string | null;
          last_fetched_at: string;
          recent_12m_count: number;
          top_categories: Json;
          total_incidents: number;
          trend: string;
          vulnerable_incidents: number;
          vulnerable_percent: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          ingest_run_id?: string | null;
          last_fetched_at?: string;
          recent_12m_count?: number;
          top_categories?: Json;
          total_incidents?: number;
          trend?: string;
          vulnerable_incidents?: number;
          vulnerable_percent?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          ingest_run_id?: string | null;
          last_fetched_at?: string;
          recent_12m_count?: number;
          top_categories?: Json;
          total_incidents?: number;
          trend?: string;
          vulnerable_incidents?: number;
          vulnerable_percent?: number;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          category: string | null;
          created_at: string;
          department: string | null;
          event_type: string;
          faith: string | null;
          id: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          department?: string | null;
          event_type: string;
          faith?: string | null;
          id?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          department?: string | null;
          event_type?: string;
          faith?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      canonical_entities: {
        Row: {
          actor_primary: string | null;
          actor_secondary: string | null;
          admin1: string | null;
          admin2: string | null;
          admissibility_reasons: string[];
          admissibility_status: Database["public"]["Enums"]["admissibility_status"];
          affected_persons: number | null;
          affected_population: string | null;
          canonical_id: string;
          country_code: string | null;
          created_at: string;
          displaced_persons: number | null;
          domain: Database["public"]["Enums"]["pipeline_domain"];
          end_at: string | null;
          entity_kind: Database["public"]["Enums"]["entity_kind"];
          event_subtype: string | null;
          event_type: string | null;
          fatalities: number | null;
          hazard_type: string | null;
          indicator_code: string | null;
          indicator_name: string | null;
          injuries: number | null;
          language: string | null;
          lat: number | null;
          lineage: Json;
          location_precision_val: Database["public"]["Enums"]["location_precision"] | null;
          lon: number | null;
          magnitude: number | null;
          observed_at: string | null;
          place_name: string | null;
          population_type: string | null;
          quality: Json;
          source_record_id: string | null;
          source_system: string;
          start_at: string | null;
          subdomain: string | null;
          summary: string | null;
          time_basis: Database["public"]["Enums"]["time_basis"];
          time_precision_val: Database["public"]["Enums"]["time_precision"] | null;
          title: string | null;
          unit: string | null;
          value: number | null;
        };
        Insert: {
          actor_primary?: string | null;
          actor_secondary?: string | null;
          admin1?: string | null;
          admin2?: string | null;
          admissibility_reasons?: string[];
          admissibility_status?: Database["public"]["Enums"]["admissibility_status"];
          affected_persons?: number | null;
          affected_population?: string | null;
          canonical_id?: string;
          country_code?: string | null;
          created_at?: string;
          displaced_persons?: number | null;
          domain?: Database["public"]["Enums"]["pipeline_domain"];
          end_at?: string | null;
          entity_kind: Database["public"]["Enums"]["entity_kind"];
          event_subtype?: string | null;
          event_type?: string | null;
          fatalities?: number | null;
          hazard_type?: string | null;
          indicator_code?: string | null;
          indicator_name?: string | null;
          injuries?: number | null;
          language?: string | null;
          lat?: number | null;
          lineage?: Json;
          location_precision_val?: Database["public"]["Enums"]["location_precision"] | null;
          lon?: number | null;
          magnitude?: number | null;
          observed_at?: string | null;
          place_name?: string | null;
          population_type?: string | null;
          quality?: Json;
          source_record_id?: string | null;
          source_system: string;
          start_at?: string | null;
          subdomain?: string | null;
          summary?: string | null;
          time_basis?: Database["public"]["Enums"]["time_basis"];
          time_precision_val?: Database["public"]["Enums"]["time_precision"] | null;
          title?: string | null;
          unit?: string | null;
          value?: number | null;
        };
        Update: {
          actor_primary?: string | null;
          actor_secondary?: string | null;
          admin1?: string | null;
          admin2?: string | null;
          admissibility_reasons?: string[];
          admissibility_status?: Database["public"]["Enums"]["admissibility_status"];
          affected_persons?: number | null;
          affected_population?: string | null;
          canonical_id?: string;
          country_code?: string | null;
          created_at?: string;
          displaced_persons?: number | null;
          domain?: Database["public"]["Enums"]["pipeline_domain"];
          end_at?: string | null;
          entity_kind?: Database["public"]["Enums"]["entity_kind"];
          event_subtype?: string | null;
          event_type?: string | null;
          fatalities?: number | null;
          hazard_type?: string | null;
          indicator_code?: string | null;
          indicator_name?: string | null;
          injuries?: number | null;
          language?: string | null;
          lat?: number | null;
          lineage?: Json;
          location_precision_val?: Database["public"]["Enums"]["location_precision"] | null;
          lon?: number | null;
          magnitude?: number | null;
          observed_at?: string | null;
          place_name?: string | null;
          population_type?: string | null;
          quality?: Json;
          source_record_id?: string | null;
          source_system?: string;
          start_at?: string | null;
          subdomain?: string | null;
          summary?: string | null;
          time_basis?: Database["public"]["Enums"]["time_basis"];
          time_precision_val?: Database["public"]["Enums"]["time_precision"] | null;
          title?: string | null;
          unit?: string | null;
          value?: number | null;
        };
        Relationships: [];
      };
      canonical_raw_links: {
        Row: {
          canonical_id: string;
          link_role: string;
          raw_id: string;
        };
        Insert: {
          canonical_id: string;
          link_role?: string;
          raw_id: string;
        };
        Update: {
          canonical_id?: string;
          link_role?: string;
          raw_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "canonical_raw_links_canonical_id_fkey";
            columns: ["canonical_id"];
            isOneToOne: false;
            referencedRelation: "canonical_entities";
            referencedColumns: ["canonical_id"];
          },
          {
            foreignKeyName: "canonical_raw_links_raw_id_fkey";
            columns: ["raw_id"];
            isOneToOne: false;
            referencedRelation: "raw_records";
            referencedColumns: ["raw_id"];
          },
        ];
      };
      cluster_members: {
        Row: {
          added_at: string;
          canonical_id: string;
          cluster_id: string;
          membership_confidence: number;
        };
        Insert: {
          added_at?: string;
          canonical_id: string;
          cluster_id: string;
          membership_confidence?: number;
        };
        Update: {
          added_at?: string;
          canonical_id?: string;
          cluster_id?: string;
          membership_confidence?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cluster_members_canonical_id_fkey";
            columns: ["canonical_id"];
            isOneToOne: false;
            referencedRelation: "canonical_entities";
            referencedColumns: ["canonical_id"];
          },
          {
            foreignKeyName: "cluster_members_cluster_id_fkey";
            columns: ["cluster_id"];
            isOneToOne: false;
            referencedRelation: "incident_clusters";
            referencedColumns: ["cluster_id"];
          },
        ];
      };
      derived_scores: {
        Row: {
          canonical_id: string;
          computed_at: string;
          inputs: Json;
          score_id: string;
          scores: Json;
          scoring_model: string;
        };
        Insert: {
          canonical_id: string;
          computed_at?: string;
          inputs?: Json;
          score_id?: string;
          scores?: Json;
          scoring_model: string;
        };
        Update: {
          canonical_id?: string;
          computed_at?: string;
          inputs?: Json;
          score_id?: string;
          scores?: Json;
          scoring_model?: string;
        };
        Relationships: [
          {
            foreignKeyName: "derived_scores_canonical_id_fkey";
            columns: ["canonical_id"];
            isOneToOne: false;
            referencedRelation: "canonical_entities";
            referencedColumns: ["canonical_id"];
          },
        ];
      };
      global_prayer_board: {
        Row: {
          active: boolean;
          created_at: string;
          department: string;
          emoji: string;
          id: string;
          issue: string;
          sort_order: number;
          status: string;
          voices: number;
          voices_today: number;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          department?: string;
          emoji?: string;
          id?: string;
          issue: string;
          sort_order?: number;
          status?: string;
          voices?: number;
          voices_today?: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          department?: string;
          emoji?: string;
          id?: string;
          issue?: string;
          sort_order?: number;
          status?: string;
          voices?: number;
          voices_today?: number;
        };
        Relationships: [];
      };
      global_prayer_voices: {
        Row: {
          created_at: string;
          id: string;
          issue_id: string;
          session_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          issue_id: string;
          session_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          issue_id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "global_prayer_voices_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "global_prayer_board";
            referencedColumns: ["id"];
          },
        ];
      };
      incident_clusters: {
        Row: {
          centroid_lat: number | null;
          centroid_lon: number | null;
          cluster_id: string;
          created_at: string;
          domain: Database["public"]["Enums"]["pipeline_domain"];
          end_at: string | null;
          label: string | null;
          start_at: string | null;
        };
        Insert: {
          centroid_lat?: number | null;
          centroid_lon?: number | null;
          cluster_id?: string;
          created_at?: string;
          domain?: Database["public"]["Enums"]["pipeline_domain"];
          end_at?: string | null;
          label?: string | null;
          start_at?: string | null;
        };
        Update: {
          centroid_lat?: number | null;
          centroid_lon?: number | null;
          cluster_id?: string;
          created_at?: string;
          domain?: Database["public"]["Enums"]["pipeline_domain"];
          end_at?: string | null;
          label?: string | null;
          start_at?: string | null;
        };
        Relationships: [];
      };
      normalization_registry: {
        Row: {
          baseline_max: number;
          baseline_min: number;
          created_at: string;
          direction: string;
          id: string;
          indicator_code: string;
          indicator_name: string | null;
          model_version: string;
          normalization_method: string;
          weight: number;
        };
        Insert: {
          baseline_max: number;
          baseline_min?: number;
          created_at?: string;
          direction?: string;
          id?: string;
          indicator_code: string;
          indicator_name?: string | null;
          model_version?: string;
          normalization_method?: string;
          weight?: number;
        };
        Update: {
          baseline_max?: number;
          baseline_min?: number;
          created_at?: string;
          direction?: string;
          id?: string;
          indicator_code?: string;
          indicator_name?: string | null;
          model_version?: string;
          normalization_method?: string;
          weight?: number;
        };
        Relationships: [];
      };
      prayer_wall: {
        Row: {
          approved: boolean;
          category: string | null;
          created_at: string;
          faith: string | null;
          id: string;
          prayer_text: string;
          reactions_candle: number;
          reactions_heart: number;
          reactions_leaf: number;
          reactions_pray: number;
        };
        Insert: {
          approved?: boolean;
          category?: string | null;
          created_at?: string;
          faith?: string | null;
          id?: string;
          prayer_text: string;
          reactions_candle?: number;
          reactions_heart?: number;
          reactions_leaf?: number;
          reactions_pray?: number;
        };
        Update: {
          approved?: boolean;
          category?: string | null;
          created_at?: string;
          faith?: string | null;
          id?: string;
          prayer_text?: string;
          reactions_candle?: number;
          reactions_heart?: number;
          reactions_leaf?: number;
          reactions_pray?: number;
        };
        Relationships: [];
      };
      prayer_wall_reactions: {
        Row: {
          created_at: string;
          id: string;
          prayer_id: string;
          reaction_type: string;
          session_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          prayer_id: string;
          reaction_type: string;
          session_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          prayer_id?: string;
          reaction_type?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prayer_wall_reactions_prayer_id_fkey";
            columns: ["prayer_id"];
            isOneToOne: false;
            referencedRelation: "prayer_wall";
            referencedColumns: ["id"];
          },
        ];
      };
      raw_records: {
        Row: {
          content_type: string | null;
          endpoint: string;
          http_status: number | null;
          ingest_run_id: string | null;
          license: string | null;
          published_at: string | null;
          raw_id: string;
          raw_payload: Json;
          raw_sha256: string;
          retrieved_at: string;
          source_record_id: string | null;
          source_system: string;
          source_version: string | null;
        };
        Insert: {
          content_type?: string | null;
          endpoint: string;
          http_status?: number | null;
          ingest_run_id?: string | null;
          license?: string | null;
          published_at?: string | null;
          raw_id?: string;
          raw_payload: Json;
          raw_sha256: string;
          retrieved_at?: string;
          source_record_id?: string | null;
          source_system: string;
          source_version?: string | null;
        };
        Update: {
          content_type?: string | null;
          endpoint?: string;
          http_status?: number | null;
          ingest_run_id?: string | null;
          license?: string | null;
          published_at?: string | null;
          raw_id?: string;
          raw_payload?: Json;
          raw_sha256?: string;
          retrieved_at?: string;
          source_record_id?: string | null;
          source_system?: string;
          source_version?: string | null;
        };
        Relationships: [];
      };
      safety_signals: {
        Row: {
          applied_guardrails: string[];
          category: string | null;
          consented: boolean;
          created_at: string;
          department: string | null;
          detected_signals: string[];
          faith: string | null;
          id: string;
          interaction_mode: string;
          queue_duration_ms: number | null;
          response_style: string | null;
        };
        Insert: {
          applied_guardrails?: string[];
          category?: string | null;
          consented?: boolean;
          created_at?: string;
          department?: string | null;
          detected_signals?: string[];
          faith?: string | null;
          id?: string;
          interaction_mode?: string;
          queue_duration_ms?: number | null;
          response_style?: string | null;
        };
        Update: {
          applied_guardrails?: string[];
          category?: string | null;
          consented?: boolean;
          created_at?: string;
          department?: string | null;
          detected_signals?: string[];
          faith?: string | null;
          id?: string;
          interaction_mode?: string;
          queue_duration_ms?: number | null;
          response_style?: string | null;
        };
        Relationships: [];
      };
      suffering_index: {
        Row: {
          components: Json;
          composite_score: number;
          computed_at: string;
          id: string;
        };
        Insert: {
          components?: Json;
          composite_score: number;
          computed_at?: string;
          id?: string;
        };
        Update: {
          components?: Json;
          composite_score?: number;
          computed_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      suffering_metrics: {
        Row: {
          country_code: string | null;
          fetched_at: string;
          id: string;
          indicator_code: string;
          indicator_name: string;
          normalized_value: number | null;
          source: string;
          unit: string | null;
          value: number | null;
          weight: number | null;
          year: number | null;
        };
        Insert: {
          country_code?: string | null;
          fetched_at?: string;
          id?: string;
          indicator_code: string;
          indicator_name: string;
          normalized_value?: number | null;
          source: string;
          unit?: string | null;
          value?: number | null;
          weight?: number | null;
          year?: number | null;
        };
        Update: {
          country_code?: string | null;
          fetched_at?: string;
          id?: string;
          indicator_code?: string;
          indicator_name?: string;
          normalized_value?: number | null;
          source?: string;
          unit?: string | null;
          value?: number | null;
          weight?: number | null;
          year?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_prayer_voice: {
        Args: { p_issue_id: string; p_session_id: string };
        Returns: boolean;
      };
      get_session_votes: { Args: { p_session_id: string }; Returns: string[] };
      increment_prayer_reaction: {
        Args: { p_prayer_id: string; p_reaction_type: string };
        Returns: undefined;
      };
    };
    Enums: {
      admissibility_status: "authoritative" | "signal_only" | "derived" | "needs_review";
      entity_kind:
        | "event"
        | "indicator_observation"
        | "population_observation"
        | "dataset_resource"
        | "ai_harm_observation";
      location_precision:
        | "exact"
        | "near_exact"
        | "admin1"
        | "admin2"
        | "country"
        | "global"
        | "unknown";
      pipeline_domain:
        | "conflict"
        | "disaster"
        | "health"
        | "displacement"
        | "food_security"
        | "humanitarian_catalog"
        | "slavery"
        | "development"
        | "other";
      time_basis: "observed" | "reported" | "published" | "estimated";
      time_precision: "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year" | "unknown";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      admissibility_status: ["authoritative", "signal_only", "derived", "needs_review"],
      entity_kind: [
        "event",
        "indicator_observation",
        "population_observation",
        "dataset_resource",
        "ai_harm_observation",
      ],
      location_precision: [
        "exact",
        "near_exact",
        "admin1",
        "admin2",
        "country",
        "global",
        "unknown",
      ],
      pipeline_domain: [
        "conflict",
        "disaster",
        "health",
        "displacement",
        "food_security",
        "humanitarian_catalog",
        "slavery",
        "development",
        "other",
      ],
      time_basis: ["observed", "reported", "published", "estimated"],
      time_precision: ["minute", "hour", "day", "week", "month", "quarter", "year", "unknown"],
    },
  },
} as const;
