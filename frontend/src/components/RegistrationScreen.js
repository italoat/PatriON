// frontend/src/components/RegistrationScreen.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './RegistrationScreen.css';

const RegistrationScreen = () => {
    const initialFormState = {
        numeroPatrimonioAnterior: '',
        numeroPatrimonio: '',
        descricao: '',
        classificacao: 'BOM',
        setor: '', // Irá guardar o ID do setor selecionado
        outraIdentificacao: '',
        observacao: '',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [file, setFile] = useState(null);
    const [sectors, setSectors] = useState([]);
    const [message, setMessage] = useState('');

    // Efeito para buscar a lista de setores quando a página carregar
    useEffect(() => {
        axios.get('http://localhost:5000/api/sectors')
            .then(response => {
                setSectors(response.data);
                // Se houver setores, pré-seleciona o primeiro no formulário
                if (response.data.length > 0) {
                    setFormData(prevState => ({ ...prevState, setor: response.data[0]._id }));
                }
            })
            .catch(error => console.error("Erro ao buscar setores:", error));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage('');

        const dataToSubmit = new FormData();
        for (const key in formData) {
            dataToSubmit.append(key, formData[key]);
        }
        if (file) {
            dataToSubmit.append('foto', file);
        }

        axios.post('http://localhost:5000/api/inventory', dataToSubmit, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(response => {
            setMessage('Item cadastrado com sucesso!');
            setFormData(initialFormState);
            setFile(null);
            if (document.getElementById('file-input')) {
                document.getElementById('file-input').value = '';
            }
        })
        .catch(error => {
            console.error('Erro ao cadastrar item:', error);
            setMessage('Falha ao cadastrar o item. Tente novamente.');
        });
    };

    return (
        <div className="registration-page">
            <Navbar />
            <main className="registration-content">
                <div className="form-container">
                    <h1>Cadastro de Novo Item</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nº Patrimônio Anterior</label>
                                <input type="text" name="numeroPatrimonioAnterior" value={formData.numeroPatrimonioAnterior} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Nº Patrimônio</label>
                                <input type="text" name="numeroPatrimonio" value={formData.numeroPatrimonio} onChange={handleChange} required />
                            </div>
                            <div className="form-group full-width">
                                <label>Descrição do Bem</label>
                                <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Classificação</label>
                                <select name="classificacao" value={formData.classificacao} onChange={handleChange}>
                                    <option value="BOM">Bom</option>
                                    <option value="OTIMO">Ótimo</option>
                                    <option value="INSERVIVEL">Inservível</option>
                                    <option value="OCIOSO">Ocioso</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Setor</label>
                                <select name="setor" value={formData.setor} onChange={handleChange} required>
                                    <option value="" disabled>Selecione um setor</option>
                                    {sectors.map(sector => (
                                        <option key={sector._id} value={sector._id}>{sector.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Outra Identificação</label>
                                <input type="text" name="outraIdentificacao" value={formData.outraIdentificacao} onChange={handleChange} />
                            </div>
                             <div className="form-group">
                                <label>Foto do Equipamento</label>
                                <input type="file" id="file-input" name="foto" onChange={handleFileChange} />
                            </div>
                            <div className="form-group full-width">
                                <label>Observação</label>
                                <textarea name="observacao" value={formData.observacao} onChange={handleChange}></textarea>
                            </div>
                        </div>
                        <button type="submit" className="submit-button">Cadastrar Item</button>
                    </form>
                    {message && <p className="form-message">{message}</p>}
                </div>
            </main>
        </div>
    );
};

export default RegistrationScreen;