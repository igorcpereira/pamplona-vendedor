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
      atividade_eventos: {
        Row: {
          acao: string
          atividade_id: string
          autor_id: string | null
          created_at: string
          data_anterior: string | null
          data_nova: string | null
          id: string
          observacao: string | null
          resp_anterior: string | null
          resp_novo: string | null
        }
        Insert: {
          acao: string
          atividade_id: string
          autor_id?: string | null
          created_at?: string
          data_anterior?: string | null
          data_nova?: string | null
          id?: string
          observacao?: string | null
          resp_anterior?: string | null
          resp_novo?: string | null
        }
        Update: {
          acao?: string
          atividade_id?: string
          autor_id?: string | null
          created_at?: string
          data_anterior?: string | null
          data_nova?: string | null
          id?: string
          observacao?: string | null
          resp_anterior?: string | null
          resp_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividade_eventos_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividade_eventos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          cliente_id: string | null
          created_at: string
          created_by: string | null
          data: string
          data_evento: string | null
          descricao: string | null
          desfecho: string | null
          ficha_id: string | null
          grupo_id: string | null
          id: string
          oportunidade_id: string | null
          papel_destino: string | null
          pedido_id: string | null
          responsavel_id: string | null
          status: string
          tipo_id: string
          unidade_id: number | null
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data: string
          data_evento?: string | null
          descricao?: string | null
          desfecho?: string | null
          ficha_id?: string | null
          grupo_id?: string | null
          id?: string
          oportunidade_id?: string | null
          papel_destino?: string | null
          pedido_id?: string | null
          responsavel_id?: string | null
          status?: string
          tipo_id: string
          unidade_id?: number | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          data_evento?: string | null
          descricao?: string | null
          desfecho?: string | null
          ficha_id?: string | null
          grupo_id?: string | null
          id?: string
          oportunidade_id?: string | null
          papel_destino?: string | null
          pedido_id?: string | null
          responsavel_id?: string | null
          status?: string
          tipo_id?: string
          unidade_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          alterar_nome: boolean | null
          created_at: string
          id: string
          nome: string
          telefone: string | null
          tipo_atendimento: string | null
          unidade_id: number | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          alterar_nome?: boolean | null
          created_at?: string
          id?: string
          nome: string
          telefone?: string | null
          tipo_atendimento?: string | null
          unidade_id?: number | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          alterar_nome?: boolean | null
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          tipo_atendimento?: string | null
          unidade_id?: number | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_antigos: {
        Row: {
          alterar_nome: boolean | null
          arquivado_em: string
          created_at: string
          id: string
          msgs_whatsapp: number
          nome: string
          tags: Json
          telefone: string | null
          tipo_atendimento: string | null
          unidade_id: number | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          alterar_nome?: boolean | null
          arquivado_em?: string
          created_at: string
          id: string
          msgs_whatsapp?: number
          nome: string
          tags?: Json
          telefone?: string | null
          tipo_atendimento?: string | null
          unidade_id?: number | null
          updated_at: string
          vendedor_id?: string | null
        }
        Update: {
          alterar_nome?: boolean | null
          arquivado_em?: string
          created_at?: string
          id?: string
          msgs_whatsapp?: number
          nome?: string
          tags?: Json
          telefone?: string | null
          tipo_atendimento?: string | null
          unidade_id?: number | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: []
      }
      clientes_import: {
        Row: {
          data: string | null
          item: string | null
          noivo: string | null
          nome: string | null
          telefone: string | null
          valor: number | null
          vendedor: string | null
        }
        Insert: {
          data?: string | null
          item?: string | null
          noivo?: string | null
          nome?: string | null
          telefone?: string | null
          valor?: number | null
          vendedor?: string | null
        }
        Update: {
          data?: string | null
          item?: string | null
          noivo?: string | null
          nome?: string | null
          telefone?: string | null
          valor?: number | null
          vendedor?: string | null
        }
        Relationships: []
      }
      dados_importantes: {
        Row: {
          created_at: string | null
          data: string | null
          id: string
          key: string
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          id?: string
          key: string
        }
        Update: {
          created_at?: string | null
          data?: string | null
          id?: string
          key?: string
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
          camisa_cor: string | null
          camisa_fios: string | null
          cliente_encontrado: boolean | null
          cliente_id: string | null
          cliente_sugerido_id: string | null
          cliente_sugerido_nome: string | null
          codigo_ficha: string | null
          created_at: string
          data_devolucao: string | null
          data_festa: string | null
          data_retirada: string | null
          descricao_cliente: string | null
          enviada_whatsapp_geral: boolean
          enviada_whatsapp_venda: boolean
          erro_etapa: string | null
          ficha_original_id: string | null
          garantia: string | null
          id: string
          is_noivo: boolean
          lanificio_id: string | null
          nome_cliente: string | null
          ocr_tentativa: number | null
          oportunidade_id: string | null
          pago: boolean
          paleto: string | null
          paleto_categoria: string | null
          paleto_cor: string | null
          paleto_lanificio: string | null
          prova1_data: string | null
          prova1_vendedor_id: string | null
          prova2_data: string | null
          prova2_vendedor_id: string | null
          prova3_data: string | null
          prova3_vendedor_id: string | null
          sapato: string | null
          sapato_tipo: string | null
          sob_medida: boolean
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
          valor_calca: string | null
          valor_camisa: string | null
          valor_paleto: string | null
          vendedor_id: string | null
        }
        Insert: {
          calca?: string | null
          camisa?: string | null
          camisa_cor?: string | null
          camisa_fios?: string | null
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
          enviada_whatsapp_geral?: boolean
          enviada_whatsapp_venda?: boolean
          erro_etapa?: string | null
          ficha_original_id?: string | null
          garantia?: string | null
          id?: string
          is_noivo?: boolean
          lanificio_id?: string | null
          nome_cliente?: string | null
          ocr_tentativa?: number | null
          oportunidade_id?: string | null
          pago?: boolean
          paleto?: string | null
          paleto_categoria?: string | null
          paleto_cor?: string | null
          paleto_lanificio?: string | null
          prova1_data?: string | null
          prova1_vendedor_id?: string | null
          prova2_data?: string | null
          prova2_vendedor_id?: string | null
          prova3_data?: string | null
          prova3_vendedor_id?: string | null
          sapato?: string | null
          sapato_tipo?: string | null
          sob_medida?: boolean
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
          valor_calca?: string | null
          valor_camisa?: string | null
          valor_paleto?: string | null
          vendedor_id?: string | null
        }
        Update: {
          calca?: string | null
          camisa?: string | null
          camisa_cor?: string | null
          camisa_fios?: string | null
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
          enviada_whatsapp_geral?: boolean
          enviada_whatsapp_venda?: boolean
          erro_etapa?: string | null
          ficha_original_id?: string | null
          garantia?: string | null
          id?: string
          is_noivo?: boolean
          lanificio_id?: string | null
          nome_cliente?: string | null
          ocr_tentativa?: number | null
          oportunidade_id?: string | null
          pago?: boolean
          paleto?: string | null
          paleto_categoria?: string | null
          paleto_cor?: string | null
          paleto_lanificio?: string | null
          prova1_data?: string | null
          prova1_vendedor_id?: string | null
          prova2_data?: string | null
          prova2_vendedor_id?: string | null
          prova3_data?: string | null
          prova3_vendedor_id?: string | null
          sapato?: string | null
          sapato_tipo?: string | null
          sob_medida?: boolean
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
          valor_calca?: string | null
          valor_camisa?: string | null
          valor_paleto?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_ficha_original_id_fkey"
            columns: ["ficha_original_id"]
            isOneToOne: false
            referencedRelation: "fichas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_lanificio_id_fkey"
            columns: ["lanificio_id"]
            isOneToOne: false
            referencedRelation: "lanificios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_excluidas: {
        Row: {
          calca: string | null
          camisa: string | null
          camisa_cor: string | null
          camisa_fios: string | null
          cliente_encontrado: boolean | null
          cliente_id: string | null
          cliente_sugerido_id: string | null
          cliente_sugerido_nome: string | null
          codigo_ficha: string | null
          created_at: string
          data_devolucao: string | null
          data_festa: string | null
          data_retirada: string | null
          descricao_cliente: string | null
          enviada_whatsapp_geral: boolean
          enviada_whatsapp_venda: boolean
          erro_etapa: string | null
          excluida_em: string
          excluida_por: string | null
          ficha_original_id: string | null
          garantia: string | null
          id: string
          id_ficha_original: string
          is_noivo: boolean
          lanificio_id: string | null
          nome_cliente: string | null
          ocr_tentativa: number | null
          pago: boolean
          paleto: string | null
          paleto_categoria: string | null
          paleto_cor: string | null
          paleto_lanificio: string | null
          prova1_data: string | null
          prova1_vendedor_id: string | null
          prova2_data: string | null
          prova2_vendedor_id: string | null
          prova3_data: string | null
          prova3_vendedor_id: string | null
          sapato: string | null
          sapato_tipo: string | null
          sob_medida: boolean | null
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
          valor_calca: string | null
          valor_camisa: string | null
          valor_paleto: string | null
          vendedor_id: string | null
        }
        Insert: {
          calca?: string | null
          camisa?: string | null
          camisa_cor?: string | null
          camisa_fios?: string | null
          cliente_encontrado?: boolean | null
          cliente_id?: string | null
          cliente_sugerido_id?: string | null
          cliente_sugerido_nome?: string | null
          codigo_ficha?: string | null
          created_at: string
          data_devolucao?: string | null
          data_festa?: string | null
          data_retirada?: string | null
          descricao_cliente?: string | null
          enviada_whatsapp_geral: boolean
          enviada_whatsapp_venda: boolean
          erro_etapa?: string | null
          excluida_em?: string
          excluida_por?: string | null
          ficha_original_id?: string | null
          garantia?: string | null
          id: string
          id_ficha_original: string
          is_noivo: boolean
          lanificio_id?: string | null
          nome_cliente?: string | null
          ocr_tentativa?: number | null
          pago: boolean
          paleto?: string | null
          paleto_categoria?: string | null
          paleto_cor?: string | null
          paleto_lanificio?: string | null
          prova1_data?: string | null
          prova1_vendedor_id?: string | null
          prova2_data?: string | null
          prova2_vendedor_id?: string | null
          prova3_data?: string | null
          prova3_vendedor_id?: string | null
          sapato?: string | null
          sapato_tipo?: string | null
          sob_medida?: boolean | null
          status: Database["public"]["Enums"]["status_ficha"]
          tags?: Json | null
          telefone_cliente?: string | null
          tempo_processamento?: number | null
          tipo?: string | null
          transcricao_audio?: string | null
          unidade_id?: number | null
          updated_at: string
          url_audio?: string | null
          url_bucket?: string | null
          valor?: number | null
          valor_calca?: string | null
          valor_camisa?: string | null
          valor_paleto?: string | null
          vendedor_id?: string | null
        }
        Update: {
          calca?: string | null
          camisa?: string | null
          camisa_cor?: string | null
          camisa_fios?: string | null
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
          enviada_whatsapp_geral?: boolean
          enviada_whatsapp_venda?: boolean
          erro_etapa?: string | null
          excluida_em?: string
          excluida_por?: string | null
          ficha_original_id?: string | null
          garantia?: string | null
          id?: string
          id_ficha_original?: string
          is_noivo?: boolean
          lanificio_id?: string | null
          nome_cliente?: string | null
          ocr_tentativa?: number | null
          pago?: boolean
          paleto?: string | null
          paleto_categoria?: string | null
          paleto_cor?: string | null
          paleto_lanificio?: string | null
          prova1_data?: string | null
          prova1_vendedor_id?: string | null
          prova2_data?: string | null
          prova2_vendedor_id?: string | null
          prova3_data?: string | null
          prova3_vendedor_id?: string | null
          sapato?: string | null
          sapato_tipo?: string | null
          sob_medida?: boolean | null
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
          valor_calca?: string | null
          valor_camisa?: string | null
          valor_paleto?: string | null
          vendedor_id?: string | null
        }
        Relationships: []
      }
      fichas_ocr_log: {
        Row: {
          created_at: string
          ficha_id: string
          id: string
          modelo: string | null
          raw: Json
          tentativa: number | null
        }
        Insert: {
          created_at?: string
          ficha_id: string
          id?: string
          modelo?: string | null
          raw: Json
          tentativa?: number | null
        }
        Update: {
          created_at?: string
          ficha_id?: string
          id?: string
          modelo?: string | null
          raw?: Json
          tentativa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_ocr_log_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas"
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
      funil_etapas: {
        Row: {
          ativa: boolean
          atividades: Json
          created_at: string
          desfechos: Json
          etapa: number
          id: string
          rotulo: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          atividades?: Json
          created_at?: string
          desfechos?: Json
          etapa: number
          id?: string
          rotulo: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          atividades?: Json
          created_at?: string
          desfechos?: Json
          etapa?: number
          id?: string
          rotulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      historico_whatsapp: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          from_me: boolean | null
          group_id: string | null
          group_name: string | null
          id: number
          lida: boolean | null
          lida_em: string | null
          media_url: string | null
          mensagem: string | null
          push_name: string | null
          quoted_message_id: number | null
          status: string | null
          telefone: string | null
          tipo_mensagem: string | null
          unit_id: number | null
          wpp_msg_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          from_me?: boolean | null
          group_id?: string | null
          group_name?: string | null
          id?: number
          lida?: boolean | null
          lida_em?: string | null
          media_url?: string | null
          mensagem?: string | null
          push_name?: string | null
          quoted_message_id?: number | null
          status?: string | null
          telefone?: string | null
          tipo_mensagem?: string | null
          unit_id?: number | null
          wpp_msg_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          from_me?: boolean | null
          group_id?: string | null
          group_name?: string | null
          id?: number
          lida?: boolean | null
          lida_em?: string | null
          media_url?: string | null
          mensagem?: string | null
          push_name?: string | null
          quoted_message_id?: number | null
          status?: string | null
          telefone?: string | null
          tipo_mensagem?: string | null
          unit_id?: number | null
          wpp_msg_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_whatsapp_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_whatsapp_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_whatsapp_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_avulsos_ficha: {
        Row: {
          created_at: string
          id: string
          pedido_id: string
          quantidade: number
          tipo_item: string
          updated_at: string
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          pedido_id: string
          quantidade?: number
          tipo_item: string
          updated_at?: string
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          pedido_id?: string
          quantidade?: number
          tipo_item?: string
          updated_at?: string
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_avulsos_ficha_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_avulsos_ficha_tipo_item_fkey"
            columns: ["tipo_item"]
            isOneToOne: false
            referencedRelation: "tipos_item_avulso"
            referencedColumns: ["slug"]
          },
        ]
      }
      lanificios: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
          tipo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          tipo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          tipo?: string
        }
        Relationships: []
      }
      log_alteracoes_ficha: {
        Row: {
          acao: string
          alterado_em: string
          alterado_por: string | null
          diff: Json
          ficha_id: string | null
          id: string
          origem: string
          registro_id: string
        }
        Insert: {
          acao: string
          alterado_em?: string
          alterado_por?: string | null
          diff?: Json
          ficha_id?: string | null
          id?: string
          origem: string
          registro_id: string
        }
        Update: {
          acao?: string
          alterado_em?: string
          alterado_por?: string | null
          diff?: Json
          ficha_id?: string | null
          id?: string
          origem?: string
          registro_id?: string
        }
        Relationships: []
      }
      log_processo_ficha: {
        Row: {
          created_at: string
          edge_function_inicio: string | null
          ficha_criada: string | null
          ficha_id: string
          ficha_processada: string | null
          sucesso: boolean
          upload_concluido: string | null
          webhook_atualiza: string | null
          webhook_bucket: string | null
          webhook_enviado: string | null
          webhook_extract: string | null
          webhook_gpt: string | null
          webhook_parser_dados: string | null
          webhook_resposta: string | null
        }
        Insert: {
          created_at?: string
          edge_function_inicio?: string | null
          ficha_criada?: string | null
          ficha_id: string
          ficha_processada?: string | null
          sucesso?: boolean
          upload_concluido?: string | null
          webhook_atualiza?: string | null
          webhook_bucket?: string | null
          webhook_enviado?: string | null
          webhook_extract?: string | null
          webhook_gpt?: string | null
          webhook_parser_dados?: string | null
          webhook_resposta?: string | null
        }
        Update: {
          created_at?: string
          edge_function_inicio?: string | null
          ficha_criada?: string | null
          ficha_id?: string
          ficha_processada?: string | null
          sucesso?: boolean
          upload_concluido?: string | null
          webhook_atualiza?: string | null
          webhook_bucket?: string | null
          webhook_enviado?: string | null
          webhook_extract?: string | null
          webhook_gpt?: string | null
          webhook_parser_dados?: string | null
          webhook_resposta?: string | null
        }
        Relationships: []
      }
      logs_acesso: {
        Row: {
          app: string
          created_at: string
          evento: string
          id: number
          rota: string
          unidade_id: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app: string
          created_at?: string
          evento: string
          id?: never
          rota: string
          unidade_id?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app?: string
          created_at?: string
          evento?: string
          id?: never
          rota?: string
          unidade_id?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_acesso_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opcoes_ficha: {
        Row: {
          ativo: boolean
          campo: string
          created_at: string
          id: string
          ordem: number
          valor: string
        }
        Insert: {
          ativo?: boolean
          campo: string
          created_at?: string
          id?: string
          ordem?: number
          valor: string
        }
        Update: {
          ativo?: boolean
          campo?: string
          created_at?: string
          id?: string
          ordem?: number
          valor?: string
        }
        Relationships: []
      }
      oportunidade_logs: {
        Row: {
          acao: string
          atividade_id: string | null
          autor_id: string | null
          created_at: string
          de_etapa: number | null
          id: string
          observacao: string | null
          oportunidade_id: string
          para_etapa: number | null
        }
        Insert: {
          acao: string
          atividade_id?: string | null
          autor_id?: string | null
          created_at?: string
          de_etapa?: number | null
          id?: string
          observacao?: string | null
          oportunidade_id: string
          para_etapa?: number | null
        }
        Update: {
          acao?: string
          atividade_id?: string | null
          autor_id?: string | null
          created_at?: string
          de_etapa?: number | null
          id?: string
          observacao?: string | null
          oportunidade_id?: string
          para_etapa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidade_logs_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidade_logs_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidade_logs_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          data_evento: string | null
          etapa: number
          etapa_alterada_em: string
          ficha_id: string | null
          id: string
          motivo_perda: string | null
          responsavel_id: string | null
          status: string
          temperatura: string | null
          tipo_negociacao: string | null
          unidade_id: number
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_evento?: string | null
          etapa?: number
          etapa_alterada_em?: string
          ficha_id?: string | null
          id?: string
          motivo_perda?: string | null
          responsavel_id?: string | null
          status?: string
          temperatura?: string | null
          tipo_negociacao?: string | null
          unidade_id: number
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_evento?: string | null
          etapa?: number
          etapa_alterada_em?: string
          ficha_id?: string | null
          id?: string
          motivo_perda?: string | null
          responsavel_id?: string | null
          status?: string
          temperatura?: string | null
          tipo_negociacao?: string | null
          unidade_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          created_at: string
          ficha_id: string
          garantia: number | null
          id: string
          pago: boolean
          unidade_id: number
          updated_at: string
          valor_total: number
          vendedor_id: string
        }
        Insert: {
          created_at?: string
          ficha_id: string
          garantia?: number | null
          id?: string
          pago?: boolean
          unidade_id: number
          updated_at?: string
          valor_total?: number
          vendedor_id: string
        }
        Update: {
          created_at?: string
          ficha_id?: string
          garantia?: number | null
          id?: string
          pago?: boolean
          unidade_id?: number
          updated_at?: string
          valor_total?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
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
          is_teste: boolean
          nome: string | null
          senha_temporaria: boolean
          ultimo_acesso: string | null
          ultimo_login: string | null
          unidade_id: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          id: string
          is_teste?: boolean
          nome?: string | null
          senha_temporaria?: boolean
          ultimo_acesso?: string | null
          ultimo_login?: string | null
          unidade_id: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_teste?: boolean
          nome?: string | null
          senha_temporaria?: boolean
          ultimo_acesso?: string | null
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
      provas: {
        Row: {
          created_at: string
          ficha_id: string | null
          id: string
          nome_cliente: string | null
          telefone_cliente: string | null
          unidade_id: number | null
          vendedor_id: string
        }
        Insert: {
          created_at?: string
          ficha_id?: string | null
          id?: string
          nome_cliente?: string | null
          telefone_cliente?: string | null
          unidade_id?: number | null
          vendedor_id: string
        }
        Update: {
          created_at?: string
          ficha_id?: string | null
          id?: string
          nome_cliente?: string | null
          telefone_cliente?: string | null
          unidade_id?: number | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provas_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provas_unidade_id_fkey"
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
          created_by: string | null
          ficha_id: string | null
          id: number
          id_cliente: string | null
          id_tag: string | null
          unidade_id: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ficha_id?: string | null
          id?: number
          id_cliente?: string | null
          id_tag?: string | null
          unidade_id?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ficha_id?: string | null
          id?: number
          id_cliente?: string | null
          id_tag?: string | null
          unidade_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "relacao_cliente_tag_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relacao_cliente_tag_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "relacao_cliente_tag_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          ativa: boolean
          categoria: string
          cor: string
          created_at: string
          id: string
          nome: string
          padrao: boolean
          unidade_id: number | null
        }
        Insert: {
          ativa?: boolean
          categoria?: string
          cor?: string
          created_at?: string
          id?: string
          nome: string
          padrao?: boolean
          unidade_id?: number | null
        }
        Update: {
          ativa?: boolean
          categoria?: string
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          padrao?: boolean
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
      tipos_atividade: {
        Row: {
          ativo: boolean
          created_at: string
          exige_cliente: boolean
          id: string
          nome: string
          ordem: number
          permite_avulso: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          exige_cliente?: boolean
          id?: string
          nome: string
          ordem?: number
          permite_avulso?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          exige_cliente?: boolean
          id?: string
          nome?: string
          ordem?: number
          permite_avulso?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tipos_item_avulso: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
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
          evolution_instance_name: string | null
          evolutionapi_token: string | null
          horario_funcionamento: Json | null
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
          evolution_instance_name?: string | null
          evolutionapi_token?: string | null
          horario_funcionamento?: Json | null
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
          evolution_instance_name?: string | null
          evolutionapi_token?: string | null
          horario_funcionamento?: Json | null
          id?: number
          nome?: string | null
          numero_whatsapp_padrao?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usuario_unidade_role: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          unidade_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          unidade_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      whatsapp_auto_messages: {
        Row: {
          ativo: boolean | null
          created_at: string
          id: string
          mensagem: string
          nome: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          mensagem: string
          nome: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          mensagem?: string
          nome?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_auto_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_groups: {
        Row: {
          created_at: string
          group_id: string
          group_name: string | null
          id: string
          unit_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          group_name?: string | null
          id?: string
          unit_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          group_name?: string | null
          id?: string
          unit_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_groups_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_jid_mapping: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          lid_jid: string | null
          phone_jid: string
          unit_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          lid_jid?: string | null
          phone_jid: string
          unit_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          lid_jid?: string | null
          phone_jid?: string
          unit_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_jid_mapping_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_mensagens_automaticas: {
        Row: {
          ativo: boolean | null
          created_at: string
          id: string
          mensagem: string
          tipo: string
          unit_id: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          mensagem: string
          tipo: string
          unit_id: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          mensagem?: string
          tipo?: string
          unit_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_mensagens_automaticas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_atendimentos: {
        Row: {
          cliente_id: string | null
          data: string | null
          tipo: string | null
          unidade_id: number | null
          valor: number | null
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          data?: string | null
          tipo?: never
          unidade_id?: number | null
          valor?: never
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          data?: string | null
          tipo?: never
          unidade_id?: number | null
          valor?: never
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_cliente_unidade: {
        Row: {
          atendimentos: number | null
          avulsos: number | null
          cliente_id: string | null
          dono_id: string | null
          fichas_ajuste: number | null
          fichas_aluguel: number | null
          fichas_sob_medida: number | null
          fichas_venda: number | null
          primeiro_atendimento: string | null
          ultima_venda: string | null
          ultimo_atendimento: string | null
          unidade_id: number | null
          valor_avulsos: number | null
          valor_fichas: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_cliente_unidade_vendedor: {
        Row: {
          avulsos: number | null
          cliente_id: string | null
          fichas: number | null
          primeiro_atendimento: string | null
          ultimo_atendimento: string | null
          unidade_id: number | null
          valor_avulsos: number | null
          valor_fichas: number | null
          vendedor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _atividade_pode_agir: { Args: { p_id: string }; Returns: boolean }
      _ficha_log_diff: {
        Args: { p_ignore: string[]; p_new: Json; p_old: Json }
        Returns: Json
      }
      _funil_resolver_data: {
        Args: { p_payload: Json; p_quando: Json }
        Returns: string
      }
      _oportunidade_cancelar_pendentes: {
        Args: { p_motivo: string; p_op_id: string }
        Returns: number
      }
      _oportunidade_gerar_atividades: {
        Args: { p_etapa: number; p_op_id: string; p_payload?: Json }
        Returns: number
      }
      _oportunidade_pode_gerir: { Args: { p_id: string }; Returns: boolean }
      atividade_historico_cliente: {
        Args: { p_cliente_id: string }
        Returns: {
          acao: string
          atividade_data: string
          atividade_id: string
          atividade_status: string
          autor_id: string
          autor_nome: string
          data_anterior: string
          data_nova: string
          evento_id: string
          observacao: string
          quando: string
          tipo_nome: string
        }[]
      }
      atividades_adiar: {
        Args: {
          p_id: string
          p_nova_data: string
          p_nova_hora?: string
          p_obs?: string
        }
        Returns: undefined
      }
      atividades_cancelar: {
        Args: { p_id: string; p_motivo?: string }
        Returns: undefined
      }
      atividades_carteira_previa: {
        Args: {
          p_recencia_ate?: string
          p_recencia_campo?: string
          p_recencia_de?: string
          p_tag_ids?: string[]
          p_ticket_ate?: string
          p_ticket_de?: string
          p_ticket_escopo?: string
          p_ticket_max?: number
          p_ticket_min?: number
          p_tipos?: string[]
        }
        Returns: Json
      }
      atividades_concluir: {
        Args: {
          p_desfecho?: string
          p_id: string
          p_obs?: string
          p_payload?: Json
        }
        Returns: undefined
      }
      atividades_criar: {
        Args: {
          p_cliente_id?: string
          p_data: string
          p_data_evento?: string
          p_descricao?: string
          p_ficha_id?: string
          p_pedido_id?: string
          p_responsaveis?: string[]
          p_tipo_id: string
          p_unidade_id?: number
        }
        Returns: string
      }
      atividades_criar_lote: {
        Args: {
          p_data: string
          p_descricao?: string
          p_recencia_ate?: string
          p_recencia_campo?: string
          p_recencia_de?: string
          p_tag_ids?: string[]
          p_ticket_ate?: string
          p_ticket_de?: string
          p_ticket_escopo?: string
          p_ticket_max?: number
          p_ticket_min?: number
          p_tipo_id: string
          p_tipos?: string[]
          p_unidade_id: number
        }
        Returns: Json
      }
      atividades_criar_lote_carteira: {
        Args: {
          p_data: string
          p_descricao?: string
          p_recencia_ate?: string
          p_recencia_campo?: string
          p_recencia_de?: string
          p_tag_ids?: string[]
          p_ticket_ate?: string
          p_ticket_de?: string
          p_ticket_escopo?: string
          p_ticket_max?: number
          p_ticket_min?: number
          p_tipo_id: string
          p_tipos?: string[]
        }
        Returns: Json
      }
      atividades_listar: {
        Args: {
          p_ate?: string
          p_cliente_id?: string
          p_de?: string
          p_responsavel_id?: string
          p_status?: string
          p_unidade_id?: number
        }
        Returns: {
          cliente_id: string
          cliente_nome: string
          cliente_telefone: string
          compromisso_data: string
          compromisso_hora: string
          created_at: string
          created_by: string
          data: string
          data_evento: string
          descricao: string
          desfecho: string
          desfechos: Json
          ficha_id: string
          grupo_id: string
          hora: string
          id: string
          oportunidade_etapa: number
          oportunidade_etapa_rotulo: string
          oportunidade_id: string
          oportunidade_tipo: string
          papel_destino: string
          pedido_id: string
          responsavel_id: string
          responsavel_nome: string
          status: string
          status_visivel: string
          tipo_id: string
          tipo_nome: string
          tipo_slug: string
          unidade_id: number
          updated_at: string
        }[]
      }
      atividades_listar_encerradas: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: string
          p_unidade_id?: number
        }
        Returns: {
          cliente_id: string
          cliente_nome: string
          cliente_telefone: string
          created_at: string
          created_by: string
          data: string
          data_evento: string
          descricao: string
          ficha_id: string
          grupo_id: string
          id: string
          pedido_id: string
          responsavel_id: string
          responsavel_nome: string
          status: string
          status_visivel: string
          tipo_id: string
          tipo_nome: string
          tipo_slug: string
          total: number
          unidade_id: number
          updated_at: string
        }[]
      }
      atividades_lote_previa: {
        Args: {
          p_recencia_ate?: string
          p_recencia_campo?: string
          p_recencia_de?: string
          p_tag_ids?: string[]
          p_ticket_ate?: string
          p_ticket_de?: string
          p_ticket_escopo?: string
          p_ticket_max?: number
          p_ticket_min?: number
          p_tipos?: string[]
          p_unidade_id: number
        }
        Returns: Json
      }
      atividades_reatribuir: {
        Args: { p_id: string; p_responsavel_id: string }
        Returns: undefined
      }
      atividades_registrar_whatsapp: {
        Args: { p_id: string }
        Returns: undefined
      }
      atividades_resultados: {
        Args: { p_unidade_id?: number }
        Returns: {
          adiadas_7d: number
          adiadas_hoje: number
          adiadas_ontem: number
          chave: string
          concluidas_7d: number
          concluidas_hoje: number
          concluidas_ontem: number
          criadas_7d: number
          criadas_hoje: number
          criadas_ontem: number
          escopo: string
          nome: string
        }[]
      }
      atualizar_ficha: {
        Args: {
          p_data_devolucao?: string
          p_data_festa?: string
          p_data_retirada?: string
          p_detalhes?: Json
          p_ficha_id: string
          p_itens?: Json
          p_pago?: boolean
          p_pedidos?: Json
          p_valor: string
          p_vendedor_id?: string
        }
        Returns: undefined
      }
      atualizar_ultimo_login: { Args: never; Returns: undefined }
      buscar_clientes: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_vendedor_id?: string
        }
        Returns: {
          alterar_nome: boolean | null
          created_at: string
          id: string
          nome: string
          telefone: string | null
          tipo_atendimento: string | null
          unidade_id: number | null
          updated_at: string
          vendedor_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "clientes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      can_access_unidade: {
        Args: { _target_unidade_id: number; _user_id: string }
        Returns: boolean
      }
      clientes_segmento: {
        Args: {
          p_dono_id?: string
          p_recencia_ate?: string
          p_recencia_campo?: string
          p_recencia_de?: string
          p_tag_ids?: string[]
          p_ticket_ate?: string
          p_ticket_de?: string
          p_ticket_escopo?: string
          p_ticket_max?: number
          p_ticket_min?: number
          p_tipos?: string[]
          p_unidade_id: number
        }
        Returns: {
          atendimentos: number
          cliente_id: string
          dono_id: string
          ticket_medio: number
          ultima_venda: string
          ultimo_atendimento: string
          valor_total: number
        }[]
      }
      excluir_ficha: { Args: { p_ficha_id: string }; Returns: undefined }
      funil_etapas_listar: { Args: never; Returns: Json }
      funil_etapas_salvar: {
        Args: {
          p_ativa?: boolean
          p_atividades: Json
          p_desfechos: Json
          p_etapa: number
          p_id: string
          p_rotulo: string
        }
        Returns: string
      }
      funil_vendedores_atribuiveis: {
        Args: { p_unidade_id: number }
        Returns: {
          escopo: string
          id: string
          nome: string
        }[]
      }
      get_clientes: {
        Args: {
          _dir?: string
          _ltv_max?: number
          _ltv_min?: number
          _order_by?: string
          _page?: number
          _search?: string
          _ultima_venda_ate?: string
          _ultima_venda_de?: string
          _unidade_id?: number
          _vendedor_id?: string
        }
        Returns: {
          created_at: string
          id: string
          ltv: number
          nome: string
          nome_vendedor: string
          tags: Json
          telefone: string
          tipo_atendimento: string
          total_count: number
          ultima_venda: string
          unidade_id: number
          unidade_nome: string
          updated_at: string
          vendedor_id: string
        }[]
      }
      get_dashboard_por_unidade: {
        Args: { _data_fim?: string; _data_inicio?: string }
        Returns: {
          ajuste_qtd: number
          ajuste_valor: number
          aluguel_qtd: number
          aluguel_valor: number
          avulsa_qtd: number
          avulsa_valor: number
          sob_medida_qtd: number
          sob_medida_valor: number
          total_fichas: number
          total_provas: number
          total_valor: number
          unidade_id: number
          unidade_nome: string
          venda_qtd: number
          venda_valor: number
        }[]
      }
      get_dashboard_por_vendedor: {
        Args: {
          _data_fim?: string
          _data_inicio?: string
          _unidade_id?: number
        }
        Returns: {
          ajuste_qtd: number
          ajuste_valor: number
          aluguel_qtd: number
          aluguel_valor: number
          avulsa_qtd: number
          avulsa_valor: number
          sob_medida_qtd: number
          sob_medida_valor: number
          total_fichas: number
          total_provas: number
          total_valor: number
          venda_qtd: number
          venda_valor: number
          vendedor_id: string
          vendedor_nome: string
        }[]
      }
      get_dashboard_stats: {
        Args: { _unidade_id?: number }
        Returns: {
          ajuste_mes_atual: number
          ajuste_mes_passado: number
          ajuste_semestre: number
          ajuste_trimestre: number
          aluguel_mes_atual: number
          aluguel_mes_passado: number
          aluguel_semestre: number
          aluguel_trimestre: number
          avulsa_mes_atual: number
          avulsa_mes_passado: number
          avulsa_semestre: number
          avulsa_trimestre: number
          sob_medida_mes_atual: number
          sob_medida_mes_passado: number
          sob_medida_semestre: number
          sob_medida_trimestre: number
          total_mes_atual: number
          total_mes_passado: number
          total_semestre: number
          total_trimestre: number
          venda_mes_atual: number
          venda_mes_passado: number
          venda_semestre: number
          venda_trimestre: number
        }[]
      }
      get_dashboard_totalizadores: {
        Args: { _unidade_id?: number }
        Returns: {
          mes_atual: number
          mes_atual_ant: number
          mes_passado: number
          mes_passado_ant: number
          previsto: number
          semestre: number
          semestre_ant: number
          serie: string
          trimestre: number
          trimestre_ant: number
        }[]
      }
      get_ficha_log: {
        Args: { p_ficha_id: string }
        Returns: {
          acao: string
          alterado_em: string
          alterado_por: string
          alterado_por_nome: string
          diff: Json
          id: string
          origem: string
        }[]
      }
      get_fichas: {
        Args: {
          p_data_fim?: string
          p_data_inicio?: string
          p_dir?: string
          p_order_by?: string
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_tipos?: string[]
          p_unidade_id?: number
        }
        Returns: {
          avulsos: Json
          calca: string
          camisa: string
          camisa_cor: string
          camisa_fios: string
          cliente_id: string
          codigo_ficha: string
          created_at: string
          data_devolucao: string
          data_festa: string
          data_retirada: string
          garantia: string
          id: string
          lanificio_id: string
          lanificio_nome: string
          nome_cliente: string
          pago: boolean
          paleto: string
          paleto_categoria: string
          paleto_cor: string
          paleto_lanificio: string
          pedidos: Json
          provas_count: number
          provas_datas: string[]
          sapato: string
          sapato_tipo: string
          sob_medida: boolean
          status: string
          tipo: string
          total_count: number
          unidade_id: number
          url_bucket: string
          valor: string
          valor_avulsos: number
          vendedor_id: string
          vendedor_nome: string
        }[]
      }
      get_fichas_cliente: {
        Args: { p_cliente_id: string }
        Returns: {
          avulsos: Json
          calca: string
          camisa: string
          camisa_cor: string
          camisa_fios: string
          codigo_ficha: string
          created_at: string
          data_devolucao: string
          data_festa: string
          data_retirada: string
          garantia: string
          id: string
          lanificio_id: string
          lanificio_nome: string
          pago: boolean
          paleto: string
          paleto_categoria: string
          paleto_cor: string
          paleto_lanificio: string
          pedidos: Json
          provas_count: number
          provas_datas: string[]
          sapato: string
          sapato_tipo: string
          sob_medida: boolean
          status: string
          tipo: string
          unidade_id: number
          url_bucket: string
          valor: string
          valor_avulsos: number
          vendedor_id: string
          vendedor_nome: string
        }[]
      }
      get_lancamentos_vendedor: {
        Args: {
          _data_fim?: string
          _data_inicio?: string
          _unidade_id?: number
          _vendedor_id?: string
        }
        Returns: {
          categoria: string
          cliente: string
          codigo_ficha: string
          quando: string
          sob_medida: boolean
          tipo: string
          url_bucket: string
          valor: number
        }[]
      }
      get_relatorio_fichas: {
        Args: {
          _data_fim?: string
          _data_inicio?: string
          _unidade_id?: number
        }
        Returns: {
          calca: string
          camisa: string
          camisa_cor: string
          camisa_fios: string
          created_at: string
          lanificio_id: string
          lanificio_nome: string
          paleto: string
          paleto_categoria: string
          paleto_cor: string
          paleto_lanificio: string
          sapato: string
          sapato_tipo: string
          sob_medida: boolean
          tipo: string
          unidade_id: number
          valor: number
          valor_calca: string
          valor_camisa: string
          valor_paleto: string
          vendedor_id: string
          vendedor_nome: string
        }[]
      }
      get_relatorio_fin_mensal: {
        Args: { _dim?: string; _unidade_id?: number }
        Returns: {
          ano: number
          dim_key: string
          dim_nome: string
          mes: number
          valor: number
        }[]
      }
      get_relatorio_fin_por_dim: {
        Args: {
          _data_fim?: string
          _data_inicio?: string
          _dim?: string
          _unidade_id?: number
        }
        Returns: {
          dim_key: string
          dim_nome: string
          qtd: number
          tipo: string
          valor: number
        }[]
      }
      get_relatorio_fin_por_item: {
        Args: {
          _data_fim?: string
          _data_inicio?: string
          _unidade_id?: number
        }
        Returns: {
          tipo_item: string
          valor: number
        }[]
      }
      get_relatorio_fin_temporal: {
        Args: {
          _data_fim?: string
          _data_inicio?: string
          _dim?: string
          _unidade_id?: number
        }
        Returns: {
          bucket: number
          bucket_tipo: string
          dim_key: string
          valor: number
        }[]
      }
      get_relatorio_itens_avulsos: {
        Args: {
          _data_fim?: string
          _data_inicio?: string
          _unidade_id?: number
        }
        Returns: {
          created_at: string
          pedido_id: string
          quantidade: number
          tipo_item: string
          unidade_id: number
          valor_unitario: number
          vendedor_id: string
        }[]
      }
      get_relatorio_pecas_agg: {
        Args: {
          _data_fim?: string
          _data_inicio?: string
          _unidade_id?: number
        }
        Returns: {
          chave: string
          dimensao: string
          quantidade: number
          sob_medida: boolean
          tipo: string
          valor: number
        }[]
      }
      get_relatorio_pedidos: {
        Args: {
          _data_fim?: string
          _data_inicio?: string
          _unidade_id?: number
        }
        Returns: {
          created_at: string
          id: string
          unidade_id: number
          valor_total: number
          vendedor_id: string
          vendedor_nome: string
        }[]
      }
      get_tags: {
        Args: {
          p_apenas_globais?: boolean
          p_incluir_inativas?: boolean
          p_search?: string
          p_unidade_id?: number
        }
        Returns: {
          ativa: boolean
          categoria: string
          clientes_count: number
          cor: string
          created_at: string
          id: string
          nome: string
          padrao: boolean
          unidade_id: number
          unidade_nome: string
        }[]
      }
      get_ultimo_dia_lancamento: {
        Args: { _unidade_id?: number; _vendedor_nome?: string }
        Returns: string
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
          is_teste: boolean
          is_vendedor_adicional: boolean
          nome: string
          role: string
          ultimo_acesso: string
          unidade_id: number
          unidade_nome: string
        }[]
      }
      get_whatsapp_conversations_by_phone: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_unit_id?: number
        }
        Returns: {
          alterar_nome: boolean
          client_id: string
          group_id: string
          group_name: string
          is_group: boolean
          nome_contato: string
          origem_nome: string
          telefone: string
          tipo_atendimento: string
          total_mensagens: number
          ultima_mensagem: string
          ultima_mensagem_at: string
          unit_id: number
          unread_count: number
        }[]
      }
      get_whatsapp_messages_by_phone: {
        Args: { p_telefone: string }
        Returns: {
          client_id: string
          created_at: string
          created_by_name: string
          from_me: boolean
          group_id: string
          group_name: string
          id: number
          mensagem: string
          push_name: string
          quoted_message_id: number
          sender_name: string
          status: string
          telefone: string
          tipo_mensagem: string
          url_media: string
          wpp_msg_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ind_dias_acesso: {
        Args: { p_ate: string; p_de: string }
        Returns: {
          app: string
          dia: string
          ultimo: string
          user_id: string
        }[]
      }
      is_gestor_ou_acima: { Args: never; Returns: boolean }
      is_master_or_admin: { Args: never; Returns: boolean }
      is_unidade_piloto: { Args: { p_unidade_id: number }; Returns: boolean }
      listar_fichas_processadas: {
        Args: {
          p_data_fim?: string
          p_data_inicio?: string
          p_limit?: number
          p_minhas?: boolean
          p_offset?: number
          p_search?: string
          p_tipos?: string[]
          p_unidade_id?: number
        }
        Returns: {
          calca: string | null
          camisa: string | null
          camisa_cor: string | null
          camisa_fios: string | null
          cliente_encontrado: boolean | null
          cliente_id: string | null
          cliente_sugerido_id: string | null
          cliente_sugerido_nome: string | null
          codigo_ficha: string | null
          created_at: string
          data_devolucao: string | null
          data_festa: string | null
          data_retirada: string | null
          descricao_cliente: string | null
          enviada_whatsapp_geral: boolean
          enviada_whatsapp_venda: boolean
          erro_etapa: string | null
          ficha_original_id: string | null
          garantia: string | null
          id: string
          is_noivo: boolean
          lanificio_id: string | null
          nome_cliente: string | null
          ocr_tentativa: number | null
          pago: boolean
          paleto: string | null
          paleto_categoria: string | null
          paleto_cor: string | null
          paleto_lanificio: string | null
          prova1_data: string | null
          prova1_vendedor_id: string | null
          prova2_data: string | null
          prova2_vendedor_id: string | null
          prova3_data: string | null
          prova3_vendedor_id: string | null
          sapato: string | null
          sapato_tipo: string | null
          sob_medida: boolean
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
          valor_calca: string | null
          valor_camisa: string | null
          valor_paleto: string | null
          vendedor_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "fichas"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      listar_pedidos_avulsos: {
        Args: {
          p_data_fim?: string
          p_data_inicio?: string
          p_limit?: number
          p_minhas?: boolean
          p_offset?: number
          p_search?: string
          p_unidade_id?: number
        }
        Returns: {
          codigo_ficha: string
          created_at: string
          ficha_id: string
          id: string
          nome_cliente: string
          pago: boolean
          valor_total: number
          vendedor_id: string
          vendedor_nome: string
        }[]
      }
      listar_vendedores_unidade: {
        Args: { p_unidade_id: number }
        Returns: {
          id: string
          nome: string
        }[]
      }
      marcar_ficha_paga: { Args: { p_ficha_id: string }; Returns: undefined }
      next_business_time: { Args: { p_ts: string }; Returns: string }
      normalize_phone: { Args: { input: string }; Returns: string }
      oportunidades_criar: {
        Args: {
          p_cliente_id: string
          p_data_evento?: string
          p_responsavel_id?: string
          p_tipo_negociacao?: string
          p_unidade_id?: number
        }
        Returns: string
      }
      oportunidades_detalhe: { Args: { p_id: string }; Returns: Json }
      oportunidades_encerrar: {
        Args: { p_id: string; p_motivo: string }
        Returns: undefined
      }
      oportunidades_listar: {
        Args: {
          p_responsavel_id?: string
          p_status?: string
          p_tipo?: string
          p_unidade_id?: number
        }
        Returns: Json
      }
      oportunidades_mover: {
        Args: {
          p_id: string
          p_obs?: string
          p_para_etapa: number
          p_payload?: Json
        }
        Returns: undefined
      }
      oportunidades_reatribuir: {
        Args: { p_id: string; p_responsavel_id: string }
        Returns: undefined
      }
      parse_valor_ptbr: { Args: { _v: string }; Returns: number }
      parse_valor_to_numeric: { Args: { v: string }; Returns: number }
      precos_estimados_itens_avulsos: {
        Args: never
        Returns: {
          preco: number
          tipo_item: string
        }[]
      }
      relatorio_diario_londrina: {
        Args: never
        Returns: {
          aluguel: number
          avulsas_qtd: number
          avulsas_valor: number
          fichas: number
          nome: string
          provas: number
          total: number
          ultimo_login: string
          venda: number
        }[]
      }
      relatorio_diario_maringa: {
        Args: never
        Returns: {
          aluguel: number
          avulsas_qtd: number
          avulsas_valor: number
          fichas: number
          nome: string
          provas: number
          total: number
          ultimo_login: string
          venda: number
        }[]
      }
      relatorio_fichas_dia_anterior: {
        Args: never
        Returns: {
          nome: string
          total_fichas: number
          ultimo_login: string
        }[]
      }
      relatorio_semanal_londrina: {
        Args: never
        Returns: {
          aluguel: number
          avulsas_qtd: number
          avulsas_valor: number
          fichas: number
          nome: string
          provas: number
          total: number
          ultimo_login: string
          venda: number
        }[]
      }
      relatorio_semanal_maringa: {
        Args: never
        Returns: {
          aluguel: number
          avulsas_qtd: number
          avulsas_valor: number
          fichas: number
          nome: string
          provas: number
          total: number
          ultimo_login: string
          venda: number
        }[]
      }
      sem_acento: { Args: { texto: string }; Returns: string }
      set_user_ativo: {
        Args: { _ativo: boolean; _user_id: string }
        Returns: undefined
      }
      set_user_teste: {
        Args: { _is_teste: boolean; _user_id: string }
        Returns: undefined
      }
      tags_mesclar: {
        Args: { p_destino_id: string; p_origem_ids: string[] }
        Returns: Json
      }
      tipos_atividade_listar: {
        Args: never
        Returns: {
          ativo: boolean
          created_at: string
          exige_cliente: boolean
          id: string
          nome: string
          ordem: number
          permite_avulso: boolean
          slug: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tipos_atividade"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      tipos_atividade_salvar: {
        Args: {
          p_ativo?: boolean
          p_exige_cliente?: boolean
          p_id: string
          p_nome: string
          p_ordem?: number
          p_permite_avulso?: boolean
          p_slug: string
        }
        Returns: string
      }
      title_case_nome: { Args: { p_nome: string }; Returns: string }
      touch_ultimo_acesso: { Args: never; Returns: undefined }
      update_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _unidade_id: number
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
        | "administrativo"
      campanha_midia_tipo: "nenhum" | "imagem" | "video"
      campanha_status: "rascunho" | "em_andamento" | "finalizada" | "cancelada"
      disparo_status: "pendente" | "enviado" | "falhou" | "cancelado"
      status_campanha:
        | "rascunho"
        | "agendada"
        | "em_andamento"
        | "pausada"
        | "concluida"
        | "cancelada"
      status_ficha:
        | "erro"
        | "pendente"
        | "ativa"
        | "baixa"
        | "aguardando_prova"
        | "avulso"
        | "inativa"
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
        "administrativo",
      ],
      campanha_midia_tipo: ["nenhum", "imagem", "video"],
      campanha_status: ["rascunho", "em_andamento", "finalizada", "cancelada"],
      disparo_status: ["pendente", "enviado", "falhou", "cancelado"],
      status_campanha: [
        "rascunho",
        "agendada",
        "em_andamento",
        "pausada",
        "concluida",
        "cancelada",
      ],
      status_ficha: [
        "erro",
        "pendente",
        "ativa",
        "baixa",
        "aguardando_prova",
        "avulso",
        "inativa",
      ],
      tipo_de_atendimento: ["Aluguel", "Venda", "Ajuste"],
      user_role: ["Gestor", "Franqueado", "Vendedor"],
    },
  },
} as const
