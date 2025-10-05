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
      fichas: {
        Row: {
          calca_json: Json | null
          camisa_json: Json | null
          carimbo_pago: boolean | null
          client_id: string | null
          cliente_nome: string
          cliente_telefone: string
          colete_json: Json | null
          created_at: string
          created_by: string | null
          data_devolucao: string | null
          data_evento: string | null
          data_prova1: string | null
          data_prova2: string | null
          data_retirada: string | null
          gravata_json: Json | null
          hora_prova1: string | null
          hora_prova2: string | null
          id: string
          numero_ficha: string
          ocr_raw_json: Json | null
          paleto_json: Json | null
          rodape_json: Json | null
          status_pagamento:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          tipo: Database["public"]["Enums"]["tipo_operacao"] | null
          unidade_id: string | null
          valor_bruto_num: number | null
          valor_desconto_num: number | null
          valor_final_num: number | null
        }
        Insert: {
          calca_json?: Json | null
          camisa_json?: Json | null
          carimbo_pago?: boolean | null
          client_id?: string | null
          cliente_nome: string
          cliente_telefone: string
          colete_json?: Json | null
          created_at?: string
          created_by?: string | null
          data_devolucao?: string | null
          data_evento?: string | null
          data_prova1?: string | null
          data_prova2?: string | null
          data_retirada?: string | null
          gravata_json?: Json | null
          hora_prova1?: string | null
          hora_prova2?: string | null
          id?: string
          numero_ficha: string
          ocr_raw_json?: Json | null
          paleto_json?: Json | null
          rodape_json?: Json | null
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          tipo?: Database["public"]["Enums"]["tipo_operacao"] | null
          unidade_id?: string | null
          valor_bruto_num?: number | null
          valor_desconto_num?: number | null
          valor_final_num?: number | null
        }
        Update: {
          calca_json?: Json | null
          camisa_json?: Json | null
          carimbo_pago?: boolean | null
          client_id?: string | null
          cliente_nome?: string
          cliente_telefone?: string
          colete_json?: Json | null
          created_at?: string
          created_by?: string | null
          data_devolucao?: string | null
          data_evento?: string | null
          data_prova1?: string | null
          data_prova2?: string | null
          data_retirada?: string | null
          gravata_json?: Json | null
          hora_prova1?: string | null
          hora_prova2?: string | null
          id?: string
          numero_ficha?: string
          ocr_raw_json?: Json | null
          paleto_json?: Json | null
          rodape_json?: Json | null
          status_pagamento?:
            | Database["public"]["Enums"]["status_pagamento"]
            | null
          tipo?: Database["public"]["Enums"]["tipo_operacao"] | null
          unidade_id?: string | null
          valor_bruto_num?: number | null
          valor_desconto_num?: number | null
          valor_final_num?: number | null
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
      status_pagamento: "pago" | "pendente" | "isento"
      tipo_ficha: "aluguel" | "venda" | "ajuste"
      tipo_operacao: "aluguel" | "venda" | "ajuste"
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
      status_pagamento: ["pago", "pendente", "isento"],
      tipo_ficha: ["aluguel", "venda", "ajuste"],
      tipo_operacao: ["aluguel", "venda", "ajuste"],
    },
  },
} as const
