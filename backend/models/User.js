// backend/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    Login: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    perfil: {
        type: Number,
        required: true,
        default: 2 // 1 = Administrador, 2 = Usuário
    },
    
    // --- NOVOS CAMPOS PARA REDEFINIÇÃO DE SENHA ---
    resetPasswordToken: String,
    resetPasswordExpires: Date

}, {
    collection: 'users',
    timestamps: { createdAt: 'criacao' } 
});

const User = mongoose.model('User', userSchema);

module.exports = User;