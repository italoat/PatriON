// backend/db.js

const users = [
    {
        id: 1,
        nome: 'Administrador',
        email: 'admin@admin',
        passwordHash: '$2b$10$bO5MKJcIvYGosds0uKXqye70fyhtDw3zAbEbIypFs3.H6fAau/ybC' 
    },
    {
        id: 2,
        nome: 'Italo Trovão',
        email: 'italotrovao@gmail.com',
        // COLE AQUI O HASH QUE VOCÊ GEROU PARA A SENHA 'password123'
        passwordHash: '$2b$10$UApf9xMTxjaw3Zx9.qbztO9L7PuMlQWpf.Y09Kz0hZRr8dDiy98Ne' 
    }
];

module.exports = { users };