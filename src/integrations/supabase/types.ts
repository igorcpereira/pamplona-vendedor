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
      __EFMigrationsHistory: {
        Row: {
          MigrationId: string
          ProductVersion: string
        }
        Insert: {
          MigrationId: string
          ProductVersion: string
        }
        Update: {
          MigrationId?: string
          ProductVersion?: string
        }
        Relationships: []
      }
      analise_ficha_temp: {
        Row: {
          base64: string | null
          cabecalho: Json | null
          calca: Json | null
          camisa: Json | null
          colete: Json | null
          created_at: string
          gravata: Json | null
          id: string
          paleto: Json | null
          rodape: Json | null
        }
        Insert: {
          base64?: string | null
          cabecalho?: Json | null
          calca?: Json | null
          camisa?: Json | null
          colete?: Json | null
          created_at?: string
          gravata?: Json | null
          id: string
          paleto?: Json | null
          rodape?: Json | null
        }
        Update: {
          base64?: string | null
          cabecalho?: Json | null
          calca?: Json | null
          camisa?: Json | null
          colete?: Json | null
          created_at?: string
          gravata?: Json | null
          id?: string
          paleto?: Json | null
          rodape?: Json | null
        }
        Relationships: []
      }
      Clientes: {
        Row: {
          Id: number
          Nome: string
          Telefone: string
          UnidadeId: number
          VendedorId: number
        }
        Insert: {
          Id?: number
          Nome: string
          Telefone: string
          UnidadeId?: number
          VendedorId?: number
        }
        Update: {
          Id?: number
          Nome?: string
          Telefone?: string
          UnidadeId?: number
          VendedorId?: number
        }
        Relationships: [
          {
            foreignKeyName: "FK_Clientes_Unidades_UnidadeId"
            columns: ["UnidadeId"]
            isOneToOne: false
            referencedRelation: "Unidades"
            referencedColumns: ["Id"]
          },
        ]
      }
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
      Grupos: {
        Row: {
          Cnpj: string | null
          Id: number
          Nome: string
        }
        Insert: {
          Cnpj?: string | null
          Id?: number
          Nome: string
        }
        Update: {
          Cnpj?: string | null
          Id?: number
          Nome?: string
        }
        Relationships: []
      }
      Pedidos: {
        Row: {
          CalcaId: number | null
          CamisaId: number | null
          ClienteId: number
          ColeteId: number | null
          DataDevolucao: string | null
          DataEvento: string | null
          DataMedida: string | null
          DataProva1: string | null
          DataProva2: string | null
          DataRetirada: string | null
          Garantia: string | null
          Id: number
          NumeroFicha: number | null
          Observacoes: string | null
          Pago: boolean
          PaletoId: number | null
          RodapeId: number | null
          TipoOperacao: number
          Valor: number | null
        }
        Insert: {
          CalcaId?: number | null
          CamisaId?: number | null
          ClienteId: number
          ColeteId?: number | null
          DataDevolucao?: string | null
          DataEvento?: string | null
          DataMedida?: string | null
          DataProva1?: string | null
          DataProva2?: string | null
          DataRetirada?: string | null
          Garantia?: string | null
          Id?: number
          NumeroFicha?: number | null
          Observacoes?: string | null
          Pago?: boolean
          PaletoId?: number | null
          RodapeId?: number | null
          TipoOperacao: number
          Valor?: number | null
        }
        Update: {
          CalcaId?: number | null
          CamisaId?: number | null
          ClienteId?: number
          ColeteId?: number | null
          DataDevolucao?: string | null
          DataEvento?: string | null
          DataMedida?: string | null
          DataProva1?: string | null
          DataProva2?: string | null
          DataRetirada?: string | null
          Garantia?: string | null
          Id?: number
          NumeroFicha?: number | null
          Observacoes?: string | null
          Pago?: boolean
          PaletoId?: number | null
          RodapeId?: number | null
          TipoOperacao?: number
          Valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "FK_Pedidos_PedidosCalcas_CalcaId"
            columns: ["CalcaId"]
            isOneToOne: false
            referencedRelation: "PedidosCalcas"
            referencedColumns: ["Id"]
          },
          {
            foreignKeyName: "FK_Pedidos_PedidosCamisas_CamisaId"
            columns: ["CamisaId"]
            isOneToOne: false
            referencedRelation: "PedidosCamisas"
            referencedColumns: ["Id"]
          },
          {
            foreignKeyName: "FK_Pedidos_PedidosColetes_ColeteId"
            columns: ["ColeteId"]
            isOneToOne: false
            referencedRelation: "PedidosColetes"
            referencedColumns: ["Id"]
          },
          {
            foreignKeyName: "FK_Pedidos_PedidosPaletos_PaletoId"
            columns: ["PaletoId"]
            isOneToOne: false
            referencedRelation: "PedidosPaletos"
            referencedColumns: ["Id"]
          },
          {
            foreignKeyName: "FK_Pedidos_PedidosRodapes_RodapeId"
            columns: ["RodapeId"]
            isOneToOne: false
            referencedRelation: "PedidosRodapes"
            referencedColumns: ["Id"]
          },
        ]
      }
      PedidosCalcas: {
        Row: {
          Barra: string | null
          BarraApertar: string | null
          BarraMedida: string | null
          BarraSoltar: string | null
          Cintura: string | null
          CinturaApertar: string | null
          CinturaMarca: boolean
          CinturaMedida: string | null
          CinturaSoltar: string | null
          Cor: string | null
          Coxa: string | null
          CoxaApertar: string | null
          CoxaMarca: boolean
          CoxaSoltar: string | null
          Id: number
          Joelho: string | null
          JoelhoApertar: string | null
          JoelhoBoca: string | null
          JoelhoMarca: boolean
          JoelhoSoltar: string | null
          Outros: string | null
          PedidoId: number
          SobMedida: string | null
          Tamanho: string | null
        }
        Insert: {
          Barra?: string | null
          BarraApertar?: string | null
          BarraMedida?: string | null
          BarraSoltar?: string | null
          Cintura?: string | null
          CinturaApertar?: string | null
          CinturaMarca: boolean
          CinturaMedida?: string | null
          CinturaSoltar?: string | null
          Cor?: string | null
          Coxa?: string | null
          CoxaApertar?: string | null
          CoxaMarca: boolean
          CoxaSoltar?: string | null
          Id?: number
          Joelho?: string | null
          JoelhoApertar?: string | null
          JoelhoBoca?: string | null
          JoelhoMarca: boolean
          JoelhoSoltar?: string | null
          Outros?: string | null
          PedidoId: number
          SobMedida?: string | null
          Tamanho?: string | null
        }
        Update: {
          Barra?: string | null
          BarraApertar?: string | null
          BarraMedida?: string | null
          BarraSoltar?: string | null
          Cintura?: string | null
          CinturaApertar?: string | null
          CinturaMarca?: boolean
          CinturaMedida?: string | null
          CinturaSoltar?: string | null
          Cor?: string | null
          Coxa?: string | null
          CoxaApertar?: string | null
          CoxaMarca?: boolean
          CoxaSoltar?: string | null
          Id?: number
          Joelho?: string | null
          JoelhoApertar?: string | null
          JoelhoBoca?: string | null
          JoelhoMarca?: boolean
          JoelhoSoltar?: string | null
          Outros?: string | null
          PedidoId?: number
          SobMedida?: string | null
          Tamanho?: string | null
        }
        Relationships: []
      }
      PedidosCamisas: {
        Row: {
          Cintura: string | null
          CinturaLateral: string | null
          CinturaMarca: string | null
          CinturaPence: string | null
          Colarinho: string | null
          ColarinhoAlargador: boolean
          ColarinhoOriginal: boolean
          ColarinhoPonta: boolean
          Cor: string | null
          Id: number
          Manga: string | null
          MangaApertar: boolean
          MangaMedida: string | null
          MangaMenos: string | null
          Outros: string | null
          PedidoId: number
          SobMedida: string | null
          Tamanho: string | null
        }
        Insert: {
          Cintura?: string | null
          CinturaLateral?: string | null
          CinturaMarca?: string | null
          CinturaPence?: string | null
          Colarinho?: string | null
          ColarinhoAlargador: boolean
          ColarinhoOriginal: boolean
          ColarinhoPonta: boolean
          Cor?: string | null
          Id?: number
          Manga?: string | null
          MangaApertar: boolean
          MangaMedida?: string | null
          MangaMenos?: string | null
          Outros?: string | null
          PedidoId: number
          SobMedida?: string | null
          Tamanho?: string | null
        }
        Update: {
          Cintura?: string | null
          CinturaLateral?: string | null
          CinturaMarca?: string | null
          CinturaPence?: string | null
          Colarinho?: string | null
          ColarinhoAlargador?: boolean
          ColarinhoOriginal?: boolean
          ColarinhoPonta?: boolean
          Cor?: string | null
          Id?: number
          Manga?: string | null
          MangaApertar?: boolean
          MangaMedida?: string | null
          MangaMenos?: string | null
          Outros?: string | null
          PedidoId?: number
          SobMedida?: string | null
          Tamanho?: string | null
        }
        Relationships: []
      }
      PedidosColetes: {
        Row: {
          Cintura: string | null
          CinturaApertar: string | null
          CinturaMarca: boolean
          CinturaSoltar: string | null
          Id: number
          PedidoId: number
          Peito: string | null
          PeitoApertar: string | null
          PeitoMarca: boolean
          PeitoSoltar: string | null
          SobMedida: string | null
        }
        Insert: {
          Cintura?: string | null
          CinturaApertar?: string | null
          CinturaMarca: boolean
          CinturaSoltar?: string | null
          Id?: number
          PedidoId: number
          Peito?: string | null
          PeitoApertar?: string | null
          PeitoMarca: boolean
          PeitoSoltar?: string | null
          SobMedida?: string | null
        }
        Update: {
          Cintura?: string | null
          CinturaApertar?: string | null
          CinturaMarca?: boolean
          CinturaSoltar?: string | null
          Id?: number
          PedidoId?: number
          Peito?: string | null
          PeitoApertar?: string | null
          PeitoMarca?: boolean
          PeitoSoltar?: string | null
          SobMedida?: string | null
        }
        Relationships: []
      }
      PedidosGravatas: {
        Row: {
          Id: number
          Medida: string | null
          Modelo: string | null
          Outros: string | null
          PedidoId: number
        }
        Insert: {
          Id?: number
          Medida?: string | null
          Modelo?: string | null
          Outros?: string | null
          PedidoId: number
        }
        Update: {
          Id?: number
          Medida?: string | null
          Modelo?: string | null
          Outros?: string | null
          PedidoId?: number
        }
        Relationships: [
          {
            foreignKeyName: "FK_PedidosGravatas_Pedidos_PedidoId"
            columns: ["PedidoId"]
            isOneToOne: false
            referencedRelation: "Pedidos"
            referencedColumns: ["Id"]
          },
        ]
      }
      PedidosPaletos: {
        Row: {
          Cintura: string | null
          CinturaApertar: string | null
          CinturaMarca: boolean
          CinturaMedida: string | null
          CinturaSoltar: string | null
          Comprimento: string | null
          ComprimentoMais: string | null
          ComprimentoMarca: boolean
          ComprimentoMedida: string | null
          ComprimentoMenos: string | null
          Cor: string | null
          Id: number
          Manga: string | null
          MangaMais: string | null
          MangaMarca: boolean
          MangaMedida: string | null
          MangaMenos: string | null
          Outros: string | null
          PedidoId: number
          SobMedida: string | null
          Tamanho: string | null
        }
        Insert: {
          Cintura?: string | null
          CinturaApertar?: string | null
          CinturaMarca: boolean
          CinturaMedida?: string | null
          CinturaSoltar?: string | null
          Comprimento?: string | null
          ComprimentoMais?: string | null
          ComprimentoMarca: boolean
          ComprimentoMedida?: string | null
          ComprimentoMenos?: string | null
          Cor?: string | null
          Id?: number
          Manga?: string | null
          MangaMais?: string | null
          MangaMarca: boolean
          MangaMedida?: string | null
          MangaMenos?: string | null
          Outros?: string | null
          PedidoId: number
          SobMedida?: string | null
          Tamanho?: string | null
        }
        Update: {
          Cintura?: string | null
          CinturaApertar?: string | null
          CinturaMarca?: boolean
          CinturaMedida?: string | null
          CinturaSoltar?: string | null
          Comprimento?: string | null
          ComprimentoMais?: string | null
          ComprimentoMarca?: boolean
          ComprimentoMedida?: string | null
          ComprimentoMenos?: string | null
          Cor?: string | null
          Id?: number
          Manga?: string | null
          MangaMais?: string | null
          MangaMarca?: boolean
          MangaMedida?: string | null
          MangaMenos?: string | null
          Outros?: string | null
          PedidoId?: number
          SobMedida?: string | null
          Tamanho?: string | null
        }
        Relationships: []
      }
      PedidosRodapes: {
        Row: {
          Abotoadura: string | null
          Faixa: string | null
          Id: number
          Outros: string | null
          PedidoId: number
          Sapato: string | null
        }
        Insert: {
          Abotoadura?: string | null
          Faixa?: string | null
          Id?: number
          Outros?: string | null
          PedidoId: number
          Sapato?: string | null
        }
        Update: {
          Abotoadura?: string | null
          Faixa?: string | null
          Id?: number
          Outros?: string | null
          PedidoId?: number
          Sapato?: string | null
        }
        Relationships: []
      }
      pre_cadastros: {
        Row: {
          created_at: string | null
          id: string
          phone: string | null
          status: string
          timestamp: string
          webhook_data: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          phone?: string | null
          status: string
          timestamp: string
          webhook_data?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          phone?: string | null
          status?: string
          timestamp?: string
          webhook_data?: Json | null
        }
        Relationships: []
      }
      RefreshTokens: {
        Row: {
          DataCriacao: string
          DataExpiracao: string
          DataRevogacao: string | null
          DeviceInfo: string
          Id: number
          MotivoRevogacao: string | null
          Revogado: boolean
          Token: string
          UsuarioId: number
        }
        Insert: {
          DataCriacao: string
          DataExpiracao: string
          DataRevogacao?: string | null
          DeviceInfo: string
          Id?: number
          MotivoRevogacao?: string | null
          Revogado: boolean
          Token: string
          UsuarioId: number
        }
        Update: {
          DataCriacao?: string
          DataExpiracao?: string
          DataRevogacao?: string | null
          DeviceInfo?: string
          Id?: number
          MotivoRevogacao?: string | null
          Revogado?: boolean
          Token?: string
          UsuarioId?: number
        }
        Relationships: [
          {
            foreignKeyName: "FK_RefreshTokens_Usuarios_UsuarioId"
            columns: ["UsuarioId"]
            isOneToOne: false
            referencedRelation: "Usuarios"
            referencedColumns: ["Id"]
          },
        ]
      }
      Unidades: {
        Row: {
          Cnpj: string | null
          DddPadrao: number | null
          GrupoId: number
          Id: number
          Nome: string
          NomeFantasia: string | null
        }
        Insert: {
          Cnpj?: string | null
          DddPadrao?: number | null
          GrupoId: number
          Id?: number
          Nome: string
          NomeFantasia?: string | null
        }
        Update: {
          Cnpj?: string | null
          DddPadrao?: number | null
          GrupoId?: number
          Id?: number
          Nome?: string
          NomeFantasia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "FK_Unidades_Grupos_GrupoId"
            columns: ["GrupoId"]
            isOneToOne: false
            referencedRelation: "Grupos"
            referencedColumns: ["Id"]
          },
        ]
      }
      Usuarios: {
        Row: {
          Email: string
          Id: number
          Nome: string
          Senha: string | null
          Status: number
        }
        Insert: {
          Email: string
          Id?: number
          Nome: string
          Senha?: string | null
          Status: number
        }
        Update: {
          Email?: string
          Id?: number
          Nome?: string
          Senha?: string | null
          Status?: number
        }
        Relationships: []
      }
      UsuariosAtivacoes: {
        Row: {
          DataExpiracao: string
          Id: number
          Token: string
          UsuarioId: number
          Utilizado: boolean
        }
        Insert: {
          DataExpiracao: string
          Id?: number
          Token: string
          UsuarioId: number
          Utilizado: boolean
        }
        Update: {
          DataExpiracao?: string
          Id?: number
          Token?: string
          UsuarioId?: number
          Utilizado?: boolean
        }
        Relationships: []
      }
      UsuariosRoles: {
        Row: {
          GrupoId: number | null
          Id: number
          Role: number
          UnidadeId: number | null
          UsuarioId: number
        }
        Insert: {
          GrupoId?: number | null
          Id?: number
          Role: number
          UnidadeId?: number | null
          UsuarioId: number
        }
        Update: {
          GrupoId?: number | null
          Id?: number
          Role?: number
          UnidadeId?: number | null
          UsuarioId?: number
        }
        Relationships: [
          {
            foreignKeyName: "FK_UsuariosRoles_Grupos_GrupoId"
            columns: ["GrupoId"]
            isOneToOne: false
            referencedRelation: "Grupos"
            referencedColumns: ["Id"]
          },
          {
            foreignKeyName: "FK_UsuariosRoles_Unidades_UnidadeId"
            columns: ["UnidadeId"]
            isOneToOne: false
            referencedRelation: "Unidades"
            referencedColumns: ["Id"]
          },
          {
            foreignKeyName: "FK_UsuariosRoles_Usuarios_UsuarioId"
            columns: ["UsuarioId"]
            isOneToOne: false
            referencedRelation: "Usuarios"
            referencedColumns: ["Id"]
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
