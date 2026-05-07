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
      campanha_tags: {
        Row: {
          campanha_id: string
          tag_id: string
        }
        Insert: {
          campanha_id: string
          tag_id: string
        }
        Update: {
          campanha_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanha_tags_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          created_at: string
          criado_por: string
          data_fim: string
          data_inicio: string
          finalizada_em: string | null
          id: string
          iniciada_em: string | null
          intervalo_envio_minutos: number
          janela_atribuicao_dias: number
          midia_tipo: Database["public"]["Enums"]["campanha_midia_tipo"]
          midia_url: string | null
          nome: string
          publico_estimado: number | null
          status: Database["public"]["Enums"]["campanha_status"]
          tags_modo: Database["public"]["Enums"]["campanha_tags_modo"]
          texto: string
          unidade_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          data_fim: string
          data_inicio?: string
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string | null
          intervalo_envio_minutos?: number
          janela_atribuicao_dias?: number
          midia_tipo?: Database["public"]["Enums"]["campanha_midia_tipo"]
          midia_url?: string | null
          nome: string
          publico_estimado?: number | null
          status?: Database["public"]["Enums"]["campanha_status"]
          tags_modo?: Database["public"]["Enums"]["campanha_tags_modo"]
          texto: string
          unidade_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          data_fim?: string
          data_inicio?: string
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string | null
          intervalo_envio_minutos?: number
          janela_atribuicao_dias?: number
          midia_tipo?: Database["public"]["Enums"]["campanha_midia_tipo"]
          midia_url?: string | null
          nome?: string
          publico_estimado?: number | null
          status?: Database["public"]["Enums"]["campanha_status"]
          tags_modo?: Database["public"]["Enums"]["campanha_tags_modo"]
          texto?: string
          unidade_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_unidade_id_fkey"
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
      disparos: {
        Row: {
          agendado_para: string
          campanha_id: string
          cliente_id: string
          created_at: string
          enviado_em: string | null
          erro: string | null
          id: string
          status: Database["public"]["Enums"]["disparo_status"]
          wpp_msg_id: string | null
        }
        Insert: {
          agendado_para: string
          campanha_id: string
          cliente_id: string
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          status?: Database["public"]["Enums"]["disparo_status"]
          wpp_msg_id?: string | null
        }
        Update: {
          agendado_para?: string
          campanha_id?: string
          cliente_id?: string
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          status?: Database["public"]["Enums"]["disparo_status"]
          wpp_msg_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disparos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disparos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas: {
        Row: {
          calca: string | null
          camisa: string | null
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
          nome_cliente: string | null
          ocr_tentativa: number | null
          pago: boolean
          paleto: string | null
          prova1_data: string | null
          prova1_vendedor_id: string | null
          prova2_data: string | null
          prova2_vendedor_id: string | null
          prova3_data: string | null
          prova3_vendedor_id: string | null
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
          valor: string | null
          valor_calca: string | null
          valor_camisa: string | null
          valor_paleto: string | null
          vendedor_id: string | null
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
          enviada_whatsapp_geral?: boolean
          enviada_whatsapp_venda?: boolean
          erro_etapa?: string | null
          ficha_original_id?: string | null
          garantia?: string | null
          id?: string
          nome_cliente?: string | null
          ocr_tentativa?: number | null
          pago?: boolean
          paleto?: string | null
          prova1_data?: string | null
          prova1_vendedor_id?: string | null
          prova2_data?: string | null
          prova2_vendedor_id?: string | null
          prova3_data?: string | null
          prova3_vendedor_id?: string | null
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
          valor?: string | null
          valor_calca?: string | null
          valor_camisa?: string | null
          valor_paleto?: string | null
          vendedor_id?: string | null
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
          enviada_whatsapp_geral?: boolean
          enviada_whatsapp_venda?: boolean
          erro_etapa?: string | null
          ficha_original_id?: string | null
          garantia?: string | null
          id?: string
          nome_cliente?: string | null
          ocr_tentativa?: number | null
          pago?: boolean
          paleto?: string | null
          prova1_data?: string | null
          prova1_vendedor_id?: string | null
          prova2_data?: string | null
          prova2_vendedor_id?: string | null
          prova3_data?: string | null
          prova3_vendedor_id?: string | null
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
          valor?: string | null
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
            foreignKeyName: "fichas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
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
      provas: {
        Row: {
          created_at: string
          ficha_id: string
          id: string
          unidade_id: number | null
          vendedor_id: string
        }
        Insert: {
          created_at?: string
          ficha_id: string
          id?: string
          unidade_id?: number | null
          vendedor_id: string
        }
        Update: {
          created_at?: string
          ficha_id?: string
          id?: string
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
          nome: string
          unidade_id: number | null
        }
        Insert: {
          ativa?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome: string
          unidade_id?: number | null
        }
        Update: {
          ativa?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string
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
      vendas_atribuidas: {
        Row: {
          campanha_id: string
          created_at: string
          dias_ate_conversao: number
          disparo_em: string
          disparo_id: string
          ficha_id: string
          venda_em: string
        }
        Insert: {
          campanha_id: string
          created_at?: string
          dias_ate_conversao: number
          disparo_em: string
          disparo_id: string
          ficha_id: string
          venda_em: string
        }
        Update: {
          campanha_id?: string
          created_at?: string
          dias_ate_conversao?: number
          disparo_em?: string
          disparo_id?: string
          ficha_id?: string
          venda_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_atribuidas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_atribuidas_disparo_id_fkey"
            columns: ["disparo_id"]
            isOneToOne: false
            referencedRelation: "disparos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_atribuidas_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_avulsas: {
        Row: {
          created_at: string
          descricao: string | null
          ficha_id: string
          id: string
          pago: boolean
          unidade_id: number | null
          valor: number | null
          vendedor_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          ficha_id: string
          id?: string
          pago?: boolean
          unidade_id?: number | null
          valor?: number | null
          vendedor_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          ficha_id?: string
          id?: string
          pago?: boolean
          unidade_id?: number | null
          valor?: number | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_avulsas_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_avulsas_unidade_id_fkey"
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
      atribuir_venda_campanhas: {
        Args: { _ficha_id: string }
        Returns: undefined
      }
      atualizar_ultimo_login: { Args: never; Returns: undefined }
      buscar_clientes: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
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
      cancelar_campanha: { Args: { p_campanha_id: string }; Returns: undefined }
      estimar_publico_campanha: {
        Args: {
          p_tag_ids: string[]
          p_tags_modo: Database["public"]["Enums"]["campanha_tags_modo"]
          p_unidade_id: number
        }
        Returns: number
      }
      get_clientes:
        | {
            Args: { _page?: number; _search?: string; _unidade_id?: number }
            Returns: {
              created_at: string
              id: string
              ltv: number
              nome: string
              nome_vendedor: string
              telefone: string
              total_count: number
              unidade_id: number
              unidade_nome: string
              updated_at: string
              vendedor_id: string
            }[]
          }
        | {
            Args: {
              _page?: number
              _search?: string
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
              unidade_id: number
              unidade_nome: string
              updated_at: string
              vendedor_id: string
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
          total_fichas: number
          total_provas: number
          total_valor: number
          venda_qtd: number
          venda_valor: number
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
      get_tags: {
        Args: {
          p_apenas_globais?: boolean
          p_incluir_inativas?: boolean
          p_search?: string
          p_unidade_id?: number
        }
        Returns: {
          ativa: boolean
          clientes_count: number
          cor: string
          created_at: string
          id: string
          nome: string
          unidade_id: number
          unidade_nome: string
        }[]
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
      iniciar_campanha: {
        Args: { p_campanha_id: string }
        Returns: {
          agendado_ate: string
          campanha_id: string
          publico_estimado: number
          status: Database["public"]["Enums"]["campanha_status"]
        }[]
      }
      is_master_or_admin: { Args: never; Returns: boolean }
      listar_fichas_processadas: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          calca: string | null
          camisa: string | null
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
          nome_cliente: string | null
          ocr_tentativa: number | null
          pago: boolean
          paleto: string | null
          prova1_data: string | null
          prova1_vendedor_id: string | null
          prova2_data: string | null
          prova2_vendedor_id: string | null
          prova3_data: string | null
          prova3_vendedor_id: string | null
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
          valor: string | null
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
      normalize_phone: { Args: { input: string }; Returns: string }
      parse_valor_to_numeric: { Args: { v: string }; Returns: number }
      reagendar_disparos_campanha: {
        Args: { p_campanha_id: string }
        Returns: number
      }
      remove_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      set_user_ativo: {
        Args: { _ativo: boolean; _user_id: string }
        Returns: undefined
      }
      update_user_role:
        | {
            Args: {
              _new_role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: undefined
          }
        | {
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
        | "suporte"
      campanha_midia_tipo: "nenhum" | "imagem" | "video"
      campanha_status: "rascunho" | "em_andamento" | "finalizada" | "cancelada"
      campanha_tags_modo: "any" | "all"
      disparo_status: "pendente" | "enviado" | "falhou" | "cancelado"
      status_campanha:
        | "rascunho"
        | "agendada"
        | "em_andamento"
        | "pausada"
        | "concluida"
        | "cancelada"
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
      campanha_midia_tipo: ["nenhum", "imagem", "video"],
      campanha_status: ["rascunho", "em_andamento", "finalizada", "cancelada"],
      campanha_tags_modo: ["any", "all"],
      disparo_status: ["pendente", "enviado", "falhou", "cancelado"],
      status_campanha: [
        "rascunho",
        "agendada",
        "em_andamento",
        "pausada",
        "concluida",
        "cancelada",
      ],
      status_ficha: ["erro", "pendente", "ativa", "baixa", "aguardando_prova"],
      tipo_de_atendimento: ["Aluguel", "Venda", "Ajuste"],
      user_role: ["Gestor", "Franqueado", "Vendedor"],
    },
  },
} as const
