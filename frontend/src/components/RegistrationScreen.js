// frontend/src/components/RegistrationScreen.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './RegistrationScreen.css';

const RegistrationScreen = () => {
    const initialFormState = {
        'N Patrimonio Anterior': '',
        'N de Patrimonio': '',
        'Descricao do Bem': '',
        'CLASSIFICACAO': 'BOM',
        'Setor': '',
        'Outra Identificacao': '',
        'Observacao': '',
        'Foto': ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [file, setFile] = useState(null);
    const [sectors, setSectors] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/api/sectors')
            .then(response => {
                if (response.data.length > 0) {
                    setSectors(response.data);
                    // Define um setor padrão se o campo estiver vazio
                    setFormData(prevState => ({...prevState, Setor: response.data[0]}));
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
            document.getElementById('file-input').value = '';
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
                            
                            {/* ======================================= */}
                            {/* CAMPO ADICIONADO */}
                            {/* ======================================= */}
                            <div className="form-group">
                                <label>Nº Patrimônio Anterior</label>
                                <input type="text" name="N Patrimonio Anterior" value={formData['N Patrimonio Anterior']} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label>Nº Patrimônio</label>
                                <input type="text" name="N de Patrimonio" value={formData['N de Patrimonio']} onChange={handleChange} required />
                            </div>
                            <div className="form-group full-width">
                                <label>Descrição do Bem</label>
                                <input type="text" name="Descricao do Bem" value={formData['Descricao do Bem']} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Classificação</label>
                                <select name="CLASSIFICACAO" value={formData.CLASSIFICACAO} onChange={handleChange}>
                                    <option value="BOM">Bom</option>
                                    <option value="OTIMO">Ótimo</option>
                                    <option value="INSERVIVEL">Inservível</option>
                                    <option value="OCIOSO">Ocioso</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Setor</label>
                                <select name="Setor" value={formData.Setor} onChange={handleChange} required>
                                    <option value="" disabled>Selecione um setor</option>
                                    {sectors.map(sector => <option key={sector} value={sector}>{sector}</option>)}
                                </select>
                            </div>

                            {/* ======================================= */}
                            {/* CAMPO ADICIONADO */}
                            {/* ======================================= */}
                            <div className="form-group">
                                <label>Outra Identificação</label>
                                <input type="text" name="Outra Identificacao" value={formData['Outra Identificacao']} onChange={handleChange} />
                            </div>

                             <div className="form-group">
                                <label>Foto do Equipamento</label>
                                <input type="file" id="file-input" name="foto" onChange={handleFileChange} />
                            </div>
                            
                            {/* ======================================= */}
                            {/* CAMPO ADICIONADO */}
                            {/* ======================================= */}
                            <div className="form-group full-width">
                                <label>Observação</label>
                                <textarea name="Observacao" value={formData.Observacao} onChange={handleChange}></textarea>
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