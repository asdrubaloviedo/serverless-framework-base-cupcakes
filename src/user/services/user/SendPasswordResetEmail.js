const AWS = require('aws-sdk');

/*
 * =========================================================
 * SEND PASSWORD RESET EMAIL
 * =========================================================
 *
 * Envía al usuario el correo personalizado de recuperación
 * de contraseña de CupcakesLife.
 *
 * El enlace recibido fue generado previamente por Firebase
 * Authentication mediante GeneratePasswordResetLink.
 *
 * Este servicio NO genera enlaces y NO modifica contraseñas.
 * Su única responsabilidad es presentar el enlace dentro de
 * un correo personalizado y enviarlo mediante Amazon SES.
 */
class SendPasswordResetEmail {

    /*
     * =========================================================
     * EXECUTE
     * =========================================================
     *
     * email:
     *   Correo electrónico del usuario.
     *
     * resetLink:
     *   Enlace seguro de recuperación generado por Firebase.
     */
    static async execute({ email, resetLink }) {

        if (!email) {
            throw new Error('User email is required.');
        }

        if (!resetLink) {
            throw new Error('Password reset link is required.');
        }

        const sourceEmail = process.env.SES_FROM_EMAIL;

        if (!sourceEmail) {
            throw new Error(
                'SES_FROM_EMAIL environment variable is required.'
            );
        }

        const ses = new AWS.SES();

        const params = {
            Source: sourceEmail,

            Destination: {
                ToAddresses: [email]
            },

            Message: {
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Recupera tu contraseña | CupcakesLife'
                },

                Body: {
                    Html: {
                        Charset: 'UTF-8',

                        Data: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Recupera tu contraseña</title>
</head>

<body
    style="
        margin: 0;
        padding: 0;
        background-color: #F7F3F6;
        font-family: Arial, Helvetica, sans-serif;
        color: #2D2D2D;
    "
>

    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
            width: 100%;
            background-color: #F7F3F6;
            padding: 40px 16px;
        "
    >
        <tr>
            <td align="center">

                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                        width: 100%;
                        max-width: 560px;
                        background-color: #FFFFFF;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow:
                            0 4px 20px rgba(61, 15, 50, 0.08);
                    "
                >

                    <!-- HEADER -->
                    <tr>
                        <td
                            align="center"
                            style="
                                background-color: #3D0F32;
                                padding: 28px 24px;
                            "
                        >
                            <div
                                style="
                                    color: #FFFFFF;
                                    font-size: 28px;
                                    font-weight: 700;
                                    letter-spacing: -0.5px;
                                "
                            >
                                CupcakesLife
                            </div>
                        </td>
                    </tr>

                    <!-- CONTENT -->
                    <tr>
                        <td
                            style="
                                padding:
                                    42px 38px 20px 38px;
                            "
                        >
                            <h1
                                style="
                                    margin:
                                        0 0 18px 0;
                                    color: #3D0F32;
                                    font-size: 26px;
                                    line-height: 1.25;
                                    font-weight: 700;
                                    text-align: center;
                                "
                            >
                                ¿Olvidaste tu contraseña?
                            </h1>

                            <p
                                style="
                                    margin:
                                        0 0 14px 0;
                                    font-size: 16px;
                                    line-height: 1.7;
                                    text-align: center;
                                "
                            >
                                No te preocupes.
                                Recibimos una solicitud para
                                cambiar la contraseña de tu
                                cuenta de CupcakesLife.
                            </p>

                            <p
                                style="
                                    margin:
                                        0 0 30px 0;
                                    font-size: 16px;
                                    line-height: 1.7;
                                    text-align: center;
                                "
                            >
                                Presiona el siguiente botón
                                para crear una nueva contraseña.
                            </p>

                            <!-- BUTTON -->
                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                            >
                                <tr>
                                    <td align="center">
                                        <a
                                            href="${resetLink}"
                                            target="_blank"
                                            style="
                                                display:
                                                    inline-block;
                                                background-color:
                                                    #3D0F32;
                                                color:
                                                    #FFFFFF;
                                                text-decoration:
                                                    none;
                                                font-size:
                                                    16px;
                                                font-weight:
                                                    700;
                                                padding:
                                                    15px 30px;
                                                border-radius:
                                                    8px;
                                            "
                                        >
                                            Cambiar contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p
                                style="
                                    margin:
                                        32px 0 8px 0;
                                    font-size: 14px;
                                    line-height: 1.6;
                                    color: #666666;
                                "
                            >
                                Si el botón no funciona,
                                copia y pega este enlace en
                                tu navegador:
                            </p>

                            <p
                                style="
                                    margin: 0;
                                    font-size: 13px;
                                    line-height: 1.6;
                                    word-break: break-all;
                                "
                            >
                                <a
                                    href="${resetLink}"
                                    target="_blank"
                                    style="
                                        color: #3D0F32;
                                        text-decoration:
                                            underline;
                                    "
                                >
                                    ${resetLink}
                                </a>
                            </p>
                        </td>
                    </tr>

                    <!-- SECURITY MESSAGE -->
                    <tr>
                        <td
                            style="
                                padding:
                                    14px 38px 38px 38px;
                            "
                        >
                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                style="
                                    background-color:
                                        #F7F3F6;
                                    border-radius: 10px;
                                "
                            >
                                <tr>
                                    <td
                                        style="
                                            padding:
                                                18px 20px;
                                        "
                                    >
                                        <p
                                            style="
                                                margin: 0;
                                                color:
                                                    #5B5058;
                                                font-size:
                                                    13px;
                                                line-height:
                                                    1.6;
                                                text-align:
                                                    center;
                                            "
                                        >
                                            Si tú no solicitaste
                                            cambiar tu contraseña,
                                            puedes ignorar este
                                            correo. Tu contraseña
                                            actual continuará
                                            funcionando.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td
                            align="center"
                            style="
                                border-top:
                                    1px solid #EFE7ED;
                                padding: 22px 30px;
                            "
                        >
                            <p
                                style="
                                    margin: 0;
                                    color: #999999;
                                    font-size: 12px;
                                    line-height: 1.6;
                                "
                            >
                                Este es un correo automático
                                de CupcakesLife.
                                Por favor, no respondas a este
                                mensaje.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
                        `
                    },

                    Text: {
                        Charset: 'UTF-8',

                        Data: `
CupcakesLife

¿Olvidaste tu contraseña?

Recibimos una solicitud para cambiar la contraseña
de tu cuenta de CupcakesLife.

Utiliza el siguiente enlace para crear una nueva contraseña:

${resetLink}

Si tú no solicitaste cambiar tu contraseña,
puedes ignorar este correo.

CupcakesLife
                        `.trim()
                    }
                }
            }
        };

        try {

            await ses.sendEmail(params).promise();

        } catch (error) {

            console.error(
                'Error sending password reset email with SES:',
                error
            );

            throw new Error(
                'Error sending password reset email'
            );
        }
    }
}

module.exports = SendPasswordResetEmail;