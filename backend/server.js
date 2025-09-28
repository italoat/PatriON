// backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // LINHA CORRIGIDA
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const { users } = require('./db.js'); // Verifique se o nome do arquivo é db.js

const app = express();
const PORT = 5000;
const JWT_SECRET = 'sua-chave-secreta-super-segura-aqui';

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// --- BANCO DE DADOS DO INVENTÁRIO ---
let inventoryData = [];
const csvFilePath = path.join(__dirname, 'Inventário In-Loco Final.xlsx - Saúde.csv');
const headers = [ 'N Patrimonio Anterior', 'N de Patrimonio', 'Descricao do Bem', 'CLASSIFICACAO', 'Setor', 'Outra Identificacao', 'Observacao' ];

fs.createReadStream(csvFilePath)
  .pipe(csv({ separator: ';', headers: headers, skipLines: 1 }))
  .on('data', (row) => { inventoryData.push({ ...row, VALOR: 0 }); })
  .on('end', () => { console.log('Arquivo CSV do inventário carregado com sucesso.'); });


// --- ROTAS (sem alterações) ---
// ... (todo o resto do seu código de rotas continua igual)
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
    const sectors = [...new Set(inventoryData.map(item => item.Setor))];
    res.json(sectors.filter(s => s).sort());
});
app.get('/api/inventory', (req, res) => {
    const { setor } = req.query;
    if (!setor || setor === 'Todos') return res.json(inventoryData);
    const filteredData = inventoryData.filter(item => item.Setor === setor);
    res.json(filteredData);
});
app.post('/api/inventory', (req, res) => {
    const newItem = req.body;
    const csvLine = `"${newItem['N Patrimonio Anterior'] || ''};${newItem['N de Patrimonio'] || ''};${newItem['Descricao do Bem'] || ''};${newItem['CLASSIFICACAO'] || ''};${newItem['Setor'] || ''};${newItem['Outra Identificacao'] || ''};${newItem['Observacao'] || ''}"\n`;
    fs.appendFile(csvFilePath, csvLine, 'utf8', (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao salvar o item.' });
        inventoryData.push(newItem);
        res.status(201).json({ message: 'Item cadastrado com sucesso!', item: newItem });
    });
});
const arrayToCsv = (data, headers) => {
    const headerRow = `"${headers.join(';')}"\n`;
    const dataRows = data.map(row => 
        `"${headers.map(header => row[header] || '').join(';')}"`
    ).join('\n');
    return headerRow + dataRows;
};
app.delete('/api/inventory/:patrimonioId', (req, res) => {
    const { patrimonioId } = req.params;
    const initialLength = inventoryData.length;
    const newData = inventoryData.filter(item => 
        (item['N de Patrimonio'] ? item['N de Patrimonio'].trim() : '') !== patrimonioId.trim()
    );
    if (newData.length === initialLength) {
        return res.status(404).json({ message: 'Item não encontrado.' });
    }
    inventoryData = newData;
    const csvData = arrayToCsv(inventoryData, headers);
    fs.writeFile(csvFilePath, csvData, 'utf8', (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao apagar o item no arquivo.' });
        res.status(200).json({ message: 'Item apagado com sucesso!' });
    });
});


app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});