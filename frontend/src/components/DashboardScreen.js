// frontend/src/components/DashboardScreen.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import './DashboardScreen.css';

// Importando componentes e helpers do Chart.js
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, getElementAtEvent } from 'react-chartjs-2';

// Registrando os componentes necessários
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const DashboardScreen = () => {
    // Estados existentes
    const [sectors, setSectors] = useState([]);
    const [selectedSector, setSelectedSector] = useState('Todos');
    const [inventoryData, setInventoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- NOVOS ESTADOS PARA INTERATIVIDADE ---
    const [chartFilter, setChartFilter] = useState({ type: null, value: null });
    const [filteredInventory, setFilteredInventory] = useState([]);

    // Referências para os gráficos para capturar eventos de clique
    const barChartRef = useRef();
    const doughnutChartRef = useRef();

    // Busca a lista de setores (sem alteração)
    useEffect(() => {
        axios.get('http://localhost:5000/api/sectors')
            .then(response => setSectors(['Todos', ...response.data]))
            .catch(error => console.error("Erro ao buscar setores:", error));
    }, []);

    // Busca dados do inventário quando o filtro de SETOR muda
    useEffect(() => {
        setLoading(true);
        axios.get(`http://localhost:5000/api/inventory?setor=${selectedSector}`)
            .then(response => {
                setInventoryData(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar dados do inventário:", error);
                setLoading(false);
            });
    }, [selectedSector]);

    // --- NOVO EFEITO: Aplica o filtro do gráfico nos dados ---
    // Roda sempre que os dados principais (inventoryData) ou o filtro do gráfico (chartFilter) mudam
    useEffect(() => {
        if (!chartFilter.type || !chartFilter.value) {
            setFilteredInventory(inventoryData); // Se não há filtro, mostra tudo
        } else {
            const filtered = inventoryData.filter(item => item[chartFilter.type] === chartFilter.value);
            setFilteredInventory(filtered);
        }
    }, [inventoryData, chartFilter]);


    // Funções de processamento de dados (agora usam os dados já filtrados)
    const processDataForChart = (columnName) => {
        const counts = filteredInventory.reduce((acc, item) => {
            const key = item[columnName] || 'Não Definido';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return counts;
    };

    const barChartData = {
        labels: Object.keys(processDataForChart('Outra Identificacao')),
        datasets: [{
            label: 'Contagem por Outra Identificação',
            data: Object.values(processDataForChart('Outra Identificacao')),
            backgroundColor: '#2196f3',
        }],
    };
    
    const doughnutChartData = {
        labels: Object.keys(processDataForChart('CLASSIFICACAO')),
        datasets: [{
            data: Object.values(processDataForChart('CLASSIFICACAO')),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        }],
    };

    // --- NOVAS FUNÇÕES: Lidam com os cliques nos gráficos ---
    const handleBarChartClick = (event) => {
        const element = getElementAtEvent(barChartRef.current, event);
        if (element.length > 0) {
            const clickedLabel = barChartData.labels[element[0].index];
            setChartFilter({ type: 'Outra Identificacao', value: clickedLabel });
        }
    };
    
    const handleDoughnutChartClick = (event) => {
        const element = getElementAtEvent(doughnutChartRef.current, event);
        if (element.length > 0) {
            const clickedLabel = doughnutChartData.labels[element[0].index];
            setChartFilter({ type: 'CLASSIFICACAO', value: clickedLabel });
        }
    };

    return (
        <div className="dashboard-page">
            <Navbar />
            <main className="dashboard-content">
                <h1 className="dashboard-title">Dashboard de Ativos</h1>
                
                <div className="filter-container">
                    <label htmlFor="sector-filter">Filtrar por Setor:</label>
                    <select id="sector-filter" value={selectedSector} onChange={(e) => {
                        setSelectedSector(e.target.value);
                        setChartFilter({ type: null, value: null }); // Limpa o filtro do gráfico ao mudar de setor
                    }}>
                        {sectors.map(sector => <option key={sector} value={sector}>{sector}</option>)}
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

                        {/* --- NOVA SEÇÃO: Tabela de Dados Filtrados --- */}
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
                                        {filteredInventory.map((item, index) => (
                                            <tr key={`${item['N de Patrimonio']}-${index}`}>
                                                <td>{item['N de Patrimonio']}</td>
                                                <td>{item['Descricao do Bem']}</td>
                                                <td>{item.Setor}</td>
                                                <td>{item['Outra Identificacao']}</td>
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