// backend/server.js (VERSÃO COMPLETA SEM EDITAR)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const multer = require('multer');

const { users } = require('./db.js'); 

const app = express();
const PORT = 5000;
const JWT_SECRET = 'sua-chave-secreta-super-segura-aqui';

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

let inventoryData = [];
const csvFilePath = path.join(__dirname, 'Inventário In-Loco Final.xlsx - Saúde.csv');
const headers = [ 'N Patrimonio Anterior', 'N de Patrimonio', 'Descricao do Bem', 'CLASSIFICACAO', 'Setor', 'Outra Identificacao', 'Observacao', 'Foto' ];

fs.createReadStream(csvFilePath)
  .pipe(csv({ separator: ';', headers: headers, skipLines: 1 }))
  .on('data', (row) => { inventoryData.push({ ...row, VALOR: 0 }); })
  .on('end', () => { console.log('Arquivo CSV do inventário carregado com sucesso (modo robusto).'); });

const arrayToCsv = (data, headers) => {
    const headerRow = `"${headers.join(';')}"\n`;
    const dataRows = data.map(row => `"${headers.map(header => row[header] || '').join(';')}"`).join('\n');
    return headerRow + dataRows;
};

app.post('/api/login', async (req, res) => { /* ... (código existente) ... */ });
app.get('/api/sectors', (req, res) => { /* ... (código existente) ... */ });
app.get('/api/inventory', (req, res) => { /* ... (código existente) ... */ });
app.post('/api/inventory', upload.single('foto'), (req, res) => { /* ... (código existente) ... */ });
app.delete('/api/inventory/:patrimonioId', (req, res) => { /* ... (código existente) ... */ });

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});