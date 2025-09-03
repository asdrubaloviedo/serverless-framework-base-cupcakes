// Mock global para cualquier require('@db/db')
jest.mock('@db/db', () => {
  const mockDb = {
    any: jest.fn(),
    query: jest.fn(),
    one: jest.fn(),
    oneOrNone: jest.fn(),
    none: jest.fn()
  };
  return mockDb;
}, { virtual: true });
