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
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
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
          abotoaduras: string | null
          calca: string | null
          camisa: string | null
          cliente_id: string | null
          codigo_ficha: string | null
          colete: string | null
          created_at: string
          data_devolucao: string | null
          data_festa: string | null
          data_prova_1: string | null
          data_prova_2: string | null
          data_retirada: string | null
          descricao_cliente: string | null
          faixa: string | null
          garantia: number | null
          gravata: string | null
          id: string
          nome_cliente: string | null
          outros: string | null
          pago: boolean
          paleto: string | null
          sapato: string | null
          status: string | null
          tags: Json | null
          telefone_cliente: string | null
          tipo: string | null
          transcricao_audio: string | null
          updated_at: string
          url_audio: string | null
          url_bucket: string | null
          valor: number | null
          vendedor_responsavel: string | null
        }
        Insert: {
          abotoaduras?: string | null
          calca?: string | null
          camisa?: string | null
          cliente_id?: string | null
          codigo_ficha?: string | null
          colete?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_festa?: string | null
          data_prova_1?: string | null
          data_prova_2?: string | null
          data_retirada?: string | null
          descricao_cliente?: string | null
          faixa?: string | null
          garantia?: number | null
          gravata?: string | null
          id?: string
          nome_cliente?: string | null
          outros?: string | null
          pago?: boolean
          paleto?: string | null
          sapato?: string | null
          status?: string | null
          tags?: Json | null
          telefone_cliente?: string | null
          tipo?: string | null
          transcricao_audio?: string | null
          updated_at?: string
          url_audio?: string | null
          url_bucket?: string | null
          valor?: number | null
          vendedor_responsavel?: string | null
        }
        Update: {
          abotoaduras?: string | null
          calca?: string | null
          camisa?: string | null
          cliente_id?: string | null
          codigo_ficha?: string | null
          colete?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_festa?: string | null
          data_prova_1?: string | null
          data_prova_2?: string | null
          data_retirada?: string | null
          descricao_cliente?: string | null
          faixa?: string | null
          garantia?: number | null
          gravata?: string | null
          id?: string
          nome_cliente?: string | null
          outros?: string | null
          pago?: boolean
          paleto?: string | null
          sapato?: string | null
          status?: string | null
          tags?: Json | null
          telefone_cliente?: string | null
          tipo?: string | null
          transcricao_audio?: string | null
          updated_at?: string
          url_audio?: string | null
          url_bucket?: string | null
          valor?: number | null
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
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
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
      [_ in never]: never
    }
    Enums: {
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
      tipo_de_atendimento: ["Aluguel", "Venda", "Ajuste"],
      user_role: ["Gestor", "Franqueado", "Vendedor"],
    },
  },
} as const
