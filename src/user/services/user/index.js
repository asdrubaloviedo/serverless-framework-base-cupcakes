const CreateOneUser = require("@user/services/user/CreateOneUser");
const GeneratePasswordResetLink = require("@user/services/user/GeneratePasswordResetLink");
const SendPasswordResetEmail = require("@user/services/user/SendPasswordResetEmail");

/*
 * =========================================================
 * USER SERVICES
 * =========================================================
 *
 * Punto central de exportación de los servicios relacionados
 * con usuarios.
 *
 * Mantener los servicios exportados desde aquí permite que
 * controladores y otros módulos los importen sin conocer la
 * ubicación física de cada archivo.
 */
module.exports = {
    CreateOneUser,
    GeneratePasswordResetLink,
    SendPasswordResetEmail
};