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
      ai_analyses: {
        Row: {
          advogado_id: string
          analise: string | null
          created_at: string | null
          documento_nome: string | null
          documento_url: string | null
          id: string
          processo_id: string | null
          tipo_analise: string
        }
        Insert: {
          advogado_id: string
          analise?: string | null
          created_at?: string | null
          documento_nome?: string | null
          documento_url?: string | null
          id?: string
          processo_id?: string | null
          tipo_analise: string
        }
        Update: {
          advogado_id?: string
          analise?: string | null
          created_at?: string | null
          documento_nome?: string | null
          documento_url?: string | null
          id?: string
          processo_id?: string | null
          tipo_analise?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analyses_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_clients: {
        Row: {
          advogado_id: string
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          estado_civil: string | null
          id: string
          nome: string
          observacoes: string | null
          profissao: string | null
          rg: string | null
          telefone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          advogado_id: string
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          advogado_id?: string
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_clients_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lcoin_transactions: {
        Row: {
          advogado_id: string
          created_at: string | null
          descricao: string
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          advogado_id: string
          created_at?: string | null
          descricao: string
          id?: string
          tipo: string
          valor: number
        }
        Update: {
          advogado_id?: string
          created_at?: string | null
          descricao?: string
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lcoin_transactions_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_appointments: {
        Row: {
          advogado_id: string
          cliente_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          lembrete_enviado: boolean | null
          local: string | null
          processo_id: string | null
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          advogado_id: string
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          lembrete_enviado?: boolean | null
          local?: string | null
          processo_id?: string | null
          tipo?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          advogado_id?: string
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          lembrete_enviado?: boolean | null
          local?: string | null
          processo_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_appointments_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_appointments_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "lawyer_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_appointments_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_calculations: {
        Row: {
          advogado_id: string
          created_at: string | null
          dados_entrada: Json | null
          id: string
          processo_id: string | null
          resultado: Json | null
          tipo_calculo: string
          titulo: string
        }
        Insert: {
          advogado_id: string
          created_at?: string | null
          dados_entrada?: Json | null
          id?: string
          processo_id?: string | null
          resultado?: Json | null
          tipo_calculo: string
          titulo: string
        }
        Update: {
          advogado_id?: string
          created_at?: string | null
          dados_entrada?: Json | null
          id?: string
          processo_id?: string | null
          resultado?: Json | null
          tipo_calculo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_calculations_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_calculations_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          advogado_id: string
          cliente_id: string | null
          conteudo: string | null
          created_at: string | null
          id: string
          processo_id: string | null
          tipo_documento: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          advogado_id: string
          cliente_id?: string | null
          conteudo?: string | null
          created_at?: string | null
          id?: string
          processo_id?: string | null
          tipo_documento: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          advogado_id?: string
          cliente_id?: string | null
          conteudo?: string | null
          created_at?: string | null
          id?: string
          processo_id?: string | null
          tipo_documento?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "lawyer_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_deadlines: {
        Row: {
          advogado_id: string
          alerta_enviado: boolean | null
          concluido: boolean | null
          created_at: string | null
          data_prazo: string
          descricao: string | null
          id: string
          processo_id: string
          titulo: string
        }
        Insert: {
          advogado_id: string
          alerta_enviado?: boolean | null
          concluido?: boolean | null
          created_at?: string | null
          data_prazo: string
          descricao?: string | null
          id?: string
          processo_id: string
          titulo: string
        }
        Update: {
          advogado_id?: string
          alerta_enviado?: boolean | null
          concluido?: boolean | null
          created_at?: string | null
          data_prazo?: string
          descricao?: string | null
          id?: string
          processo_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_deadlines_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_deadlines_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          advogado_id: string
          cliente_id: string | null
          comarca: string | null
          created_at: string | null
          descricao: string | null
          estado: string | null
          id: string
          numero_processo: string | null
          parte_contraria: string | null
          status: string | null
          tipo_acao: string
          updated_at: string | null
          valor_causa: number | null
          vara: string | null
        }
        Insert: {
          advogado_id: string
          cliente_id?: string | null
          comarca?: string | null
          created_at?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          numero_processo?: string | null
          parte_contraria?: string | null
          status?: string | null
          tipo_acao: string
          updated_at?: string | null
          valor_causa?: number | null
          vara?: string | null
        }
        Update: {
          advogado_id?: string
          cliente_id?: string | null
          comarca?: string | null
          created_at?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          numero_processo?: string | null
          parte_contraria?: string | null
          status?: string | null
          tipo_acao?: string
          updated_at?: string | null
          valor_causa?: number | null
          vara?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processes_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "lawyer_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome: string
          oab_numero: string | null
          oab_status: string | null
          premium_ativo: boolean | null
          saldo_lcoin: number | null
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nome: string
          oab_numero?: string | null
          oab_status?: string | null
          premium_ativo?: boolean | null
          saldo_lcoin?: number | null
          tipo?: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          oab_numero?: string | null
          oab_status?: string | null
          premium_ativo?: boolean | null
          saldo_lcoin?: number | null
          tipo?: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      user_type: "cliente" | "advogado" | "admin"
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
      user_type: ["cliente", "advogado", "admin"],
    },
  },
} as const
