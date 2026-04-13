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
          unidade_id: number | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          telefone?: string | null
          unidade_id?: number | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          unidade_id?: number | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: []
      }
      usuario_unidade_role: {
        Row: {
          created_at: string
          id: number
          role: Database["public"]["Enums"]["app_role"]
          unidade_id: number
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          unidade_id: number
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          unidade_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_unidade_role_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
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
          cliente_encontrado: boolean | null
          cliente_sugerido_id: string | null
          cliente_sugerido_nome: string | null
          enviada_whatsapp_geral: boolean | null
          enviada_whatsapp_venda: boolean | null
          erro_etapa: string | null
          garantia: number | null
          id: string
          nome_cliente: string | null
          ocr_tentativa: number | null
          pago: boolean
          paleto: string | null
          sapato: string | null
          status: Database["public"]["Enums"]["status_ficha"]
          tags: Json | null
          telefone_cliente: string | null
          tempo_processamento: number | null
          tipo: string | null
          transcricao_audio: string | null
          unidade_id: number | null
          updated_at: string
          url_audio: string | null
          url_bucket: string | null
          valor: number | null
          valor_calca: number | null
          valor_camisa: number | null
          valor_paleto: number | null
          vendedor_id: string | null
          vendedor_responsavel: string | null
          ficha_original_id: string | null
          prova1_data: string | null
          prova1_vendedor_id: string | null
          prova2_data: string | null
          prova2_vendedor_id: string | null
          prova3_data: string | null
          prova3_vendedor_id: string | null
        }
        Insert: {
          calca?: string | null
          camisa?: string | null
          cliente_encontrado?: boolean | null
          cliente_id?: string | null
          cliente_sugerido_id?: string | null
          cliente_sugerido_nome?: string | null
          codigo_ficha?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_festa?: string | null
          data_retirada?: string | null
          descricao_cliente?: string | null
          enviada_whatsapp_geral?: boolean | null
          enviada_whatsapp_venda?: boolean | null
          erro_etapa?: string | null
          garantia?: number | null
          id?: string
          nome_cliente?: string | null
          ocr_tentativa?: number | null
          pago?: boolean
          paleto?: string | null
          sapato?: string | null
          status?: Database["public"]["Enums"]["status_ficha"]
          tags?: Json | null
          telefone_cliente?: string | null
          tempo_processamento?: number | null
          tipo?: string | null
          transcricao_audio?: string | null
          unidade_id?: number | null
          updated_at?: string
          url_audio?: string | null
          url_bucket?: string | null
          valor?: number | null
          valor_calca?: number | null
          valor_camisa?: number | null
          valor_paleto?: number | null
          vendedor_id?: string | null
          vendedor_responsavel?: string | null
          ficha_original_id?: string | null
          prova1_data?: string | null
          prova1_vendedor_id?: string | null
          prova2_data?: string | null
          prova2_vendedor_id?: string | null
          prova3_data?: string | null
          prova3_vendedor_id?: string | null
        }
        Update: {
          calca?: string | null
          camisa?: string | null
          cliente_encontrado?: boolean | null
          cliente_id?: string | null
          cliente_sugerido_id?: string | null
          cliente_sugerido_nome?: string | null
          codigo_ficha?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_festa?: string | null
          data_retirada?: string | null
          descricao_cliente?: string | null
          enviada_whatsapp_geral?: boolean | null
          enviada_whatsapp_venda?: boolean | null
          erro_etapa?: string | null
          garantia?: number | null
          id?: string
          nome_cliente?: string | null
          ocr_tentativa?: number | null
          pago?: boolean
          paleto?: string | null
          sapato?: string | null
          status?: Database["public"]["Enums"]["status_ficha"]
          tags?: Json | null
          telefone_cliente?: string | null
          tempo_processamento?: number | null
          tipo?: string | null
          transcricao_audio?: string | null
          unidade_id?: number | null
          updated_at?: string
          url_audio?: string | null
          url_bucket?: string | null
          valor?: number | null
          valor_calca?: number | null
          valor_camisa?: number | null
          valor_paleto?: number | null
          vendedor_id?: string | null
          vendedor_responsavel?: string | null
          ficha_original_id?: string | null
          prova1_data?: string | null
          prova1_vendedor_id?: string | null
          prova2_data?: string | null
          prova2_vendedor_id?: string | null
          prova3_data?: string | null
          prova3_vendedor_id?: string | null
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
          ativo: boolean
          avatar_url: string | null
          created_at: string
          id: string
          nome: string | null
          senha_temporaria: boolean
          ultimo_login: string | null
          unidade_id: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          id: string
          nome?: string | null
          senha_temporaria?: boolean
          ultimo_login?: string | null
          unidade_id: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          senha_temporaria?: boolean
          ultimo_login?: string | null
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
          ativa: boolean
          cor: string
          created_at: string
          id: string
          nome: string | null
          unidade_id: number | null
        }
        Insert: {
          ativa?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string | null
          unidade_id?: number | null
        }
        Update: {
          ativa?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string | null
          unidade_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          ativa: boolean
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          endereco: string | null
          estado: string | null
          id: number
          nome: string | null
          numero_whatsapp_padrao: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          estado?: string | null
          id?: number
          nome?: string | null
          numero_whatsapp_padrao?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          endereco?: string | null
          estado?: string | null
          id?: number
          nome?: string | null
          numero_whatsapp_padrao?: string | null
          telefone?: string | null
          updated_at?: string
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
      add_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      can_access_unidade: {
        Args: { _target_unidade_id: number; _user_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_unidade: { Args: { _user_id: string }; Returns: number }
      get_usuarios_completos: {
        Args: never
        Returns: {
          ativo: boolean
          avatar_url: string
          created_at: string
          email: string
          id: string
          is_vendedor_adicional: boolean
          nome: string
          role: string
          unidade_id: number
          unidade_nome: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      remove_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      update_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "gestor"
        | "franqueado"
        | "vendedor"
        | "master"
        | "admin"
        | "suporte"
      status_ficha: "erro" | "pendente" | "ativa" | "baixa" | "aguardando_prova"
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
      app_role: [
        "gestor",
        "franqueado",
        "vendedor",
        "master",
        "admin",
        "suporte",
      ],
      status_ficha: ["erro", "pendente", "ativa", "baixa"],
      tipo_de_atendimento: ["Aluguel", "Venda", "Ajuste"],
      user_role: ["Gestor", "Franqueado", "Vendedor"],
    },
  },
} as const
