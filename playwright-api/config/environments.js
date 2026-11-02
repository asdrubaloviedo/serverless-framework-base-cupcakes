
const environments = {
  local: {
    rootUrl: 'http://localhost:3000',
    stage: 'local',
  },
  dev: {
    rootUrl: 'https://api.thecupcakelife.com',
    stage: 'dev',
  },
};

const appName = 'cupcakeslife';

const modules = {
  category: 'categorias',
};

const environment = process.env.TEST_ENV || 'dev';

if (!environments[environment]) {
  throw new Error(`Entorno no soportado: ${environment}`);
}

const { rootUrl, stage } = environments[environment];

const baseURL = `${rootUrl}/${stage}/${appName}/`;

module.exports = {
  environment,
  rootUrl,
  stage,
  appName,
  modules,
  baseURL,
};
