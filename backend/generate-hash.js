// backend/generate-hash.js

const bcrypt = require('bcryptjs');

const password = 'password123'; // A nova senha
const saltRounds = 10;

console.log("Gerando novo hash para a senha:", password);

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error("Erro ao gerar o hash:", err);
        return;
    }
    console.log("\n============================================================");
    console.log("COPIE A LINHA DE HASH ABAIXO PARA O NOVO USUÁRIO");
    console.log("============================================================");
    console.log(hash);
    console.log("============================================================");
});