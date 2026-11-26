jest.mock('@db/db', () => ({ tx: jest.fn() }));
jest.mock('@user/repositories', () => ({
  UserRepository: jest.fn(),
  LegalDocumentRepository: jest.fn(),
  UserLegalAcceptanceRepository: jest.fn()
}));

const db = require('@db/db');
const { UserRepository, LegalDocumentRepository, UserLegalAcceptanceRepository } = require('@user/repositories');
const Service = require('../../services/user/LegalAcceptanceService');

const transaction = {};
const firebaseUid = 'AbCdFirebaseUid123';
const usuarioId = 10;
const documents = [
  { documento_legal_id: 12, tipo: 'terminos_condiciones' },
  { documento_legal_id: 35, tipo: 'politica_privacidad' }
];
const ids = [12, 35];
const getActive = jest.fn();
const getPendingByUserId = jest.fn();
const getIdByFirebaseUid = jest.fn();
const create = jest.fn();
const registration = { documentoLegalIds: ids, transaction };
const initial = { ...registration, usuarioId, metodoAceptacion: 'tradicional' };
const pending = { firebaseUid, documentoLegalIds: ids };
const complete = { success: true, aceptaciones_completas: true, documentos_pendientes: [] };

beforeEach(() => {
  jest.resetAllMocks();
  UserRepository.mockImplementation(() => ({ getIdByFirebaseUid }));
  LegalDocumentRepository.mockImplementation(() => ({ getActive, getPendingByUserId }));
  UserLegalAcceptanceRepository.mockImplementation(() => ({ create }));
  db.tx.mockImplementation(async callback => callback(transaction));
  getActive.mockResolvedValue(documents);
  getIdByFirebaseUid.mockResolvedValue(usuarioId);
  getPendingByUserId.mockResolvedValue([]);
  create.mockResolvedValue([{ usuario_aceptacion_legal_id: 1 }]);
});

describe('LegalAcceptanceService', () => {
  describe('getActiveDocuments', () => {
    test('returns both required documents', async () => {
      await expect(Service.getActiveDocuments()).resolves.toEqual(documents);
      expect(getActive).toHaveBeenCalledWith({ transaction: undefined, lock: false });
    });
    test('passes transaction and lock', async () => {
      await Service.getActiveDocuments({ transaction, lock: true });
      expect(getActive).toHaveBeenCalledWith({ transaction, lock: true });
    });
    test.each([
      [[]], [[documents[0]]], [[documents[0], documents[0]]],
      [[...documents, documents[0]]], [[documents[0], { tipo: 'otro' }]]
    ])('rejects invalid active documents %#', async rows => {
      getActive.mockResolvedValue(rows);
      await expect(Service.getActiveDocuments()).rejects.toMatchObject({ statusCode: 503 });
    });
    test('propagates repository errors', async () => {
      const error = new Error('DB error');
      getActive.mockRejectedValue(error);
      await expect(Service.getActiveDocuments()).rejects.toBe(error);
    });
  });
  describe('validateDocumentIds', () => {
    test.each([[[12]], [[12, 35]]])('accepts valid IDs %#', value => {
      expect(() => Service.validateDocumentIds(value)).not.toThrow();
    });
    test.each([undefined, null, 12, [], [1, 2, 3], [1, 1], [0], [-1], [1.5], ['1'], [NaN], [Infinity], [Number.MAX_SAFE_INTEGER + 1]].map(value => [value]))('rejects invalid IDs %#', value => {
      try { Service.validateDocumentIds(value); } catch (error) {
        expect(error).toMatchObject({ statusCode: 400 });
        return;
      }
      throw new Error('Expected invalid IDs to be rejected');
    });
  });
  describe('validateFirebaseUid', () => {
    test.each([firebaseUid, 'a'.repeat(128)])('accepts valid UID %#', value => {
      expect(() => Service.validateFirebaseUid(value)).not.toThrow();
    });
    test.each([undefined, null, 123, '', '   ', 'a'.repeat(129)])('rejects invalid UID %#', value => {
      try { Service.validateFirebaseUid(value); } catch (error) {
        expect(error).toMatchObject({ statusCode: 401 });
        return;
      }
      throw new Error('Expected invalid UID to be rejected');
    });
  });
  describe('validateRegistrationDocuments', () => {
    test.each([[ids], [[35, 12]]])('accepts all current IDs %#', async documentoLegalIds => {
      await expect(Service.validateRegistrationDocuments({ documentoLegalIds, transaction })).resolves.toEqual(documents);
      expect(getActive).toHaveBeenCalledWith({ transaction, lock: true });
    });
    test('requires transaction', async () => {
      await expect(Service.validateRegistrationDocuments({ documentoLegalIds: ids })).rejects.toThrow('Se requiere una transacción');
      expect(getActive).not.toHaveBeenCalled();
    });
    test.each([[[12]], [[1, 2]], [[12, 99]]])('rejects incomplete or stale IDs %#', async documentoLegalIds => {
      await expect(Service.validateRegistrationDocuments({ documentoLegalIds, transaction })).rejects.toMatchObject({ statusCode: 409 });
    });
    test('rejects duplicate IDs before querying', async () => {
      await expect(Service.validateRegistrationDocuments({ ...registration, documentoLegalIds: [12, 12] })).rejects.toMatchObject({ statusCode: 400 });
      expect(getActive).not.toHaveBeenCalled();
    });
  });
  describe('registerInitialAcceptances', () => {
    test.each(['tradicional', 'google'])('registers both documents using %s', async metodoAceptacion => {
      await Service.registerInitialAcceptances({ ...initial, metodoAceptacion });
      expect(create).toHaveBeenCalledTimes(2);
      ids.forEach((documentoLegalId, i) => expect(create).toHaveBeenNthCalledWith(i + 1, { usuarioId, documentoLegalId, metodoAceptacion, transaction }));
    });
    test('requires transaction', async () => {
      await expect(Service.registerInitialAcceptances({ ...initial, transaction: undefined })).rejects.toThrow('Se requiere una transacción');
      expect(create).not.toHaveBeenCalled();
    });
    test.each([0, -1, 1.5, '10', Number.MAX_SAFE_INTEGER + 1])('rejects invalid user ID %#', async usuarioId => {
      await expect(Service.registerInitialAcceptances({ ...initial, usuarioId })).rejects.toThrow('Identificador de usuario no válido');
      expect(create).not.toHaveBeenCalled();
    });
    test.each(['actualizacion', 'migracion_dev', undefined])('rejects invalid initial method %#', async metodoAceptacion => {
      await expect(Service.registerInitialAcceptances({ ...initial, metodoAceptacion })).rejects.toThrow('Método de registro no válido');
      expect(create).not.toHaveBeenCalled();
    });
    test('rejects stale documents without inserting', async () => {
      await expect(Service.registerInitialAcceptances({ ...initial, documentoLegalIds: [1, 2] })).rejects.toMatchObject({ statusCode: 409 });
      expect(create).not.toHaveBeenCalled();
    });
    test.each([[], [{}, {}]].map(rows => [rows]))('rejects unexpected insertion result %#', async rows => {
      create.mockResolvedValue(rows);
      await expect(Service.registerInitialAcceptances(initial)).rejects.toMatchObject({ statusCode: 409 });
      expect(create).toHaveBeenCalledTimes(1);
    });
    test('propagates failure of second insertion', async () => {
      const error = new Error('Second insert failed');
      create.mockResolvedValueOnce([{}]).mockRejectedValueOnce(error);
      await expect(Service.registerInitialAcceptances(initial)).rejects.toBe(error);
      expect(create).toHaveBeenCalledTimes(2);
    });
  });
  describe('getPendingAcceptances', () => {
    test.each([[[]], [[documents[0]]], [documents]])('returns pending state %#', async rows => {
      getPendingByUserId.mockResolvedValue(rows);
      await expect(Service.getPendingAcceptances({ firebaseUid })).resolves.toEqual({ success: true, aceptaciones_completas: rows.length === 0, documentos_pendientes: rows });
      expect(db.tx).toHaveBeenCalledTimes(1);
      expect(getIdByFirebaseUid).toHaveBeenCalledWith({ firebaseUid, transaction });
      expect(getActive).toHaveBeenCalledWith({ transaction, lock: true });
      expect(getPendingByUserId).toHaveBeenCalledWith({ usuarioId, transaction });
      expect(create).not.toHaveBeenCalled();
    });
    test('rejects invalid UID before transaction', async () => {
      await expect(Service.getPendingAcceptances({ firebaseUid: '' })).rejects.toMatchObject({ statusCode: 401 });
      expect(db.tx).not.toHaveBeenCalled();
    });
    test('rejects unknown user', async () => {
      getIdByFirebaseUid.mockResolvedValue(null);
      await expect(Service.getPendingAcceptances({ firebaseUid })).rejects.toMatchObject({ statusCode: 404 });
      expect(getActive).not.toHaveBeenCalled();
    });
    test('rejects unavailable documents', async () => {
      getActive.mockResolvedValue([]);
      await expect(Service.getPendingAcceptances({ firebaseUid })).rejects.toMatchObject({ statusCode: 503 });
      expect(getPendingByUserId).not.toHaveBeenCalled();
    });
  });
  describe('registerPendingAcceptances', () => {
    test.each([[ids, documents], [[35], [documents[1]]]])('registers all pending documents %#', async (documentoLegalIds, rows) => {
      getPendingByUserId.mockResolvedValueOnce(rows).mockResolvedValueOnce([]);
      await expect(Service.registerPendingAcceptances({ firebaseUid, documentoLegalIds })).resolves.toEqual(complete);
      expect(db.tx).toHaveBeenCalledTimes(1);
      expect(getIdByFirebaseUid).toHaveBeenCalledWith({ firebaseUid, transaction });
      expect(getActive).toHaveBeenCalledWith({ transaction, lock: true });
      expect(create).toHaveBeenCalledTimes(documentoLegalIds.length);
      documentoLegalIds.forEach((documentoLegalId, i) => expect(create).toHaveBeenNthCalledWith(i + 1, { usuarioId, documentoLegalId, metodoAceptacion: 'actualizacion', transaction }));
      expect(getPendingByUserId).toHaveBeenCalledTimes(2);
      expect(getPendingByUserId).toHaveBeenNthCalledWith(2, { usuarioId, transaction });
    });
    test('accepts repeated request with no new rows', async () => {
      create.mockResolvedValue([]);
      await expect(Service.registerPendingAcceptances(pending)).resolves.toEqual(complete);
      expect(create).toHaveBeenCalledTimes(2);
    });
    test('rejects invalid UID before transaction', async () => {
      await expect(Service.registerPendingAcceptances({ ...pending, firebaseUid: '' })).rejects.toMatchObject({ statusCode: 401 });
      expect(db.tx).not.toHaveBeenCalled();
    });
    test('rejects duplicate IDs before transaction', async () => {
      await expect(Service.registerPendingAcceptances({ ...pending, documentoLegalIds: [12, 12] })).rejects.toMatchObject({ statusCode: 400 });
      expect(db.tx).not.toHaveBeenCalled();
    });
    test('rejects unknown user', async () => {
      getIdByFirebaseUid.mockResolvedValue(null);
      await expect(Service.registerPendingAcceptances(pending)).rejects.toMatchObject({ statusCode: 404 });
      expect(create).not.toHaveBeenCalled();
    });
    test('rejects unavailable documents', async () => {
      getActive.mockResolvedValue([]);
      await expect(Service.registerPendingAcceptances(pending)).rejects.toMatchObject({ statusCode: 503 });
      expect(create).not.toHaveBeenCalled();
    });
    test('rejects stale IDs', async () => {
      await expect(Service.registerPendingAcceptances({ ...pending, documentoLegalIds: [1, 2] })).rejects.toMatchObject({ statusCode: 409, message: 'Los documentos legales vigentes han cambiado' });
      expect(getPendingByUserId).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
    });
    test('rejects incomplete acceptance', async () => {
      getPendingByUserId.mockResolvedValue(documents);
      await expect(Service.registerPendingAcceptances({ ...pending, documentoLegalIds: [12] })).rejects.toMatchObject({ statusCode: 409, message: 'Debe aceptar todos los documentos legales pendientes' });
      expect(create).not.toHaveBeenCalled();
    });
    test('rejects when documents remain pending after insertion', async () => {
      getPendingByUserId.mockResolvedValueOnce(documents).mockResolvedValueOnce([documents[1]]);
      await expect(Service.registerPendingAcceptances(pending)).rejects.toMatchObject({ statusCode: 409, message: 'Existen documentos legales pendientes de aceptación' });
      expect(create).toHaveBeenCalledTimes(2);
    });
    test('propagates insertion failure without reporting success', async () => {
      const error = new Error('Insert failed');
      getPendingByUserId.mockResolvedValueOnce(documents);
      create.mockResolvedValueOnce([{}]).mockRejectedValueOnce(error);
      await expect(Service.registerPendingAcceptances(pending)).rejects.toBe(error);
      expect(getPendingByUserId).toHaveBeenCalledTimes(1);
    });
  });
});
