// backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const multer = require('multer'); // 1. IMPORTA O MULTER

const { users } = require('./db.js'); 

const app = express();
const PORT = 5000;
const JWT_SECRET = 'sua-chave-secreta-super-segura-aqui';

app.use(cors());
app.use(bodyParser.json());

// 2. SERVIR ARQUIVOS ESTÁTICOS DA PASTA 'uploads'
// Isso torna as imagens salvas acessíveis pela URL, ex: http://localhost:5000/uploads/imagem.png
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. CONFIGURAÇÃO DO MULTER PARA SALVAR ARQUIVOS
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Salva na pasta 'uploads' que criamos
    },
    filename: function (req, file, cb) {
        // Cria um nome de arquivo único para evitar conflitos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// --- BANCO DE DADOS E ROTAS EXISTENTES (com ajustes) ---
let inventoryData = [];
const csvFilePath = path.join(__dirname, 'Inventário In-Loco Final.xlsx - Saúde.csv');
const headers = [ 'N Patrimonio Anterior', 'N de Patrimonio', 'Descricao do Bem', 'CLASSIFICACAO', 'Setor', 'Outra Identificacao', 'Observacao', 'Foto' ]; // Adicionado 'Foto' ao header

fs.createReadStream(csvFilePath)
  .pipe(csv({ separator: ';', headers: headers, skipLines: 1 }))
  .on('data', (row) => { inventoryData.push({ ...row, VALOR: 0 }); })
  .on('end', () => { console.log('Arquivo CSV do inventário carregado com sucesso.'); });

// ... (Rotas de login, get sectors, get inventory, delete - sem alterações)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) return res.status(401).json({ message: 'Credenciais inválidas.' });
    const token = jwt.sign({ userId: user.id, email: user.email, name: user.nome }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login bem-sucedido!', token });
});
app.get('/api/sectors', (req, res) => {
    const sectors = [...new Set(inventoryData.map(item => item.Setor ? item.Setor.trim() : ''))];
    res.json(sectors.filter(s => s).sort());
});
app.get('/api/inventory', (req, res) => {
    const { setor } = req.query;
    if (!setor || setor === 'Todos') return res.json(inventoryData);
    const filteredData = inventoryData.filter(item => (item.Setor ? item.Setor.trim() : '') === setor);
    res.json(filteredData);
});
const arrayToCsv = (data, headers) => {
    const headerRow = `"${headers.join(';')}"\n`;
    const dataRows = data.map(row => `"${headers.map(header => row[header] || '').join(';')}"`).join('\n');
    return headerRow + dataRows;
};
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


// 4. ROTA DE CADASTRO MODIFICADA para aceitar upload de arquivo
app.post('/api/inventory', upload.single('foto'), (req, res) => {
    // Os dados do formulário vêm em 'req.body'
    const newItemData = req.body;
    
    // Se um arquivo foi enviado, seu caminho estará em 'req.file'
    if (req.file) {
        // Criamos a URL completa para acessar a imagem
        newItemData.Foto = `http://localhost:5000/uploads/${req.file.filename}`;
    } else {
        newItemData.Foto = ''; // Nenhuma foto enviada
    }
    
    const csvLine = `"${headers.map(header => newItemData[header] || '').join(';')}"\n`;

    fs.appendFile(csvFilePath, csvLine, 'utf8', (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao salvar o item.' });
        inventoryData.push(newItemData);
        res.status(201).json({ message: 'Item cadastrado com sucesso!', item: newItemData });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});