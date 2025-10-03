// backend/server.js (VERSÃO COMPLETA E ATUALIZADA)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Importa os modelos e serviços
const User = require('./models/User');
const InventoryItem = require('./models/InventoryItem');
const Sector = require('./models/Sector');
const setupEmailService = require('./email-service.js');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'sua-chave-secreta-super-segura-aqui';
const MONGO_URI = "mongodb+srv://patrion_user:patrion123%40@cluster0.zbjsvk6.mongodb.net/inventarioDB?retryWrites=true&w=majority&appName=Cluster0";

// Middlewares e Configurações
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

let mailTransporter;

// --- ROTAS DA API ---

// Rota de Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    try {
        const user = await User.findOne({ Login: email });
        if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const isPasswordCorrect = await bcrypt.compare(password, user.senha);
        if (!isPasswordCorrect) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const token = jwt.sign({ userId: user._id, email: user.Login, name: user.nome, perfil: user.perfil }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login bem-sucedido!', token });
    } catch (error) { res.status(500).json({ message: "Erro interno no servidor." }); }
});

// Rota de Criação de Usuário
app.post('/api/users', async (req, res) => {
    try {
        const { nome, Login, senha, perfil } = req.body;
        if (!nome || !Login || !senha || !perfil) return res.status(400).json({ message: "Todos os campos são obrigatórios." });
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const newUser = new User({ nome, Login, senha: senhaHash, perfil });
        await newUser.save();
        res.status(201).json({ message: `Usuário '${nome}' criado com sucesso!` });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "Este login já está em uso." });
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// Rota "Esqueci Minha Senha"
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ Login: email });
        if (!user) return res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();
        const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
        const mailOptions = { from: '"Suporte PatriOn" <suporte@patrion.com>', to: user.Login, subject: 'Redefinição de Senha - PatriOn', text: `Link para redefinir sua senha: ${resetURL}` };
        let info = await mailTransporter.sendMail(mailOptions);
        console.log("E-mail de redefinição enviado. Preview URL: %s", nodemailer.getTestMessageUrl(info));
        res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
    } catch (error) { res.status(500).json({ message: "Erro interno no servidor." }); }
});

// Rota "Redefinir Senha"
app.post('/api/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'O token para redefinição de senha é inválido ou já expirou.' });
        const { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        user.senha = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ message: 'Sua senha foi atualizada com sucesso.' });
    } catch (error) { res.status(500).json({ message: "Erro interno no servidor." }); }
});

// Rota de Setores
app.get('/api/sectors', async (req, res) => {
    try {
        const sectors = await Sector.find().sort({ nome: 1 });
        res.json(sectors);
    } catch (error) { res.status(500).json({ message: "Erro ao buscar setores." }); }
});

// Rota de Inventário (GET) com Cálculo de Depreciação
app.get('/api/inventory', async (req, res) => {
    try {
        const { setorId } = req.query;
        const filter = (setorId && setorId !== 'Todos') ? { setor: setorId } : {};
        const itemsFromDB = await InventoryItem.find(filter).populate('setor').lean();
        const itemsWithDepreciation = itemsFromDB.map(item => {
            if (item.entrada && item.valor > 0 && item.taxaDepreciacao >= 0) {
                const hoje = new Date();
                const dataEntrada = new Date(item.entrada);
                const diffTime = Math.abs(hoje - dataEntrada);
                const diffAnos = diffTime / (1000 * 60 * 60 * 24 * 365.25);
                const taxaDecimal = item.taxaDepreciacao / 100;
                const depreciacaoTotal = item.valor * taxaDecimal * diffAnos;
                let valorAtual = item.valor - depreciacaoTotal;
                return { ...item, valorAtual: Math.max(0, valorAtual) };
            }
            return { ...item, valorAtual: item.valor };
        });
        res.json(itemsWithDepreciation);
    } catch (error) { 
        res.status(500).json({ message: "Erro ao buscar inventário.", error: error.message }); 
    }
});

// Rota de Inventário (POST)
app.post('/api/inventory', upload.single('foto'), async (req, res) => {
    try {
        const { numeroPatrimonio, numeroPatrimonioAnterior, descricao, classificacao, setor, outraIdentificacao, observacao, valor, entrada, taxaDepreciacao } = req.body;
        const newItemData = { numeroPatrimonio, numeroPatrimonioAnterior, descricao, classificacao, setor, outraIdentificacao, observacao, valor, entrada, taxaDepreciacao };
        if (req.file) { newItemData.foto = `http://localhost:5000/uploads/${req.file.filename}`; }
        const newItem = new InventoryItem(newItemData);
        await newItem.save();
        const populatedItem = await InventoryItem.findById(newItem._id).populate('setor');
        res.status(201).json({ message: 'Item cadastrado com sucesso!', item: populatedItem });
    } catch (error) { res.status(500).json({ message: 'Erro ao cadastrar o item.', error }); }
});

// Rota de Inventário (PUT) - ATUALIZADA PARA ACEITAR IMAGEM
app.put('/api/inventory/:id', upload.single('foto'), async (req, res) => {
    try {
        const updatedData = req.body;
        if (req.file) {
            updatedData.foto = `http://localhost:5000/uploads/${req.file.filename}`;
        }
        const updatedItem = await InventoryItem.findByIdAndUpdate(req.params.id, updatedData, { new: true }).populate('setor');
        if (!updatedItem) return res.status(404).json({ message: 'Item não encontrado.' });
        res.status(200).json({ message: 'Item atualizado com sucesso!', item: updatedItem });
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao atualizar o item.', error }); 
    }
});

// Rota de Inventário (DELETE)
app.delete('/api/inventory/:id', async (req, res) => {
    try {
        const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json({ message: 'Item não encontrado.' });
        res.status(200).json({ message: 'Item apagado com sucesso!' });
    } catch (error) { res.status(500).json({ message: 'Erro ao apagar o item.', error }); }
});


// --- FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ---
const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB conectado com sucesso na base 'inventarioDB'.");
        mailTransporter = await setupEmailService();
        app.listen(PORT, () => {
            console.log(`Servidor backend rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error("Falha ao iniciar o servidor:", error);
        process.exit(1);
    }
};

startServer();