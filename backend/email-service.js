// backend/email-service.js

const nodemailer = require('nodemailer');

// Esta função cria uma conta de teste no Ethereal e configura o Nodemailer
const setupEmailService = async () => {
    // Cria uma conta de teste.
    let testAccount = await nodemailer.createTestAccount();

    console.log("-----------------------------------------");
    console.log("Credenciais do Ethereal (para teste de e-mail):");
    console.log("Usuário:", testAccount.user);
    console.log("Senha:", testAccount.pass);
    console.log("--> Os e-mails de teste enviados aparecerão em uma URL que será mostrada no futuro.");
    console.log("-----------------------------------------");

    // Configura o "transportador" de e-mail que fará o envio
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true para porta 465, false para outras
        auth: {
            user: testAccount.user, // Usuário gerado pelo Ethereal
            pass: testAccount.pass, // Senha gerada pelo Ethereal
        },
    });

    return transporter;
};

module.exports = setupEmailService;