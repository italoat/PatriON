// backend/models/InventoryItem.js
const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    numeroPatrimonio: { type: String, required: true, unique: true },
    numeroPatrimonioAnterior: String,
    descricao: { type: String, required: true },
    classificacao: String,
    // CORREÇÃO AQUI: Definimos o 'setor' como uma referência ao modelo 'Sector'
    setor: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sector', // Aponta para o modelo 'Sector'
        required: true
    },
    outraIdentificacao: String,
    observacao: String,
    foto: String
}, { timestamps: { createdAt: 'dataCadastro', updatedAt: 'ultimaAtualizacao' } });

// O nome da coleção continua 'itens'
const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema, 'itens');

module.exports = InventoryItem;