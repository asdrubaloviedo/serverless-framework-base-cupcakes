const { test, expect } = require('@playwright/test');
const { baseURL } = require('./config/environments');
const url = `${baseURL}usuarios/google-auth`;
const token = process.env.TEST_GOOGLE_ID_TOKEN;

test.describe('API - Google Auth', () => {
 test('token ausente: 400', async ({request}) => {
  const response=await request.post(url,{data:{action:'login'}});
  expect(response.status()).toBe(400);
 });
 test('operación inválida: 400', async ({request}) => {
  const response=await request.post(url,{data:{idToken:'test-token-123456789012345',action:'delete'}});
  expect(response.status()).toBe(400);
 });
 test('token malformado: 401', async ({request}) => {
  const response=await request.post(url,{data:{idToken:'invalid-token-123456789012345',action:'login'}});
  expect(response.status()).toBe(401);
 });
 test('login con cuenta de prueba registrada: 200', async ({request}) => {
  test.skip(!token || process.env.TEST_GOOGLE_ACCOUNT_STATE!=='registered', 'Requiere token Firebase real de usuario de prueba registrado');
  const response=await request.post(url,{data:{idToken:token,action:'login'}});
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({success:true,action:'login'});
 });
 test('registro duplicado: 409', async ({request}) => {
  test.skip(!token || process.env.TEST_GOOGLE_ACCOUNT_STATE!=='registered', 'Requiere token Firebase real de usuario de prueba registrado');
  const response=await request.post(url,{data:{idToken:token,action:'register'}});
  expect(response.status()).toBe(409);
 });
 test('login sin registro PostgreSQL: 404', async ({request}) => {
  test.skip(!token || process.env.TEST_GOOGLE_ACCOUNT_STATE!=='unregistered', 'Requiere token Firebase real de usuario de prueba NO registrado');
  const response=await request.post(url,{data:{idToken:token,action:'login'}});
  expect(response.status()).toBe(404);
 });
 test('registro nuevo: 200 (mutación explícitamente habilitada)', async ({request}) => {
  test.skip(!token || process.env.TEST_GOOGLE_ACCOUNT_STATE!=='unregistered' || process.env.TEST_ALLOW_GOOGLE_REGISTRATION!=='true', 'Requiere cuenta desechable y permiso explícito para insertar');
  const response=await request.post(url,{data:{idToken:token,action:'register',nombre:'QA Google'}});
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({success:true,action:'register'});
 });
});
