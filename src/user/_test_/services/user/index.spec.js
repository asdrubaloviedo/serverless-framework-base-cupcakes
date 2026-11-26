/*
 * =========================================================
 * MOCKS
 * =========================================================
 *
 * El objetivo de este test es comprobar que los getters
 * lazy del index exportan el servicio correspondiente.
 *
 * No necesitamos cargar las implementaciones reales porque
 * algunas de ellas inicializan dependencias pesadas como:
 *
 * - Firebase Admin
 * - AWS SDK
 * - PostgreSQL
 *
 * También comprobamos que importar el index no provoque
 * la carga anticipada de los servicios.
 */

jest.mock(
  '@user/services/user/CreateOneUser',
  () => class CreateOneUser {}
);

jest.mock(
  '@user/services/user/GetUserProfile',
  () => class GetUserProfile {}
);

jest.mock(
  '@user/services/user/UpdateOneUser',
  () => class UpdateOneUser {}
);

jest.mock(
  '@user/services/user/GetUserPreferences',
  () => class GetUserPreferences {}
);

jest.mock(
  '@user/services/user/UpdateUserPreferences',
  () => class UpdateUserPreferences {}
);

jest.mock(
  '@user/services/user/GeneratePasswordResetLink',
  () => class GeneratePasswordResetLink {}
);

jest.mock(
  '@user/services/user/SendPasswordResetEmail',
  () => class SendPasswordResetEmail {}
);

jest.mock(
  '@user/services/user/GoogleAuthUser',
  () => class GoogleAuthUser {}
);

jest.mock(
  '@user/services/user/GetActiveLegalDocuments',
  () => class GetActiveLegalDocuments {}
);

jest.mock(
  '@user/services/user/GetPendingLegalAcceptances',
  () => class GetPendingLegalAcceptances {}
);

jest.mock(
  '@user/services/user/RegisterLegalAcceptances',
  () => class RegisterLegalAcceptances {}
);


/*
 * El index se requiere después de declarar todos los mocks.
 */

const services = require('@user/services/user');


const expectedServiceNames = [
  'GoogleAuthUser',
  'CreateOneUser',
  'GetUserProfile',
  'UpdateOneUser',
  'GetUserPreferences',
  'UpdateUserPreferences',
  'GeneratePasswordResetLink',
  'SendPasswordResetEmail',
  'GetActiveLegalDocuments',
  'GetPendingLegalAcceptances',
  'RegisterLegalAcceptances'
];


const serviceModules = [
  [
    'GoogleAuthUser',
    '@user/services/user/GoogleAuthUser'
  ],
  [
    'CreateOneUser',
    '@user/services/user/CreateOneUser'
  ],
  [
    'GetUserProfile',
    '@user/services/user/GetUserProfile'
  ],
  [
    'UpdateOneUser',
    '@user/services/user/UpdateOneUser'
  ],
  [
    'GetUserPreferences',
    '@user/services/user/GetUserPreferences'
  ],
  [
    'UpdateUserPreferences',
    '@user/services/user/UpdateUserPreferences'
  ],
  [
    'GeneratePasswordResetLink',
    '@user/services/user/GeneratePasswordResetLink'
  ],
  [
    'SendPasswordResetEmail',
    '@user/services/user/SendPasswordResetEmail'
  ],
  [
    'GetActiveLegalDocuments',
    '@user/services/user/GetActiveLegalDocuments'
  ],
  [
    'GetPendingLegalAcceptances',
    '@user/services/user/GetPendingLegalAcceptances'
  ],
  [
    'RegisterLegalAcceptances',
    '@user/services/user/RegisterLegalAcceptances'
  ]
];


describe('services/user/index', () => {

  /*
   * =======================================================
   * EXPORTACIONES EXISTENTES
   * =======================================================
   */

  describe('Exportaciones de servicios existentes', () => {

    test('exporta CreateOneUser', () => {

      expect(services).toHaveProperty(
        'CreateOneUser'
      );

      expect(
        typeof services.CreateOneUser
      ).toBe('function');
    });


    test('exporta GetUserProfile', () => {

      expect(services).toHaveProperty('GetUserProfile');

      expect(typeof services.GetUserProfile).toBe('function');
    });


    test('exporta UpdateOneUser', () => {

      expect(services).toHaveProperty(
        'UpdateOneUser'
      );

      expect(
        typeof services.UpdateOneUser
      ).toBe('function');
    });


    test('exporta GetUserPreferences', () => {

      expect(services).toHaveProperty(
        'GetUserPreferences'
      );

      expect(
        typeof services.GetUserPreferences
      ).toBe('function');
    });


    test('exporta UpdateUserPreferences', () => {

      expect(services).toHaveProperty(
        'UpdateUserPreferences'
      );

      expect(
        typeof services.UpdateUserPreferences
      ).toBe('function');
    });


    test('exporta GeneratePasswordResetLink', () => {

      expect(services).toHaveProperty(
        'GeneratePasswordResetLink'
      );

      expect(
        typeof services.GeneratePasswordResetLink
      ).toBe('function');
    });


    test('exporta SendPasswordResetEmail', () => {

      expect(services).toHaveProperty(
        'SendPasswordResetEmail'
      );

      expect(
        typeof services.SendPasswordResetEmail
      ).toBe('function');
    });
  });


  /*
   * =======================================================
   * EXPORTACIONES INCORPORADAS
   * =======================================================
   */

  describe('Exportaciones de autenticación y documentos legales', () => {

    test('exporta GoogleAuthUser', () => {

      expect(services).toHaveProperty(
        'GoogleAuthUser'
      );

      expect(
        typeof services.GoogleAuthUser
      ).toBe('function');
    });


    test('exporta GetActiveLegalDocuments', () => {

      expect(services).toHaveProperty(
        'GetActiveLegalDocuments'
      );

      expect(
        typeof services.GetActiveLegalDocuments
      ).toBe('function');
    });


    test('exporta GetPendingLegalAcceptances', () => {

      expect(services).toHaveProperty(
        'GetPendingLegalAcceptances'
      );

      expect(
        typeof services.GetPendingLegalAcceptances
      ).toBe('function');
    });


    test('exporta RegisterLegalAcceptances', () => {

      expect(services).toHaveProperty(
        'RegisterLegalAcceptances'
      );

      expect(
        typeof services.RegisterLegalAcceptances
      ).toBe('function');
    });
  });


  /*
   * =======================================================
   * REFERENCIAS DE LOS SERVICIOS
   * =======================================================
   */

  describe('Referencias correctas de los servicios exportados', () => {

    test.each(serviceModules)(
      '%s devuelve la referencia del módulo correspondiente',
      (serviceName, modulePath) => {

        const expectedService = require(
          modulePath
        );

        expect(
          services[serviceName]
        ).toBe(expectedService);
      }
    );


    test.each(serviceModules)(
      '%s conserva la misma referencia en accesos consecutivos',
      serviceName => {

        const firstReference =
          services[serviceName];

        const secondReference =
          services[serviceName];

        expect(firstReference)
          .toBe(secondReference);
      }
    );


    test('cada servicio exportado corresponde a una referencia independiente', () => {

      const references =
        expectedServiceNames.map(
          serviceName => services[serviceName]
        );

      expect(
        new Set(references).size
      ).toBe(
        expectedServiceNames.length
      );
    });
  });


  /*
   * =======================================================
   * CONTRATO DE EXPORTACIÓN
   * =======================================================
   */

  describe('Contrato de exportación del index', () => {

    test('exporta todos los servicios definidos en el contrato actual', () => {

      expect(
        Object.keys(services).sort()
      ).toEqual(
        [...expectedServiceNames].sort()
      );
    });


    test.each(expectedServiceNames)(
      '%s está definido mediante un getter',
      serviceName => {

        const descriptor =
          Object.getOwnPropertyDescriptor(
            services,
            serviceName
          );

        expect(descriptor)
          .toBeDefined();

        expect(
          typeof descriptor.get
        ).toBe('function');

        expect(descriptor)
          .not.toHaveProperty('value');
      }
    );


    test.each(expectedServiceNames)(
      '%s es una propiedad enumerable',
      serviceName => {

        const descriptor =
          Object.getOwnPropertyDescriptor(
            services,
            serviceName
          );

        expect(descriptor.enumerable)
          .toBe(true);
      }
    );


    test.each(expectedServiceNames)(
      '%s no define un setter',
      serviceName => {

        const descriptor =
          Object.getOwnPropertyDescriptor(
            services,
            serviceName
          );

        expect(descriptor.set)
          .toBeUndefined();
      }
    );


    test.each([
      'FirebaseAuthService',
      'GoogleAuthDatabase',
      'GoogleAuthLambdaService',
      'LegalAuthService',
      'LegalAuthDatabase',
      'LegalAuthLambdaService',
      'LegalAcceptanceService'
    ])(
      'no expone el servicio interno %s',
      serviceName => {

        expect(
          Object.prototype.hasOwnProperty.call(
            services,
            serviceName
          )
        ).toBe(false);
      }
    );
  });


  /*
   * =======================================================
   * CARGA DIFERIDA DE SERVICIOS
   * =======================================================
   *
   * Utilizamos un registro de módulos aislado para comprobar
   * cuándo se ejecuta realmente la fábrica de cada mock.
   *
   * Esto evita que la caché de los casos anteriores altere
   * el resultado de las pruebas de lazy loading.
   */

  describe('Carga diferida de servicios', () => {

    const withIsolatedServices = callback => {

      const factories = {};

      const references = {};

      const originalReferences = Object.fromEntries(
        serviceModules.map(([serviceName]) => [
          serviceName, services[serviceName]
        ])
      );

      jest.resetModules();

      try {

        jest.isolateModules(() => {

          serviceModules.forEach(
            ([serviceName, modulePath]) => {

              const serviceReference =
                class MockUserService {};

              references[serviceName] =
                serviceReference;

              factories[serviceName] =
                jest.fn(
                  () => serviceReference
                );

              jest.doMock(
                modulePath,
                factories[serviceName]
              );
            }
          );

          const isolatedServices = require(
            '@user/services/user'
          );

          callback({
            isolatedServices,
            factories,
            references
          });
        });

      } finally {

        /*
        * Restauramos las fábricas originales para no dejar
        * los mocks de seguimiento registrados después de
        * finalizar el módulo aislado.
        */

        jest.resetModules();

        serviceModules.forEach(
          ([serviceName, modulePath]) => {

            const originalReference =
              originalReferences[serviceName];

            jest.doMock(
              modulePath,
              () => originalReference
            );
          }
        );
      }
    };


    const expectNoServicesLoaded = factories => {

      expectedServiceNames.forEach(
        serviceName => {

          expect(
            factories[serviceName]
          ).not.toHaveBeenCalled();
        }
      );
    };


    test('importar el index no carga anticipadamente ningún servicio', () => {

      withIsolatedServices(
        ({
          isolatedServices,
          factories
        }) => {

          expect(isolatedServices)
            .toBeDefined();

          expectNoServicesLoaded(
            factories
          );
        }
      );
    });


    test('enumerar las exportaciones no carga los servicios', () => {

      withIsolatedServices(
        ({
          isolatedServices,
          factories
        }) => {

          expect(
            Object.keys(
              isolatedServices
            ).sort()
          ).toEqual(
            [...expectedServiceNames].sort()
          );

          expectNoServicesLoaded(
            factories
          );
        }
      );
    });


    test('consultar los descriptores no carga los servicios', () => {

      withIsolatedServices(
        ({
          isolatedServices,
          factories
        }) => {

          const descriptors =
            Object.getOwnPropertyDescriptors(
              isolatedServices
            );

          expectedServiceNames.forEach(
            serviceName => {

              expect(
                typeof descriptors[
                  serviceName
                ].get
              ).toBe('function');
            }
          );

          expectNoServicesLoaded(
            factories
          );
        }
      );
    });


    test.each(expectedServiceNames)(
      'acceder a %s carga únicamente el servicio solicitado',
      selectedServiceName => {

        withIsolatedServices(
          ({
            isolatedServices,
            factories,
            references
          }) => {

            expectNoServicesLoaded(
              factories
            );

            expect(
              isolatedServices[
                selectedServiceName
              ]
            ).toBe(
              references[
                selectedServiceName
              ]
            );

            expectedServiceNames.forEach(
              serviceName => {

                if (
                  serviceName ===
                    selectedServiceName
                ) {

                  expect(
                    factories[serviceName]
                  ).toHaveBeenCalledTimes(1);

                } else {

                  expect(
                    factories[serviceName]
                  ).not.toHaveBeenCalled();
                }
              }
            );
          }
        );
      }
    );


    test.each(expectedServiceNames)(
      'acceder repetidamente a %s reutiliza el módulo cargado',
      serviceName => {

        withIsolatedServices(
          ({
            isolatedServices,
            factories,
            references
          }) => {

            const firstReference =
              isolatedServices[
                serviceName
              ];

            const secondReference =
              isolatedServices[
                serviceName
              ];

            const thirdReference =
              isolatedServices[
                serviceName
              ];

            expect(firstReference)
              .toBe(
                references[serviceName]
              );

            expect(secondReference)
              .toBe(firstReference);

            expect(thirdReference)
              .toBe(firstReference);

            expect(
              factories[serviceName]
            ).toHaveBeenCalledTimes(1);
          }
        );
      }
    );


    test('la recuperación de contraseña no carga los servicios de registro ni los servicios legales', () => {

      withIsolatedServices(
        ({
          isolatedServices,
          factories,
          references
        }) => {

          expect(
            isolatedServices
              .GeneratePasswordResetLink
          ).toBe(
            references
              .GeneratePasswordResetLink
          );

          expect(
            isolatedServices
              .SendPasswordResetEmail
          ).toBe(
            references
              .SendPasswordResetEmail
          );

          const selectedServices = [
            'GeneratePasswordResetLink',
            'SendPasswordResetEmail'
          ];

          expectedServiceNames.forEach(
            serviceName => {

              if (
                selectedServices.includes(
                  serviceName
                )
              ) {

                expect(
                  factories[serviceName]
                ).toHaveBeenCalledTimes(1);

              } else {

                expect(
                  factories[serviceName]
                ).not.toHaveBeenCalled();
              }
            }
          );
        }
      );
    });


    test('la consulta de documentos legales vigentes no carga otros servicios', () => {

      withIsolatedServices(
        ({
          isolatedServices,
          factories,
          references
        }) => {

          expect(
            isolatedServices
              .GetActiveLegalDocuments
          ).toBe(
            references
              .GetActiveLegalDocuments
          );

          expectedServiceNames.forEach(
            serviceName => {

              if (
                serviceName ===
                  'GetActiveLegalDocuments'
              ) {

                expect(
                  factories[serviceName]
                ).toHaveBeenCalledTimes(1);

              } else {

                expect(
                  factories[serviceName]
                ).not.toHaveBeenCalled();
              }
            }
          );
        }
      );
    });


    test('los servicios de aceptación legal se cargan independientemente', () => {

      withIsolatedServices(
        ({
          isolatedServices,
          factories,
          references
        }) => {

          expect(
            isolatedServices
              .GetPendingLegalAcceptances
          ).toBe(
            references
              .GetPendingLegalAcceptances
          );

          expect(
            factories
              .GetPendingLegalAcceptances
          ).toHaveBeenCalledTimes(1);

          expect(
            factories
              .RegisterLegalAcceptances
          ).not.toHaveBeenCalled();

          expect(
            isolatedServices
              .RegisterLegalAcceptances
          ).toBe(
            references
              .RegisterLegalAcceptances
          );

          expect(
            factories
              .RegisterLegalAcceptances
          ).toHaveBeenCalledTimes(1);

          expect(
            factories
              .GetPendingLegalAcceptances
          ).toHaveBeenCalledTimes(1);

          expectedServiceNames
            .filter(
              serviceName =>
                serviceName !==
                  'GetPendingLegalAcceptances' &&
                serviceName !==
                  'RegisterLegalAcceptances'
            )
            .forEach(serviceName => {

              expect(
                factories[serviceName]
              ).not.toHaveBeenCalled();
            });
        }
      );
    });


    test('acceder a todos los servicios carga cada módulo una sola vez', () => {

      withIsolatedServices(
        ({
          isolatedServices,
          factories,
          references
        }) => {

          expectedServiceNames.forEach(
            serviceName => {

              expect(
                isolatedServices[
                  serviceName
                ]
              ).toBe(
                references[
                  serviceName
                ]
              );
            }
          );

          expectedServiceNames.forEach(
            serviceName => {

              expect(
                factories[serviceName]
              ).toHaveBeenCalledTimes(1);
            }
          );
        }
      );
    });
  });
});