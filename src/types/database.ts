/**
 * Generated types for Supabase database.
 * Run `supabase gen types typescript` to regenerate.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          plan: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plan?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          role: "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          email: string;
          role?: "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          email?: string;
          role?: "admin" | "member";
          created_at?: string;
        };
      };
      google_connections: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          status: "active" | "revoked" | "error";
          scopes: string[];
          encrypted_refresh_token: string;
          encrypted_dek: string;
          gmail_history_id: string | null;
          calendar_sync_token: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          status?: "active" | "revoked" | "error";
          scopes: string[];
          encrypted_refresh_token: string;
          encrypted_dek: string;
          gmail_history_id?: string | null;
          calendar_sync_token?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          status?: "active" | "revoked" | "error";
          scopes?: string[];
          encrypted_refresh_token?: string;
          encrypted_dek?: string;
          gmail_history_id?: string | null;
          calendar_sync_token?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          tenant_id: string;
          connection_id: string;
          source: "gmail" | "calendar";
          external_id: string;
          external_url: string | null;
          title: string | null;
          author: string | null;
          participants: Json | null;
          timestamp: string | null;
          dlp_status: "pending" | "allowed" | "redacted" | "quarantined";
          dlp_summary: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          connection_id: string;
          source: "gmail" | "calendar";
          external_id: string;
          external_url?: string | null;
          title?: string | null;
          author?: string | null;
          participants?: Json | null;
          timestamp?: string | null;
          dlp_status?: "pending" | "allowed" | "redacted" | "quarantined";
          dlp_summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          connection_id?: string;
          source?: "gmail" | "calendar";
          external_id?: string;
          external_url?: string | null;
          title?: string | null;
          author?: string | null;
          participants?: Json | null;
          timestamp?: string | null;
          dlp_status?: "pending" | "allowed" | "redacted" | "quarantined";
          dlp_summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          tenant_id: string;
          document_id: string;
          chunk_index: number;
          chunk_text: string;
          embedding: number[];
          chunk_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          document_id: string;
          chunk_index: number;
          chunk_text: string;
          embedding: number[];
          chunk_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          document_id?: string;
          chunk_index?: number;
          chunk_text?: string;
          embedding?: number[];
          chunk_hash?: string;
          created_at?: string;
        };
      };
      audit_events: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          action: string;
          object_type: string | null;
          object_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          action: string;
          object_type?: string | null;
          object_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string | null;
          action?: string;
          object_type?: string | null;
          object_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          filter_tenant_id: string;
        };
        Returns: Array<{
          id: string;
          document_id: string;
          chunk_text: string;
          similarity: number;
        }>;
      };
    };
    Enums: Record<string, never>;
  };
};
