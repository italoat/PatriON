// backend/test-bcrypt.js

const bcrypt = require('bcryptjs');

const plainPassword = 'password';
// POR FAVOR, COLE AQUI O HASH QUE VOCÊ GEROU ANTERIORMENTE
const hash = '$2b$10$bO5MKJcIvYGosds0uKXqye70fyhtDw3zAbEbIypFs3.H6fAau/ybC';

console.log("========================================");
console.log("Iniciando teste de isolamento do bcrypt...");
console.log("Senha Pura a ser testada:", plainPassword);
console.log("Hash a ser comparado:", hash);
console.log("========================================");

bcrypt.compare(plainPassword, hash, function(err, result) {
    if (err) {
        console.error("\nERRO: Ocorreu um erro na biblioteca bcrypt:", err);
        return;
    }

    console.log("\n>>> O resultado da comparação é:", result, "<<<");

    if(result) {
        console.log("\nSUCESSO: A senha corresponde ao hash. O problema não está no bcrypt.");
    } else {
        console.log("\nFALHA: A senha NÃO corresponde ao hash. Há um problema fundamental com o bcrypt ou com o hash.");
    }
    console.log("========================================");
});