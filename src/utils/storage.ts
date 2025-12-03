import { User, Caso, Mensagem, LCoinTransaction } from "@/types";

const KEYS = {
  USERS: "socialjuris_users",
  CURRENT_USER: "socialjuris_user",
  TOKEN: "socialjuris_token",
  CASOS: "socialjuris_casos",
  MENSAGENS: "socialjuris_mensagens",
  TRANSACTIONS: "socialjuris_transactions",
};

// Utility
const generateId = () => Math.random().toString(36).substring(2, 10);

// Initial data
const initializeData = () => {
  const existingUsers = localStorage.getItem(KEYS.USERS);
  if (!existingUsers) {
    const defaultUsers: User[] = [
      {
        id: "user-001",
        nome: "João Silva",
        email: "joao@email.com",
        senha: "Senha123",
        tipo: "cliente",
        whatsapp: "(11) 99999-1234",
        criado_em: "2025-01-01T10:00:00Z",
      },
      {
        id: "user-002",
        nome: "Dr. Maria Santos",
        email: "maria@email.com",
        senha: "Senha123",
        tipo: "advogado",
        oab_numero: "123456",
        oab_estado: "SP",
        oab_status: "verificado",
        saldo_lxc: 500,
        criado_em: "2025-01-01T11:00:00Z",
      },
      {
        id: "user-003",
        nome: "Dr. Carlos Oliveira",
        email: "carlos@email.com",
        senha: "Senha123",
        tipo: "advogado",
        oab_numero: "654321",
        oab_estado: "RJ",
        oab_status: "pendente",
        saldo_lxc: 200,
        criado_em: "2025-01-02T09:00:00Z",
      },
      {
        id: "user-admin",
        nome: "Admin",
        email: "admin@email.com",
        senha: "Admin123",
        tipo: "admin",
        criado_em: "2025-01-01T08:00:00Z",
      },
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers));
  }

  const existingCasos = localStorage.getItem(KEYS.CASOS);
  if (!existingCasos) {
    const defaultCasos: Caso[] = [
      {
        id: "caso-001",
        cliente_id: "user-001",
        cliente_nome: "João Silva",
        cliente_email: "joao@email.com",
        cliente_whatsapp: "(11) 99999-1234",
        advogado_id: "user-002",
        advogado_nome: "Dr. Maria Santos",
        area_juridica: "Trabalhista",
        resumo: "Fui demitido injustamente após 5 anos na empresa. Não recebi as verbas rescisórias corretamente e preciso de orientação sobre meus direitos trabalhistas.",
        status: "em_atendimento",
        criado_em: "2025-01-02T14:30:00Z",
        preco_cents: 1250,
        origem: "Plataforma",
        oab_status: "verificado",
      },
      {
        id: "caso-002",
        cliente_id: "user-001",
        cliente_nome: "João Silva",
        cliente_email: "joao@email.com",
        cliente_whatsapp: "(11) 99999-1234",
        area_juridica: "Família",
        resumo: "Preciso de orientação sobre processo de divórcio e divisão de bens. Temos dois filhos menores.",
        status: "novo",
        criado_em: "2025-01-03T10:00:00Z",
        preco_cents: 1100,
        origem: "Plataforma",
      },
    ];
    localStorage.setItem(KEYS.CASOS, JSON.stringify(defaultCasos));
  }

  const existingMensagens = localStorage.getItem(KEYS.MENSAGENS);
  if (!existingMensagens) {
    const defaultMensagens: Mensagem[] = [
      {
        id: "msg-001",
        caso_id: "caso-001",
        remetente_id: "user-002",
        remetente_nome: "Dr. Maria Santos",
        texto: "Olá João, vi seu caso e posso ajudá-lo. Vamos agendar uma consulta?",
        criado_em: "2025-01-02T15:00:00Z",
        tipo: "texto",
      },
      {
        id: "msg-002",
        caso_id: "caso-001",
        remetente_id: "user-001",
        remetente_nome: "João Silva",
        texto: "Olá Dra. Maria! Sim, estou disponível. Muito obrigado por aceitar meu caso.",
        criado_em: "2025-01-02T15:05:00Z",
        tipo: "texto",
      },
    ];
    localStorage.setItem(KEYS.MENSAGENS, JSON.stringify(defaultMensagens));
  }
};

// Initialize on load
initializeData();

export const Storage = {
  // Users
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User): void => {
    const users = Storage.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  getUserByEmail: (email: string): User | null => {
    const users = Storage.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getUserById: (id: string): User | null => {
    const users = Storage.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  // Current user session
  setCurrentUser: (user: User, token: string): void => {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(KEYS.TOKEN, token);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem(KEYS.TOKEN);
  },

  clearSession: (): void => {
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem(KEYS.TOKEN);
  },

  // Casos
  getCasos: (): Caso[] => {
    const data = localStorage.getItem(KEYS.CASOS);
    return data ? JSON.parse(data) : [];
  },

  saveCaso: (caso: Caso): void => {
    const casos = Storage.getCasos();
    casos.push(caso);
    localStorage.setItem(KEYS.CASOS, JSON.stringify(casos));
  },

  updateCaso: (id: string, updates: Partial<Caso>): void => {
    const casos = Storage.getCasos();
    const index = casos.findIndex((c) => c.id === id);
    if (index >= 0) {
      casos[index] = { ...casos[index], ...updates };
      localStorage.setItem(KEYS.CASOS, JSON.stringify(casos));
    }
  },

  getCasoById: (id: string): Caso | null => {
    const casos = Storage.getCasos();
    return casos.find((c) => c.id === id) || null;
  },

  getCasosByClienteId: (clienteId: string): Caso[] => {
    const casos = Storage.getCasos();
    return casos.filter((c) => c.cliente_id === clienteId);
  },

  getCasosByAdvogadoId: (advogadoId: string): Caso[] => {
    const casos = Storage.getCasos();
    return casos.filter((c) => c.advogado_id === advogadoId);
  },

  getCasosNovos: (): Caso[] => {
    const casos = Storage.getCasos();
    return casos.filter((c) => c.status === "novo");
  },

  // Mensagens
  getMensagens: (casoId: string): Mensagem[] => {
    const data = localStorage.getItem(KEYS.MENSAGENS);
    const all: Mensagem[] = data ? JSON.parse(data) : [];
    return all.filter((m) => m.caso_id === casoId).sort((a, b) => 
      new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
    );
  },

  saveMensagem: (mensagem: Mensagem): void => {
    const data = localStorage.getItem(KEYS.MENSAGENS);
    const all: Mensagem[] = data ? JSON.parse(data) : [];
    all.push(mensagem);
    localStorage.setItem(KEYS.MENSAGENS, JSON.stringify(all));
  },

  // Transactions
  getTransactions: (userId: string): LCoinTransaction[] => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    const all: LCoinTransaction[] = data ? JSON.parse(data) : [];
    return all
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
  },

  saveTransaction: (transaction: LCoinTransaction): void => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    const all: LCoinTransaction[] = data ? JSON.parse(data) : [];
    all.push(transaction);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(all));
  },

  // Helpers
  generateId,
  generateToken: () => `jwt_${generateId()}_${Date.now()}`,
};
