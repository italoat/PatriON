// backend/server.js (VERSÃO FINAL COM BASE64)

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
const { google } = require('googleapis');
const stream = require('stream');
const fs = require('fs');

const User = require('./models/User');
const InventoryItem = require('./models/InventoryItem');
const Sector = require('./models/Sector');
const setupEmailService = require('./email-service.js');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'sua-chave-secreta-super-segura-aqui';
const MONGO_URI = "mongodb+srv://patrion_user:patrion123%40@cluster0.zbjsvk6.mongodb.net/inventarioDB?retryWrites=true&w=majority&appName=Cluster0";

// --- CONFIGURAÇÃO GOOGLE DRIVE ---
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Função para carregar e autenticar as credenciais a partir do Base64
const getAuthClient = () => {
    const keyFilePath = process.env.NODE_ENV === 'production'
        ? '/etc/secrets/google-credentials.b64'
        : path.join(__dirname, 'google-credentials.b64'); // Para teste local, se necessário

    if (!fs.existsSync(keyFilePath)) {
        console.error(`ERRO: Arquivo de credenciais Base64 não encontrado em ${keyFilePath}.`);
        process.exit(1);
    }

    const base64Key = fs.readFileSync(keyFilePath, 'utf8');
    const credentialsStr = Buffer.from(base64Key, 'base64').toString('utf8');
    const credentials = JSON.parse(credentialsStr);

    return new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });
};

const auth = getAuthClient();
const drive = google.drive({ version: 'v3', auth });
// --- FIM DA CONFIGURAÇÃO GOOGLE DRIVE ---


app.use(cors());
app.use(bodyParser.json());

const upload = multer({ storage: multer.memoryStorage() });

let mailTransporter;
app.get('/api/debug-credentials', (req, res) => {
    console.log('--- INICIANDO DEBUG DE CREDENCIAIS ---');
    try {
        const keyFilePath = '/etc/secrets/google-credentials.b64';
        console.log(`Verificando caminho: ${keyFilePath}`);

        if (!fs.existsSync(keyFilePath)) {
            const errorMsg = 'ARQUIVO SECRETO NÃO ENCONTRADO!';
            console.error(errorMsg);
            return res.status(500).send(errorMsg);
        }
        console.log('Arquivo secreto encontrado.');

        const base64Key = fs.readFileSync(keyFilePath, 'utf8');
        console.log('Conteúdo do Secret File (Base64) (primeiros 50 chars):', base64Key.substring(0, 50) + '...');

        const credentialsStr = Buffer.from(base64Key, 'base64').toString('utf8');
        console.log('--- CONTEÚDO DECODIFICADO (DEVE SER UM JSON COMPLETO) ---');
        console.log(credentialsStr);
        console.log('--- FIM DO CONTEÚDO DECODIFICADO ---');

        const credentials = JSON.parse(credentialsStr);
        console.log('JSON parseado com sucesso.');
        console.log('client_email:', credentials.client_email);
        console.log('private_key (início):', credentials.private_key.substring(0, 40) + '...');
        console.log('private_key (fim):', '...' + credentials.private_key.slice(-40));
        console.log('A chave privada contém "\\n"?', credentials.private_key.includes('\n'));
        console.log('A chave privada termina com "-----END PRIVATE KEY-----"?', credentials.private_key.trim().endsWith('-----END PRIVATE KEY-----'));
        
        res.status(200).send('Debug executado com sucesso. Verifique os logs do servidor na Render.');
    } catch (error) {
        console.error('--- ERRO NO DEBUG DE CREDENCIAIS ---', error);
        res.status(500).send(`Ocorreu um erro durante o debug: ${error.message}`);
    } finally {
        console.log('--- FIM DO DEBUG DE CREDENCIAIS ---');
    }
});
// Função para fazer upload para o Google Drive
const uploadToDrive = async (fileObject) => {
    if (!fileObject) {
        return null;
    }
    
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    try {
        const { data } = await drive.files.create({
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream,
            },
            requestBody: {
                name: fileObject.originalname,
                parents: [GOOGLE_DRIVE_FOLDER_ID],
            },
            fields: 'id, webContentLink',
        });

        await drive.permissions.create({
            fileId: data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return data.webContentLink;

    } catch (error) {
        console.error('Erro no upload para o Google Drive:', error.message);
        if (error.errors) console.error('Detalhes do erro do Google:', error.errors);
        throw new Error('Falha ao enviar o arquivo para o Google Drive.');
    }
};


// --- ROTAS --- (As rotas abaixo permanecem inalteradas)

// Login
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

// Criação de Usuário
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

// Esqueci minha senha
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ Login: email });
        if (!user) return res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
        
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();
        
        const resetURL = `https://patri-on.vercel.app/reset-password/${resetToken}`;
        const mailOptions = { from: '"Suporte PatriOn" <suporte@patrion.com>', to: user.Login, subject: 'Redefinição de Senha - PatriOn', text: `Link para redefinir sua senha: ${resetURL}` };
        
        let info = await mailTransporter.sendMail(mailOptions);
        console.log("E-mail de redefinição enviado. Preview URL: %s", nodemailer.getTestMessageUrl(info));
        res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
    } catch (error) { res.status(500).json({ message: "Erro interno no servidor." }); }
});

// Redefinir Senha
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

// Get Setores
app.get('/api/sectors', async (req, res) => {
    try {
        const sectors = await Sector.find().sort({ nome: 1 });
        res.json(sectors);
    } catch (error) { res.status(500).json({ message: "Erro ao buscar setores." }); }
});

// GET Inventário
app.get('/api/inventory', async (req, res) => {
    try {
        const { setorId } = req.query;
        const filter = (setorId && setorId !== 'Todos') ? { setor: setorId } : {};
        
        const itemsFromDB = await InventoryItem.find(filter)
            .populate('setor')
            .populate({ path: 'historicoSetores.setor', model: 'Sector' })
            .lean();

        const itemsWithDepreciation = itemsFromDB.map(item => {
            if (item.entrada && item.valor > 0 && item.taxaDepreciacao >= 0) {
                const hoje = new Date();
                const dataEntrada = new Date(item.entrada);
                const diffAnos = (hoje - dataEntrada) / (1000 * 60 * 60 * 24 * 365.25);
                const depreciacaoTotal = item.valor * (item.taxaDepreciacao / 100) * diffAnos;
                item.valorAtual = Math.max(0, item.valor - depreciacaoTotal);
            } else {
                item.valorAtual = item.valor;
            }
            return item;
        });

        res.json(itemsWithDepreciation);
    } catch (error) { res.status(500).json({ message: "Erro ao buscar inventário.", error: error.message }); }
});

// POST Inventário
app.post('/api/inventory', upload.single('foto'), async (req, res) => {
    try {
        const newItemData = { ...req.body };
        
        const fotoUrl = await uploadToDrive(req.file);
        if (fotoUrl) {
            newItemData.foto = fotoUrl;
        }

        newItemData.historicoSetores = [{ setor: newItemData.setor, dataMudanca: new Date() }];
        const newItem = new InventoryItem(newItemData);
        await newItem.save();
        const populatedItem = await InventoryItem.findById(newItem._id)
            .populate('setor')
            .populate({ path: 'historicoSetores.setor', model: 'Sector' });
        res.status(201).json({ message: 'Item cadastrado com sucesso!', item: populatedItem });
    } catch (error) {
        console.error('Erro detalhado ao cadastrar item:', error);
        res.status(500).json({ message: error.message || 'Erro ao cadastrar o item.', error });
    }
});


// PUT Inventário
app.put('/api/inventory/:id', upload.single('foto'), async (req, res) => {
    try {
        const updatedData = { ...req.body };
        
        if (req.file) {
            const fotoUrl = await uploadToDrive(req.file);
            updatedData.foto = fotoUrl;
        }
        
        const itemAntes = await InventoryItem.findById(req.params.id);
        if (!itemAntes) return res.status(404).json({ message: 'Item não encontrado.' });

        const setorAnterior = itemAntes.setor.toString();
        const setorNovo = updatedData.setor;

        if (setorAnterior !== setorNovo) {
            await InventoryItem.findByIdAndUpdate(req.params.id, {
                $push: {
                    historicoSetores: {
                        setor: setorNovo,
                        dataMudanca: new Date()
                    }
                }
            });
        }

        const updatedItem = await InventoryItem.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true }
        )
        .populate('setor')
        .populate({ path: 'historicoSetores.setor', model: 'Sector' });

        res.status(200).json({ message: 'Item atualizado com sucesso!', item: updatedItem });

    } catch (error) {
        console.error('Erro detalhado ao atualizar item:', error);
        res.status(500).json({ message: error.message || 'Erro ao atualizar o item.', error: error.message });
    }
});


// Buscar por número de patrimônio
app.get('/api/inventory/by-patrimonio/:patrimonioId', async (req, res) => {
    try {
        const item = await InventoryItem.findOne({ numeroPatrimonio: req.params.patrimonioId })
            .populate('setor')
            .populate({ path: 'historicoSetores.setor', model: 'Sector' });

        if (!item) return res.status(404).json({ message: 'Nenhum item encontrado com este número de patrimônio.' });

        let itemObj = item.toObject();
        if (item.entrada && item.valor > 0 && item.taxaDepreciacao >= 0) {
            const hoje = new Date();
            const dataEntrada = new Date(item.entrada);
            const diffAnos = (hoje - dataEntrada) / (1000 * 60 * 60 * 24 * 365.25);
            const depreciacaoTotal = item.valor * (item.taxaDepreciacao / 100) * diffAnos;
            itemObj.valorAtual = Math.max(0, item.valor - depreciacaoTotal);
        } else {
            itemObj.valorAtual = item.valor;
        }

        res.json(itemObj);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar item por patrimônio.", error: error.message });
    }
});

// DELETE Inventário
app.delete('/api/inventory/:id', async (req, res) => {
    try {
        const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json({ message: 'Item não encontrado.' });
        res.status(200).json({ message: 'Item apagado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar o item.', error });
    }
});

// Inicialização
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
