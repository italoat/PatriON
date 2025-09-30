// backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const { users } = require('./db.js');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'sua-chave-secreta-super-segura-aqui';

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const multer = require('multer');
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
  .on('end', () => { console.log('Arquivo CSV do inventário carregado com sucesso.'); });

// --- ROTA DE LOGIN E ROTAS EXISTENTES (sem alterações) ---
// ... (seu código para login, sectors, get/post/delete inventory continua aqui)
app.post('/api/login', async (req, res) => { /* ... */ });
app.get('/api/sectors', (req, res) => { /* ... */ });
app.get('/api/inventory', (req, res) => { /* ... */ });
app.post('/api/inventory', upload.single('foto'), (req, res) => { /* ... */ });
app.delete('/api/inventory/:patrimonioId', (req, res) => { /* ... */ });


// --- FUNÇÃO AUXILIAR PARA CONVERTER ARRAY PARA CSV (sem alterações) ---
const arrayToCsv = (data, headers) => { /* ... */ };


// =========================================================================
// NOVA ROTA: Atualizar um item existente (Editar)
// =========================================================================
app.put('/api/inventory/:patrimonioId', (req, res) => {
    const { patrimonioId } = req.params;
    const updatedData = req.body;

    let itemFound = false;
    // Encontra o item e o atualiza
    inventoryData = inventoryData.map(item => {
        if ((item['N de Patrimonio'] ? item['N de Patrimonio'].trim() : '') === patrimonioId.trim()) {
            itemFound = true;
            // Retorna o item com os novos dados mesclados
            return { ...item, ...updatedData };
        }
        return item;
    });

    if (!itemFound) {
        return res.status(404).json({ message: 'Item não encontrado para atualização.' });
    }

    const csvData = arrayToCsv(inventoryData, headers);

    fs.writeFile(csvFilePath, csvData, 'utf8', (err) => {
        if (err) {
            console.error("Erro ao reescrever o arquivo CSV na atualização:", err);
            return res.status(500).json({ message: 'Erro ao salvar as alterações.' });
        }
        
        console.log(`Item ${patrimonioId} atualizado com sucesso.`);
        // Retorna o item atualizado para o frontend
        res.status(200).json({ message: 'Item atualizado com sucesso!', item: updatedData });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});