/**
 * Mock do Supabase para testes
 * Este mock simula o comportamento do Supabase sem conectar ao serviço real
 */

const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
       { id: 'test-user-id', email: 'test@example.com' },
      error: null,
    }),
    admin: {
      getUserById: jest.fn().mockResolvedValue({
         { id: 'test-user-id', email: 'test@example.com' },
        error: null,
      }),
      createUser: jest.fn().mockResolvedValue({
         { id: 'new-user-id' },
        error: null,
      }),
    },
    getSession: jest.fn().mockResolvedValue({
       {
        access_token: 'mock-token',
        user: { id: 'test-user-id', email: 'test@example.com' },
      },
      error: null,
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
       {
        session: {
          access_token: 'mock-token',
          user: { id: 'test-user-id' },
        },
      },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
  from: jest.fn((table) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
       { id: 'test-id', [table]: 'test-data' },
      error: null,
    }),
    limit: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  })),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({
         { path: 'test-path' },
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
         { publicUrl: 'https://mock-url.com/test' },
      }),
    }),
  },
};

module.exports = {
  createClient: jest.fn(() => mockSupabase),
  mockSupabase,
};
