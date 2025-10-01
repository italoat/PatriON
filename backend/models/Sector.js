// backend/models/Sector.js
const mongoose = require('mongoose');

const sectorSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true
    }
});

const Sector = mongoose.model('Sector', sectorSchema, 'setores');
module.exports = Sector;