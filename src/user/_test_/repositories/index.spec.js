
describe('repositories/index user', () => {
  test('exporta UserRepository, UserMedalLeageRepository y UserPackageRepository', () => {
    const R = require('../../repositories');

    expect(R).toHaveProperty('UserRepository');
    expect(R).toHaveProperty('UserMedalLeageRepository');
    expect(R).toHaveProperty('UserPackageRepository');
  });

  test('exporta LegalDocumentRepository', () => {
    const R = require('../../repositories');

    expect(R).toHaveProperty('LegalDocumentRepository');
  });

  test('exporta UserLegalAcceptanceRepository', () => {
    const R = require('../../repositories');

    expect(R).toHaveProperty('UserLegalAcceptanceRepository');
  });

  test('exporta las referencias correctas de los repositorios existentes', () => {
    const R = require('../../repositories');

    const UserRepository = require(
      '../../repositories/UserRepository'
    );

    const UserMedalLeageRepository = require(
      '../../repositories/UserMedalLeageRepository'
    );

    const UserPackageRepository = require(
      '../../repositories/UserPackageRepository'
    );

    expect(R.UserRepository).toBe(
      UserRepository
    );

    expect(R.UserMedalLeageRepository).toBe(
      UserMedalLeageRepository
    );

    expect(R.UserPackageRepository).toBe(
      UserPackageRepository
    );
  });

  test('exporta las referencias correctas de los repositorios legales', () => {
    const R = require('../../repositories');

    const LegalDocumentRepository = require(
      '../../repositories/LegalDocumentRepository'
    );

    const UserLegalAcceptanceRepository = require(
      '../../repositories/UserLegalAcceptanceRepository'
    );

    expect(R.LegalDocumentRepository).toBe(
      LegalDocumentRepository
    );

    expect(R.UserLegalAcceptanceRepository).toBe(
      UserLegalAcceptanceRepository
    );
  });
});
