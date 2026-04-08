export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FichaStatus = "pendente" | "ativa" | "baixa" | "erro";
export type FichaTipo = "aluguel" | "venda" | "ajuste";
export type AppRole = "admin" | "master" | "franqueado" | "gestor" | "vendedor";

export interface Database {
  public: {
    Tables: {
      fichas: {
        Row: {
          id: string;
          codigo_ficha: string | null;
          tipo: FichaTipo | null;
          status: FichaStatus;
          cliente_id: string | null;
          nome_cliente: string | null;
          telefone_cliente: string | null;
          vendedor_id: string;
          unidade_id: number | null;
          data_retirada: string | null;
          data_devolucao: string | null;
          data_festa: string | null;
          paleto: string | null;
          calca: string | null;
          camisa: string | null;
          sapato: string | null;
          valor: number | null;
          valor_paleto: number | null;
          valor_calca: number | null;
          valor_camisa: number | null;
          garantia: number | null;
          pago: boolean | null;
          url_bucket: string | null;
          url_audio: string | null;
          descricao_cliente: string | null;
          transcricao_audio: string | null;
          tempo_processamento: number | null;
          ocr_tentativa: number | null;
          erro_etapa: string | null;
          cliente_encontrado: boolean | null;
          cliente_sugerido_id: string | null;
          cliente_sugerido_nome: string | null;
          enviada_whatsapp_geral: boolean | null;
          enviada_whatsapp_venda: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["fichas"]["Row"]> & {
          vendedor_id: string;
          status: FichaStatus;
        };
        Update: Partial<Database["public"]["Tables"]["fichas"]["Row"]>;
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          telefone: string;
          vendedor_id: string | null;
          unidade_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          nome: string;
          telefone: string;
          vendedor_id?: string;
          unidade_id?: number;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          avatar_url: string | null;
          unidade_id: string | null;
          ativo: boolean | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      usuario_unidade_role: {
        Row: {
          id: number;
          user_id: string;
          unidade_id: number;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          unidade_id: number;
          role: AppRole;
        };
        Update: Partial<Database["public"]["Tables"]["usuario_unidade_role"]["Row"]>;
      };
      unidades: {
        Row: {
          id: number;
          nome: string;
          cnpj: string | null;
          endereco: string | null;
          cidade: string | null;
          estado: string | null;
          cep: string | null;
          telefone: string | null;
          numero_whatsapp_padrao: string | null;
          ativa: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { nome: string };
        Update: Partial<Database["public"]["Tables"]["unidades"]["Row"]>;
      };
      tags: {
        Row: { id: string; nome: string };
        Insert: { nome: string };
        Update: { nome?: string };
      };
      relacao_cliente_tag: {
        Row: { id: string; cliente_id: string; id_tag: string };
        Insert: { cliente_id: string; id_tag: string };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
    };
  };
}

export type Ficha = Database["public"]["Tables"]["fichas"]["Row"];
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Unidade = Database["public"]["Tables"]["unidades"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type UsuarioUnidadeRole = Database["public"]["Tables"]["usuario_unidade_role"]["Row"];
