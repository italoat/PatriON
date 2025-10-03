// backend/models/InventoryItem.js

const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    numeroPatrimonio: { type: String, required: true, unique: true },
    numeroPatrimonioAnterior: String,
    descricao: { type: String, required: true },
    classificacao: String,
    setor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sector',
        required: true
    },
    outraIdentificacao: String,
    observacao: String,
    foto: String,
    valor: {
        type: Number,
        required: true,
        default: 0
    },
    entrada: {
        type: Date,
        required: true,
        default: Date.now
    },
    taxaDepreciacao: {
        type: Number,
        required: true,
        default: 10 // MUDANÇA AQUI: O padrão agora é 10 (representando 10%)
    }

}, { timestamps: { createdAt: 'dataCadastro', updatedAt: 'ultimaAtualizacao' } });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema, 'itens');

module.exports = InventoryItem;