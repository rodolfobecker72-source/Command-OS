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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          assigned_to: string
          created_at: string
          description: string
          hero_asset_number: string
          id: string
          name: string
          photo: string
          reference_link: string
          serial_number: string
          updated_at: string
          value: number
          workspace_id: string
        }
        Insert: {
          assigned_to?: string
          created_at?: string
          description?: string
          hero_asset_number?: string
          id?: string
          name?: string
          photo?: string
          reference_link?: string
          serial_number?: string
          updated_at?: string
          value?: number
          workspace_id: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          description?: string
          hero_asset_number?: string
          id?: string
          name?: string
          photo?: string
          reference_link?: string
          serial_number?: string
          updated_at?: string
          value?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_versions: {
        Row: {
          budget_id: string
          costs: Json
          created_at: string
          discount4_price: number
          discount5_price: number
          fixed_cost_percentage: number
          full_price: number
          id: string
          is_rejected: boolean
          margin: number
          nf_cost_percentage: number
          operational_costs: Json
          production_cost: number
          reason: string
          rejection_reason: string | null
          services: Json
          total_cost: number
          version: number
          workspace_id: string
        }
        Insert: {
          budget_id: string
          costs?: Json
          created_at?: string
          discount4_price?: number
          discount5_price?: number
          fixed_cost_percentage?: number
          full_price?: number
          id?: string
          is_rejected?: boolean
          margin?: number
          nf_cost_percentage?: number
          operational_costs?: Json
          production_cost?: number
          reason?: string
          rejection_reason?: string | null
          services?: Json
          total_cost?: number
          version?: number
          workspace_id: string
        }
        Update: {
          budget_id?: string
          costs?: Json
          created_at?: string
          discount4_price?: number
          discount5_price?: number
          fixed_cost_percentage?: number
          full_price?: number
          id?: string
          is_rejected?: boolean
          margin?: number
          nf_cost_percentage?: number
          operational_costs?: Json
          production_cost?: number
          reason?: string
          rejection_reason?: string | null
          services?: Json
          total_cost?: number
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_versions_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approval_date: string | null
          approved_version: number | null
          client_id: string
          contract_url: string | null
          created_at: string
          current_version: number
          description: string
          drive_url: string | null
          execution: Json | null
          execution_end_date: string | null
          execution_month: string | null
          execution_start_date: string | null
          final_value: number | null
          has_execution_date: boolean
          id: string
          includes_accommodation: boolean
          includes_logistics: boolean
          includes_meals: boolean
          includes_raw_material: boolean
          includes_tax: boolean
          includes_technical_visit: boolean
          location: string
          nf_url: string | null
          objective: string
          payment_terms: string
          project_description: string
          project_name: string
          proposal_id: string
          service_type: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approval_date?: string | null
          approved_version?: number | null
          client_id: string
          contract_url?: string | null
          created_at?: string
          current_version?: number
          description?: string
          drive_url?: string | null
          execution?: Json | null
          execution_end_date?: string | null
          execution_month?: string | null
          execution_start_date?: string | null
          final_value?: number | null
          has_execution_date?: boolean
          id?: string
          includes_accommodation?: boolean
          includes_logistics?: boolean
          includes_meals?: boolean
          includes_raw_material?: boolean
          includes_tax?: boolean
          includes_technical_visit?: boolean
          location?: string
          nf_url?: string | null
          objective?: string
          payment_terms?: string
          project_description?: string
          project_name?: string
          proposal_id?: string
          service_type?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approval_date?: string | null
          approved_version?: number | null
          client_id?: string
          contract_url?: string | null
          created_at?: string
          current_version?: number
          description?: string
          drive_url?: string | null
          execution?: Json | null
          execution_end_date?: string | null
          execution_month?: string | null
          execution_start_date?: string | null
          final_value?: number | null
          has_execution_date?: boolean
          id?: string
          includes_accommodation?: boolean
          includes_logistics?: boolean
          includes_meals?: boolean
          includes_raw_material?: boolean
          includes_tax?: boolean
          includes_technical_visit?: boolean
          location?: string
          nf_url?: string | null
          objective?: string
          payment_terms?: string
          project_description?: string
          project_name?: string
          proposal_id?: string
          service_type?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cnpj: string
          company_name: string
          created_at: string
          email: string
          id: string
          lead_origin: string
          phone: string
          responsible_person: string
          score: number
          sector: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cnpj?: string
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          lead_origin?: string
          phone?: string
          responsible_person?: string
          score?: number
          sector?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cnpj?: string
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          lead_origin?: string
          phone?: string
          responsible_person?: string
          score?: number
          sector?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hard_drives: {
        Row: {
          capacity_gb: number
          created_at: string
          id: string
          label: string
          projects: Json
          workspace_id: string
        }
        Insert: {
          capacity_gb?: number
          created_at?: string
          id?: string
          label?: string
          projects?: Json
          workspace_id: string
        }
        Update: {
          capacity_gb?: number
          created_at?: string
          id?: string
          label?: string
          projects?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hard_drives_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_columns: {
        Row: {
          color: string
          id: string
          is_default: boolean
          key: string
          label: string
          order: number
          workspace_id: string
        }
        Insert: {
          color?: string
          id?: string
          is_default?: boolean
          key?: string
          label?: string
          order?: number
          workspace_id: string
        }
        Update: {
          color?: string
          id?: string
          is_default?: boolean
          key?: string
          label?: string
          order?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_columns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_leads: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          instagram: string
          name: string
          whatsapp: string
        }
        Insert: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          instagram?: string
          name?: string
          whatsapp?: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          instagram?: string
          name?: string
          whatsapp?: string
        }
        Relationships: []
      }
      legacy_projects: {
        Row: {
          client_id: string
          client_name: string
          created_at: string
          id: string
          project_number: string
          size_gb: number
          workspace_id: string
        }
        Insert: {
          client_id?: string
          client_name?: string
          created_at?: string
          id?: string
          project_number?: string
          size_gb?: number
          workspace_id: string
        }
        Update: {
          client_id?: string
          client_name?: string
          created_at?: string
          id?: string
          project_number?: string
          size_gb?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          created_at: string
          id: string
          month: string
          updated_at: string
          value: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month?: string
          updated_at?: string
          value?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          updated_at?: string
          value?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_terms: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_terms_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          id: string
          name?: string
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      project_cards: {
        Row: {
          budget_id: string
          client_id: string
          client_name: string
          comments: Json
          created_at: string
          end_date: string | null
          id: string
          links: Json
          material_link: string
          notes: string
          objective: string
          progress: number
          project_name: string
          proposal_id: string
          service_types: Json
          start_date: string | null
          status: string
          tasks: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          budget_id: string
          client_id?: string
          client_name?: string
          comments?: Json
          created_at?: string
          end_date?: string | null
          id?: string
          links?: Json
          material_link?: string
          notes?: string
          objective?: string
          progress?: number
          project_name?: string
          proposal_id?: string
          service_types?: Json
          start_date?: string | null
          status?: string
          tasks?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          budget_id?: string
          client_id?: string
          client_name?: string
          comments?: Json
          created_at?: string
          end_date?: string | null
          id?: string
          links?: Json
          material_link?: string
          notes?: string
          objective?: string
          progress?: number
          project_name?: string
          proposal_id?: string
          service_types?: Json
          start_date?: string | null
          status?: string
          tasks?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_cards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_columns: {
        Row: {
          color: string
          id: string
          is_default: boolean
          key: string
          label: string
          order: number
          workspace_id: string
        }
        Insert: {
          color?: string
          id?: string
          is_default?: boolean
          key?: string
          label?: string
          order?: number
          workspace_id: string
        }
        Update: {
          color?: string
          id?: string
          is_default?: boolean
          key?: string
          label?: string
          order?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_columns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      prospection_leads: {
        Row: {
          acquisition_type: string
          city: string
          closing_responsible: string
          company_name: string
          contact_name: string
          contact_role: string
          created_at: string
          email: string
          estimated_potential: number
          funnel_status: string
          id: string
          last_contact_date: string
          next_action: string
          next_action_date: string
          origin: string
          phone: string
          priority: string
          prospection_responsible: string
          segment: string
          strategic_notes: string
          temperature: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          acquisition_type?: string
          city?: string
          closing_responsible?: string
          company_name?: string
          contact_name?: string
          contact_role?: string
          created_at?: string
          email?: string
          estimated_potential?: number
          funnel_status?: string
          id?: string
          last_contact_date?: string
          next_action?: string
          next_action_date?: string
          origin?: string
          phone?: string
          priority?: string
          prospection_responsible?: string
          segment?: string
          strategic_notes?: string
          temperature?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          acquisition_type?: string
          city?: string
          closing_responsible?: string
          company_name?: string
          contact_name?: string
          contact_role?: string
          created_at?: string
          email?: string
          estimated_potential?: number
          funnel_status?: string
          id?: string
          last_contact_date?: string
          next_action?: string
          next_action_date?: string
          origin?: string
          phone?: string
          priority?: string
          prospection_responsible?: string
          segment?: string
          strategic_notes?: string
          temperature?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospection_leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      score_history: {
        Row: {
          client_id: string
          created_at: string
          id: string
          previous_score: number
          reason: string
          score: number
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          previous_score?: number
          reason?: string
          score?: number
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          previous_score?: number
          reason?: string
          score?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          id: string
          is_default: boolean
          key: string
          label: string
          order: number
          workspace_id: string
        }
        Insert: {
          id?: string
          is_default?: boolean
          key?: string
          label?: string
          order?: number
          workspace_id: string
        }
        Update: {
          id?: string
          is_default?: boolean
          key?: string
          label?: string
          order?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      service_items: {
        Row: {
          category_key: string
          created_at: string
          default_price: number
          description: string
          id: string
          name: string
          unit: string
          workspace_id: string
        }
        Insert: {
          category_key?: string
          created_at?: string
          default_price?: number
          description?: string
          id?: string
          name?: string
          unit?: string
          workspace_id: string
        }
        Update: {
          category_key?: string
          created_at?: string
          default_price?: number
          description?: string
          id?: string
          name?: string
          unit?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      service_objectives: {
        Row: {
          category_key: string
          id: string
          key: string
          label: string
          order: number
          workspace_id: string
        }
        Insert: {
          category_key?: string
          id?: string
          key?: string
          label?: string
          order?: number
          workspace_id: string
        }
        Update: {
          category_key?: string
          id?: string
          key?: string
          label?: string
          order?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_objectives_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          page_permissions: string[]
          role: Database["public"]["Enums"]["app_role"]
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          page_permissions?: string[]
          role?: Database["public"]["Enums"]["app_role"]
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          page_permissions?: string[]
          role?: Database["public"]["Enums"]["app_role"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_layout: {
        Row: {
          company_name: string
          created_at: string
          email: string
          id: string
          logo_url: string
          updated_at: string
          website: string
          workspace_id: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string
          updated_at?: string
          website?: string
          workspace_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string
          updated_at?: string
          website?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_layout_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          joined_at: string
          page_permissions: string[]
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          page_permissions?: string[]
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          page_permissions?: string[]
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          created_at: string
          default_fixed_cost_percentage: number
          default_nf_percentage: number
          default_target_margin_percentage: number
          id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          default_fixed_cost_percentage?: number
          default_nf_percentage?: number
          default_target_margin_percentage?: number
          id?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          default_fixed_cost_percentage?: number
          default_nf_percentage?: number
          default_target_margin_percentage?: number
          id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { invite_id: string }; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_workspace: { Args: { _user_id: string }; Returns: string }
      handle_signup_workspace: {
        Args: { workspace_name: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_access: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "vendedor" | "visualizador"
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
      app_role: ["owner", "admin", "vendedor", "visualizador"],
    },
  },
} as const
