// frontend/src/components/DashboardScreen.js (VERSÃO MONGODB RELACIONAL)

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './DashboardScreen.css';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, getElementAtEvent } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const DashboardScreen = () => {
    // Os setores agora são um array de objetos [{ _id, nome }]
    const [sectors, setSectors] = useState([]);
    const [selectedSectorId, setSelectedSectorId] = useState('Todos');
    
    // Guarda os dados originais vindos da API (filtrados por setor)
    const [inventoryData, setInventoryData] = useState([]);
    // Guarda os dados que serão exibidos (após o filtro de clique no gráfico)
    const [filteredInventory, setFilteredInventory] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [chartFilter, setChartFilter] = useState({ type: null, value: null });

    const barChartRef = useRef();
    const doughnutChartRef = useRef();

    // Busca a lista de setores
    useEffect(() => {
        axios.get('http://localhost:5000/api/sectors')
            .then(response => setSectors(response.data))
            .catch(error => console.error("Erro ao buscar setores:", error));
    }, []);

    // Busca dados do inventário sempre que o ID do setor selecionado mudar
    useEffect(() => {
        setLoading(true);
        // Enviamos o ID do setor para a API, não o nome
        const url = `http://localhost:5000/api/inventory?setorId=${selectedSectorId}`;
        axios.get(url)
            .then(response => {
                setInventoryData(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar dados do inventário:", error);
                setLoading(false);
            });
    }, [selectedSectorId]);

    // Aplica o filtro do gráfico nos dados
    useEffect(() => {
        if (!chartFilter.type || !chartFilter.value) {
            setFilteredInventory(inventoryData);
        } else {
            const filtered = inventoryData.filter(item => item[chartFilter.type] === chartFilter.value);
            setFilteredInventory(filtered);
        }
    }, [inventoryData, chartFilter]);


    const processDataForChart = (columnName) => {
        const counts = filteredInventory.reduce((acc, item) => {
            const key = item[columnName] || 'Não Definido';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return counts;
    };
    
    // As funções de processamento usam os novos nomes de campo (ex: 'outraIdentificacao')
    const barChartData = {
        labels: Object.keys(processDataForChart('outraIdentificacao')),
        datasets: [{
            label: 'Contagem por Outra Identificação',
            data: Object.values(processDataForChart('outraIdentificacao')),
            backgroundColor: '#2196f3',
        }],
    };
    
    const doughnutChartData = {
        labels: Object.keys(processDataForChart('classificacao')),
        datasets: [{
            data: Object.values(processDataForChart('classificacao')),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        }],
    };

    // Os handlers de clique usam os novos nomes de campo
    const handleBarChartClick = (event) => {
        const element = getElementAtEvent(barChartRef.current, event);
        if (element.length > 0) {
            const clickedLabel = barChartData.labels[element[0].index];
            setChartFilter({ type: 'outraIdentificacao', value: clickedLabel });
        }
    };
    
    const handleDoughnutChartClick = (event) => {
        const element = getElementAtEvent(doughnutChartRef.current, event);
        if (element.length > 0) {
            const clickedLabel = doughnutChartData.labels[element[0].index];
            setChartFilter({ type: 'classificacao', value: clickedLabel });
        }
    };

    return (
        <div className="dashboard-page">
            <Navbar />
            <main className="dashboard-content">
                <h1 className="dashboard-title">Dashboard de Ativos</h1>
                
                <div className="filter-container">
                    <label htmlFor="sector-filter">Filtrar por Setor:</label>
                    <select id="sector-filter" value={selectedSectorId} onChange={(e) => {
                        setSelectedSectorId(e.target.value);
                        setChartFilter({ type: null, value: null });
                    }}>
                        <option value="Todos">Todos os Setores</option>
                        {/* O dropdown de filtro agora usa o _id como valor e o nome como texto */}
                        {sectors.map(sector => 
                            <option key={sector._id} value={sector._id}>{sector.nome}</option>
                        )}
                    </select>
                </div>

                {loading ? <p className="loading-message">Carregando dados...</p> : (
                    <>
                        <div className="charts-grid">
                            <div className="chart-card">
                                <h3>Bens por Outra Identificação</h3>
                                <Bar ref={barChartRef} data={barChartData} onClick={handleBarChartClick} options={{ responsive: true, indexAxis: 'y' }} />
                            </div>
                            <div className="chart-card chart-card-doughnut">
                                <h3>Bens por Classificação</h3>
                                <Doughnut ref={doughnutChartRef} data={doughnutChartData} onClick={handleDoughnutChartClick} options={{ responsive: true }} />
                            </div>
                        </div>

                        <div className="table-section">
                            <div className="table-header">
                                <h2>Itens Exibidos {chartFilter.value ? `(Filtro: ${chartFilter.value})` : '(Todos)'}</h2>
                                {chartFilter.value && (
                                    <button onClick={() => setChartFilter({ type: null, value: null })} className="clear-filter-button">
                                        Limpar Filtro
                                    </button>
                                )}
                            </div>
                            <div className="table-container">
                                <table className="inventory-table">
                                    <thead>
                                        <tr>
                                            <th>Nº Patrimônio</th>
                                            <th>Descrição</th>
                                            <th>Setor</th>
                                            <th>Outra Identificação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* A tabela no final da página também usa os novos nomes de campo e o setor populado */}
                                        {filteredInventory.map(item => (
                                            <tr key={item._id}>
                                                <td>{item.numeroPatrimonio}</td>
                                                <td>{item.descricao}</td>
                                                <td>{item.setor ? item.setor.nome : 'N/A'}</td>
                                                <td>{item.outraIdentificacao}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default DashboardScreen;