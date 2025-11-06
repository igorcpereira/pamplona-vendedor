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
      clientes: {
        Row: {
          created_at: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: []
      }
      descricao_cliente: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: number
          pedido_id: string | null
          responsavel: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: number
          pedido_id?: string | null
          responsavel?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: number
          pedido_id?: string | null
          responsavel?: string | null
        }
        Relationships: []
      }
      fichas: {
        Row: {
          calca: string | null
          camisa: string | null
          cliente_id: string | null
          codigo_ficha: string | null
          created_at: string
          data_devolucao: string | null
          data_festa: string | null
          data_retirada: string | null
          descricao_cliente: string | null
          enviada_whatsapp: boolean
          garantia: number | null
          id: string
          nome_cliente: string | null
          pago: boolean
          paleto: string | null
          sapato: string | null
          status: Database["public"]["Enums"]["status_ficha"]
          tags: Json | null
          telefone_cliente: string | null
          tipo: string | null
          transcricao_audio: string | null
          updated_at: string
          url_audio: string | null
          url_bucket: string | null
          valor: number | null
          vendedor_id: string | null
          vendedor_responsavel: string | null
        }
        Insert: {
          calca?: string | null
          camisa?: string | null
          cliente_id?: string | null
          codigo_ficha?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_festa?: string | null
          data_retirada?: string | null
          descricao_cliente?: string | null
          enviada_whatsapp?: boolean
          garantia?: number | null
          id?: string
          nome_cliente?: string | null
          pago?: boolean
          paleto?: string | null
          sapato?: string | null
          status?: Database["public"]["Enums"]["status_ficha"]
          tags?: Json | null
          telefone_cliente?: string | null
          tipo?: string | null
          transcricao_audio?: string | null
          updated_at?: string
          url_audio?: string | null
          url_bucket?: string | null
          valor?: number | null
          vendedor_id?: string | null
          vendedor_responsavel?: string | null
        }
        Update: {
          calca?: string | null
          camisa?: string | null
          cliente_id?: string | null
          codigo_ficha?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_festa?: string | null
          data_retirada?: string | null
          descricao_cliente?: string | null
          enviada_whatsapp?: boolean
          garantia?: number | null
          id?: string
          nome_cliente?: string | null
          pago?: boolean
          paleto?: string | null
          sapato?: string | null
          status?: Database["public"]["Enums"]["status_ficha"]
          tags?: Json | null
          telefone_cliente?: string | null
          tipo?: string | null
          transcricao_audio?: string | null
          updated_at?: string
          url_audio?: string | null
          url_bucket?: string | null
          valor?: number | null
          vendedor_id?: string | null
          vendedor_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_pre_kadin: {
        Row: {
          created_at: string
          id: number
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          url?: string | null
        }
        Relationships: []
      }
      fichas_temporarias: {
        Row: {
          calca: string | null
          camisa: string | null
          cliente_id: string | null
          codigo_ficha: string | null
          created_at: string
          data_devolucao: string | null
          data_festa: string | null
          data_retirada: string | null
          garantia: number | null
          id: string
          nome_cliente: string | null
          pago: boolean
          paleto: string | null
          sapato: string | null
          status: string | null
          telefone_cliente: string | null
          tipo: string | null
          updated_at: string
          url_bucket: string | null
          valor: number | null
          vendedor_responsavel: string | null
        }
        Insert: {
          calca?: string | null
          camisa?: string | null
          cliente_id?: string | null
          codigo_ficha?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_festa?: string | null
          data_retirada?: string | null
          garantia?: number | null
          id?: string
          nome_cliente?: string | null
          pago: boolean
          paleto?: string | null
          sapato?: string | null
          status?: string | null
          telefone_cliente?: string | null
          tipo?: string | null
          updated_at?: string
          url_bucket?: string | null
          valor?: number | null
          vendedor_responsavel?: string | null
        }
        Update: {
          calca?: string | null
          camisa?: string | null
          cliente_id?: string | null
          codigo_ficha?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_festa?: string | null
          data_retirada?: string | null
          garantia?: number | null
          id?: string
          nome_cliente?: string | null
          pago?: boolean
          paleto?: string | null
          sapato?: string | null
          status?: string | null
          telefone_cliente?: string | null
          tipo?: string | null
          updated_at?: string
          url_bucket?: string | null
          valor?: number | null
          vendedor_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_temporarias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nome: string | null
          role: Database["public"]["Enums"]["user_role"]
          unidade_id: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          unidade_id: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          unidade_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      relacao_cliente_tag: {
        Row: {
          created_at: string
          id: number
          id_cliente: string | null
          id_tag: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          id_cliente?: string | null
          id_tag?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          id_cliente?: string | null
          id_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relacao_cliente_tag_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relacao_cliente_tag_id_tag_fkey"
            columns: ["id_tag"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      unidades: {
        Row: {
          created_at: string
          id: number
          nome: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          nome?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          nome?: string | null
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
      usuarios: {
        Row: {
          created_at: string
          funcao: string | null
          id: number
          nome: string | null
          unidade: string | null
        }
        Insert: {
          created_at?: string
          funcao?: string | null
          id?: number
          nome?: string | null
          unidade?: string | null
        }
        Update: {
          created_at?: string
          funcao?: string | null
          id?: number
          nome?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string
          id: number
          nome: string | null
          plataforma: string | null
          webhook: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          nome?: string | null
          plataforma?: string | null
          webhook?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          nome?: string | null
          plataforma?: string | null
          webhook?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_unidade: {
        Args: { _target_unidade_id: number; _user_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_unidade: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "gestor" | "franqueado" | "vendedor"
      status_ficha: "erro" | "pendente" | "ativa" | "baixa"
      tipo_de_atendimento: "Aluguel" | "Venda" | "Ajuste"
      user_role: "Gestor" | "Franqueado" | "Vendedor"
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
      app_role: ["gestor", "franqueado", "vendedor"],
      status_ficha: ["erro", "pendente", "ativa", "baixa"],
      tipo_de_atendimento: ["Aluguel", "Venda", "Ajuste"],
      user_role: ["Gestor", "Franqueado", "Vendedor"],
    },
  },
} as const
