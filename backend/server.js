// backend/server.js (VERSÃO ESTÁVEL E COMPLETA)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const multer = require('multer');

// Importa a "tabela" de usuários do arquivo db.js
const { users } = require('./db.js'); 

const app = express();
const PORT = 5000;
const JWT_SECRET = 'sua-chave-secreta-super-segura-aqui';

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve arquivos da pasta uploads

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- BANCO DE DADOS DO INVENTÁRIO (EM MEMÓRIA) ---
let inventoryData = [];
const csvFilePath = path.join(__dirname, 'Inventário In-Loco Final.xlsx - Saúde.csv');
const headers = [ 'N Patrimonio Anterior', 'N de Patrimonio', 'Descricao do Bem', 'CLASSIFICACAO', 'Setor', 'Outra Identificacao', 'Observacao', 'Foto' ];

fs.createReadStream(csvFilePath)
  .pipe(csv({ separator: ';', headers: headers, skipLines: 1 }))
  .on('data', (row) => { inventoryData.push({ ...row, VALOR: 0 }); })
  .on('end', () => { console.log('Arquivo CSV do inventário carregado com sucesso (modo robusto).'); });

// Função auxiliar para reescrever o arquivo CSV
const arrayToCsv = (data, headers) => {
    const headerRow = `"${headers.join(';')}"\n`;
    const dataRows = data.map(row => 
        `"${headers.map(header => row[header] || '').join(';')}"`
    ).join('\n');
    return headerRow + dataRows;
};

// --- ROTAS DA API ---

// POST /api/login - Autentica um usuário
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) return res.status(401).json({ message: 'Credenciais inválidas.' });
    const token = jwt.sign({ userId: user.id, email: user.email, name: user.nome }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login bem-sucedido!', token });
});

// GET /api/sectors - Retorna lista de setores
app.get('/api/sectors', (req, res) => {
    const sectors = [...new Set(inventoryData.map(item => item.Setor ? item.Setor.trim() : ''))];
    res.json(sectors.filter(s => s).sort());
});

// GET /api/inventory - Retorna lista de itens (com filtro opcional)
app.get('/api/inventory', (req, res) => {
    const { setor } = req.query;
    if (!setor || setor === 'Todos') return res.json(inventoryData);
    const filteredData = inventoryData.filter(item => (item.Setor ? item.Setor.trim() : '') === setor);
    res.json(filteredData);
});

// POST /api/inventory - Cadastra um novo item
app.post('/api/inventory', upload.single('foto'), (req, res) => {
    const newItemData = req.body;
    if (req.file) {
        newItemData.Foto = `http://localhost:5000/uploads/${req.file.filename}`;
    } else { newItemData.Foto = ''; }
    const csvLine = `"${headers.map(header => newItemData[header] || '').join(';')}"\n`;
    fs.appendFile(csvFilePath, csvLine, 'utf8', (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao salvar o item.' });
        inventoryData.push(newItemData);
        res.status(201).json({ message: 'Item cadastrado com sucesso!', item: newItemData });
    });
});

// PUT /api/inventory/:patrimonioId - Atualiza (edita) um item
app.put('/api/inventory/:patrimonioId', (req, res) => {
    const { patrimonioId } = req.params;
    const updatedDataFromFrontend = req.body;
    let itemFound = false;

    inventoryData = inventoryData.map(item => {
        if ((item['N de Patrimonio'] ? item['N de Patrimonio'].trim() : '') === patrimonioId.trim()) {
            itemFound = true;
            return { ...item, ...updatedDataFromFrontend }; // Mescla os dados antigos com os novos
        }
        return item;
    });
    if (!itemFound) return res.status(404).json({ message: 'Item não encontrado para atualização.' });

    const csvData = arrayToCsv(inventoryData, headers);
    fs.writeFile(csvFilePath, csvData, 'utf8', (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao salvar as alterações.' });
        const updatedItem = inventoryData.find(item => (item['N de Patrimonio'] ? item['N de Patrimonio'].trim() : '') === patrimonioId.trim());
        res.status(200).json({ message: 'Item atualizado com sucesso!', item: updatedItem });
    });
});

// DELETE /api/inventory/:patrimonioId - Apaga um item
app.delete('/api/inventory/:patrimonioId', (req, res) => {
    const { patrimonioId } = req.params;
    const initialLength = inventoryData.length;
    const newData = inventoryData.filter(item => (item['N de Patrimonio'] ? item['N de Patrimonio'].trim() : '') !== patrimonioId.trim());
    if (newData.length === initialLength) return res.status(404).json({ message: 'Item não encontrado.' });

    inventoryData = newData;
    const csvData = arrayToCsv(inventoryData, headers);
    fs.writeFile(csvFilePath, csvData, 'utf8', (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao apagar o item no arquivo.' });
        res.status(200).json({ message: 'Item apagado com sucesso!' });
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});