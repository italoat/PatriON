// backend/server.js (VERSÃO REALMENTE FINAL E CORRIGIDA)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'sua-chave-secreta-super-segura-aqui';

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// --- BANCO DE DADOS DE USUÁRIOS ---
const users = [
    {
        id: 1,
        email: 'teste@teste',
        passwordHash: '$2a$10$f/U.gajJ3/3T2.3iAmhK..5DBxH/Am0GPvTpxGpxfIOYn2NlP2gG2' 
    }
];

// --- BANCO DE DADOS DO INVENTÁRIO ---
let inventoryData = [];
const csvFilePath = path.join(__dirname, 'Inventário In-Loco Final.xlsx - Saúde.csv');

// =========================================================================
// CORREÇÃO DEFINITIVA: Definimos os cabeçalhos manualmente e pulamos a primeira linha do arquivo.
// Isso força a leitura correta dos dados, ignorando qualquer problema de formatação no cabeçalho.
// =========================================================================
const headers = [
    'N Patrimonio Anterior',
    'N de Patrimonio',
    'Descricao do Bem',
    'CLASSIFICACAO',
    'Setor',
    'Outra Identificacao',
    'Observacao'
];

fs.createReadStream(csvFilePath)
  .pipe(csv({ 
      separator: ';', 
      headers: headers, // Usa nossos cabeçalhos definidos
      skipLines: 1      // Pula a linha de cabeçalho original do arquivo
  }))
  .on('data', (row) => {
    // A coluna VALOR não está no seu header, então vamos tratar como 0 por enquanto.
    // Se ela existir, você pode adicioná-la ao array de 'headers' acima.
    row.VALOR = 0; 
    inventoryData.push(row);
  })
  .on('end', () => {
    console.log('Arquivo CSV do inventário carregado com sucesso (modo robusto).');
    console.log(`Total de ${inventoryData.length} registros carregados.`);
  });


// --- ROTA DE LOGIN (Sem alterações) ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) return res.status(401).json({ message: 'Credenciais inválidas.' });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login bem-sucedido!', token });
});

// --- ROTAS DO DASHBOARD (Sem alterações na lógica) ---
app.get('/api/sectors', (req, res) => {
    if (!inventoryData.length) return res.status(500).json({ message: "Dados do inventário ainda não disponíveis." });
    const sectors = [...new Set(inventoryData.map(item => item.Setor))];
    res.json(sectors.filter(s => s).sort());
});

app.get('/api/inventory', (req, res) => {
    const { setor } = req.query;
    if (!setor || setor === 'Todos') return res.json(inventoryData);
    const filteredData = inventoryData.filter(item => item.Setor === setor);
    res.json(filteredData);
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});