// Brawl Leagues Dashboard Script
// Configuration
const CONFIG = {
    SHEETS_BASE_URL: 'https://docs.google.com/spreadsheets/d/1DHY3yb-yq1Liq7OU8A-90J_82YbT_rpG7ZYIwKD2tMQ/export?format=csv&gid=',
    EVENTS_BASE_URL: 'https://docs.google.com/spreadsheets/d/1xZ61dtzhYiAxR3yC4q662r4NPOSrjWEYPDpMMpDYU70/export?format=csv&gid=',
    SHEET_GIDS: {
        general: '1031439616',
        divisions: '279248867',
        history: '1925467386',
        friendlies: '976364986',
        dragonEvent: '616991084',
        valyrianEvent: '2132978233',
    },
    REFRESH_INTERVAL: 30 * 1000 // 30 seconds
};

// Utility functions
function parseCSV(csvText) {
    const rows = csvText.split('\n').map(row => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"(.*)"$/, '$1'));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"(.*)"$/, '$1'));
        return values;
    });
    
    return rows.filter(row => row.some(cell => cell.length > 0));
}

async function fetchSheetData(gid, baseUrl = CONFIG.SHEETS_BASE_URL) {
    const url = `${baseUrl}${gid}&_=${new Date().getTime()}`; // Cache busting
    console.log('Fetching:', url);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv',
            },
            cache: 'no-cache' // Force fresh data
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        if (csvText.trim().startsWith('<')) {
            throw new Error('Sheet appears to be private or inaccessible');
        }
        
        return parseCSV(csvText);
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        throw error;
    }
}

function formatNumber(num) {
    return num.toLocaleString('pt-BR');
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="flex items-center justify-center p-8"><div class="loading"></div></div>';
    }
}

// Data fetching functions
async function fetchCommunityStats() {
    try {
        const rows = await fetchSheetData(CONFIG.SHEET_GIDS.general);
        console.log('Community stats data:', rows);
        
        if (rows.length > 1) {
            const dataRow = rows[1];
            
            const totalTrophies = parseInt(dataRow[1]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
            const previousTrophies = parseInt(dataRow[2]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
            const growthAbsolute = parseInt(dataRow[3]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
            const totalMembers = parseInt(dataRow[5]?.replace(/[^\d]/g, '') || '0');
            const lastUpdate = dataRow[6] || dataRow[9] || new Date().toLocaleDateString('pt-BR');
            
            const growthPercentage = previousTrophies > 0 ? (growthAbsolute / previousTrophies) * 100 : 0;
            const totalClubs = 4;
            
            return {
                totalTrophies,
                previousTrophies,
                growthAbsolute,
                growthPercentage,
                totalMembers,
                totalClubs,
                lastUpdate,
            };
        }
        
        throw new Error('No data found');
    } catch (error) {
        console.error('Error fetching community stats:', error);
        throw error;
    }
}

async function fetchDivisionStats() {
    try {
        const rows = await fetchSheetData(CONFIG.SHEET_GIDS.divisions);
        console.log('Division stats data:', rows);
        
        const divisionMappings = [
            { sheetName: "Luminous League", displayName: "Luminous", color: 'text-gaming-yellow', icon: 'fas fa-star' },
            { sheetName: "Valyrian League", displayName: "Valyrian", color: 'text-gaming-red', icon: 'fas fa-dragon' },
            { sheetName: "Dragon's League", displayName: "Dragon's", color: 'text-gaming-green', icon: 'fas fa-fire' },
            { sheetName: "Cronw's League", displayName: "Crown's", color: 'text-gaming-cyan', icon: 'fas fa-crown' },
        ];
        
        const results = [];
        
        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 6) continue;
            
            const sheetDivisionName = row[0]?.trim();
            const mapping = divisionMappings.find(m => m.sheetName === sheetDivisionName);
            
            if (mapping) {
                const current = parseInt(row[1]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
                const previous = parseInt(row[2]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
                const growth = parseInt(row[3]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
                const percentageText = row[4]?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0';
                const percentage = parseFloat(percentageText);
                const lastUpdate = row[6] || new Date().toLocaleDateString('pt-BR');
                
                results.push({
                    name: mapping.displayName,
                    color: mapping.color,
                    icon: mapping.icon,
                    current,
                    previous,
                    growth,
                    percentage,
                    lastUpdate,
                });
            }
        }
        
        return results;
    } catch (error) {
        console.error('Error fetching division stats:', error);
        throw error;
    }
}

async function fetchFriendlyStats() {
    try {
        const rows = await fetchSheetData(CONFIG.SHEET_GIDS.friendlies);
        console.log('Friendly stats data:', rows);
        
        if (rows.length > 3) {
            const statsRow = rows[3]; // First player row with summary data
            
            const duration = parseInt(statsRow[6]?.replace(/[^\d]/g, '') || '0');
            const entries = parseInt(statsRow[7]?.replace(/[^\d]/g, '') || '0');
            const externalWins = parseInt(statsRow[8]?.replace(/[^\d]/g, '') || '0');
            const total = parseInt(statsRow[9]?.replace(/[^\d]/g, '') || '0');
            const external = parseInt(statsRow[10]?.replace(/[^\d]/g, '') || '0');
            const winRateText = statsRow[11]?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0';
            const winRate = parseFloat(winRateText);
            
            const internal = total - external;
            
            return {
                duration,
                entries,
                externalWins,
                total,
                internal,
                external,
                winRate,
            };
        }
        
        throw new Error('No data found');
    } catch (error) {
        console.error('Error fetching friendly stats:', error);
        throw error;
    }
}

async function fetchPlayerRanking() {
    try {
        const rows = await fetchSheetData(CONFIG.SHEET_GIDS.friendlies);
        console.log('Player ranking data:', rows);
        
        const players = [];
        
        for (let i = 3; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 5) continue;
            
            const name = row[0]?.trim();
            const division = row[1]?.trim() || 'Sem divisão';
            const matches = parseInt(row[2]?.replace(/[^\d]/g, '') || '0');
            const winRateText = row[3]?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0';
            const winRate = parseFloat(winRateText);
            const wins = parseInt(row[4]?.replace(/[^\d]/g, '') || '0');
            
            if (matches === 0 || !name || name === 'atualização') continue;
            
            players.push({
                name,
                division: division.replace(' League', ''),
                matches,
                wins,
                winRate,
            });
        }
        
        return players.sort((a, b) => b.matches - a.matches);
    } catch (error) {
        console.error('Error fetching player ranking:', error);
        throw error;
    }
}

async function fetchHistoricalData() {
    try {
        const rows = await fetchSheetData(CONFIG.SHEET_GIDS.history);
        console.log('Historical data raw:', rows);
        
        const historicalData = [];
        
        // Skip header rows (first 2 rows typically)
        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 6) continue;
            
            const dateStr = row[0]?.trim();
            const monthStr = row[1]?.trim(); // New month column
            if (!dateStr || dateStr === '' || dateStr === 'Data') continue;
            
            console.log('Processing date:', dateStr, 'Month:', monthStr, 'Row:', row);
            
            const luminous = parseInt(row[2]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
            const valyrian = parseInt(row[3]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
            const dragons = parseInt(row[4]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
            const crowns = parseInt(row[5]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
            
            // Only add if at least one division has data
            if (luminous > 0 || valyrian > 0 || dragons > 0 || crowns > 0) {
                historicalData.push({
                    date: dateStr,
                    month: monthStr || dateStr, // Use month column if available, fallback to date
                    luminous,
                    valyrian,
                    dragons,
                    crowns,
                });
            }
        }
        
        // Sort by date (oldest first)
        historicalData.sort((a, b) => {
            const [dayA, monthA, yearA] = a.date.split('/').map(Number);
            const [dayB, monthB, yearB] = b.date.split('/').map(Number);
            
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);
            
            return dateA - dateB;
        });
        
        console.log('Processed historical data:', historicalData);
        return historicalData;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        throw error;
    }
}

async function fetchEventsData() {
    const events = { dragon: null, valyrian: null };
    
    // Dragon's event
    try {
        const dragonRows = await fetchSheetData(CONFIG.SHEET_GIDS.dragonEvent, CONFIG.EVENTS_BASE_URL);
        console.log('Dragon event data:', dragonRows);
        
        const dragonParticipants = [];
        
        for (let i = 1; i < dragonRows.length; i++) { // Show all participants
            const row = dragonRows[i];
            if (!row || row.length < 5) continue;
            
            const name = row[0]?.trim();
            const kills = parseInt(row[1]?.replace(/[^\d]/g, '') || '0');
            const killsScore = parseInt(row[2]?.replace(/[^\d]/g, '') || '0');
            const classificationScore = parseInt(row[3]?.replace(/[^\d]/g, '') || '0');
            const totalScore = parseInt(row[4]?.replace(/[^\d]/g, '') || '0');
            
            if (name && name !== 'ATUALIZAÇÃO' && name !== 'Jogador') {
                dragonParticipants.push({
                    name,
                    kills,
                    killsScore,
                    classificationScore,
                    score: totalScore,
                });
            }
        }
        
        if (dragonParticipants.length > 0) {
            events.dragon = {
                name: 'Campeonato de Combate – 3ª Divisão',
                participants: dragonParticipants,
                lastUpdate: dragonRows[2]?.[6] || new Date().toLocaleDateString('pt-BR'),
            };
        }
    } catch (error) {
        console.log('Dragon event not accessible:', error);
    }
    
    // Valyrian event
    try {
        const valyrianRows = await fetchSheetData(CONFIG.SHEET_GIDS.valyrianEvent, CONFIG.EVENTS_BASE_URL);
        console.log('Valyrian event data:', valyrianRows);
        
        const valyrianParticipants = [];
        
        for (let i = 1; i < valyrianRows.length; i++) { // Show all participants from the sheet
            const row = valyrianRows[i];
            if (!row || row.length < 3) continue;
            
            const name = row[0]?.trim();
            if (!name || name === '' || name === 'ATUALIZAÇÃO' || name === 'Jogador') continue;
            
            const initial = parseInt(row[1]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
            const final = parseInt(row[2]?.replace(/\./g, '').replace(/[^\d]/g, '') || '0');
            const gains = final - initial;
            
            valyrianParticipants.push({
                name,
                initial,
                final,
                gains,
            });
        }
        
        // Sort by gains (highest first)
        valyrianParticipants.sort((a, b) => b.gains - a.gains);
        
        if (valyrianParticipants.length > 0) {
            events.valyrian = {
                name: 'Valyrian Ascent – 2ª Divisão',
                participants: valyrianParticipants,
                lastUpdate: valyrianRows[0]?.[3] || new Date().toLocaleDateString('pt-BR'),
            };
        }
    } catch (error) {
        console.log('Valyrian event not accessible:', error);
    }
    
    return events;
}

// Render functions
function renderCommunityStats(stats) {
    const container = document.getElementById('communityStats');
    const lastUpdateElement = document.getElementById('lastUpdate');
    
    if (lastUpdateElement) {
        lastUpdateElement.textContent = `Última atualização: ${stats.lastUpdate}`;
    }
    
    const statsCards = [
        {
            icon: 'fas fa-trophy',
            color: 'text-gaming-yellow',
            value: formatNumber(stats.totalTrophies),
            label: 'Troféus Totais',
            sublabel: 'Mês Atual'
        },
        {
            icon: 'fas fa-history',
            color: 'text-slate-400',
            value: formatNumber(stats.previousTrophies),
            label: 'Mês Anterior',
            sublabel: 'Dezembro 2024'
        },
        {
            icon: 'fas fa-arrow-up',
            color: 'text-gaming-green',
            value: `+${formatNumber(stats.growthAbsolute)}`,
            label: 'Crescimento',
            sublabel: 'Bruto'
        },
        {
            icon: 'fas fa-percentage',
            color: 'text-gaming-green',
            value: `+${stats.growthPercentage.toFixed(2)}%`,
            label: 'Crescimento',
            sublabel: 'Percentual'
        },
        {
            icon: 'fas fa-users',
            color: 'text-gaming-cyan',
            value: formatNumber(stats.totalMembers),
            label: 'Membros',
            sublabel: 'Ativos'
        },
        {
            icon: 'fas fa-shield-alt',
            color: 'text-gaming-cyan',
            value: formatNumber(stats.totalClubs),
            label: 'Clubes',
            sublabel: 'Registrados'
        }
    ];
    
    container.innerHTML = statsCards.map(card => `
        <div class="gaming-card p-6 text-center rounded-lg transition-all duration-300 hover:scale-105">
            <div class="${card.color} text-3xl mb-2">
                <i class="${card.icon}"></i>
            </div>
            <div class="text-2xl font-bold text-slate-100">
                ${card.value}
            </div>
            <div class="text-sm text-slate-400">${card.label}</div>
            <div class="text-xs text-slate-400 mt-1">${card.sublabel}</div>
        </div>
    `).join('');
}

function renderDivisionStats(divisions) {
    const container = document.getElementById('divisionsContainer');
    
    container.innerHTML = divisions.map(division => `
        <div class="gaming-card p-6 rounded-lg transition-all duration-300 hover:scale-105">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold ${division.color}">${division.name}</h3>
                <div class="${division.color} text-2xl">
                    <i class="${division.icon}"></i>
                </div>
            </div>
            
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-slate-400">Troféus Atuais:</span>
                    <span class="font-bold text-slate-100">
                        ${formatNumber(division.current)}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Mês Anterior:</span>
                    <span class="text-slate-400">
                        ${formatNumber(division.previous)}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Crescimento:</span>
                    <span class="text-gaming-green font-bold">
                        +${formatNumber(division.growth)}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Percentual:</span>
                    <span class="text-gaming-green font-bold">
                        +${division.percentage.toFixed(2)}%
                    </span>
                </div>
            </div>
            
            <div class="mt-4 pt-3 border-t border-slate-600">
                <div class="text-xs text-slate-400">
                    <i class="fas fa-clock mr-1"></i>
                    <span>Atualizado: ${division.lastUpdate}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderFriendlyStats(stats) {
    const container = document.getElementById('friendlyStatsContainer');
    
    const statCards = [
        {
            icon: 'fas fa-clock',
            color: 'text-gaming-cyan',
            value: formatNumber(stats.duration),
            label: 'Minutos',
            sublabel: 'Duração Total',
        },
        {
            icon: 'fas fa-sign-in-alt',
            color: 'text-gaming-green',
            value: formatNumber(stats.entries),
            label: 'Entradas',
            sublabel: 'Total',
        },
        {
            icon: 'fas fa-trophy',
            color: 'text-gaming-yellow',
            value: formatNumber(stats.externalWins),
            label: 'Vitórias',
            sublabel: 'Externas',
        },
        {
            icon: 'fas fa-gamepad',
            color: 'text-gaming-red',
            value: formatNumber(stats.total),
            label: 'Amistosos',
            sublabel: 'Realizados',
        },
        {
            icon: 'fas fa-balance-scale',
            color: 'text-slate-400',
            value: `${stats.internal} / ${stats.external}`,
            label: 'Internos/Externos',
            sublabel: 'Proporção',
        },
        {
            icon: 'fas fa-percentage',
            color: 'text-gaming-green',
            value: `${stats.winRate.toFixed(1)}%`,
            label: 'Taxa de',
            sublabel: 'Vitórias Externas',
        },
    ];
    
    container.innerHTML = statCards.map(card => `
        <div class="gaming-card p-6 text-center rounded-lg transition-all duration-300 hover:scale-105">
            <div class="${card.color} text-3xl mb-2">
                <i class="${card.icon}"></i>
            </div>
            <div class="text-xl font-bold ${card.color === 'text-slate-400' ? 'text-slate-100' : card.color}">
                ${card.value}
            </div>
            <div class="text-sm text-slate-400">${card.label}</div>
            <div class="text-xs text-slate-400">${card.sublabel}</div>
        </div>
    `).join('');
}

function renderPlayerRanking(players) {
    const container = document.getElementById('playersRankingTable');
    
    const getDivisionBadge = (division) => {
        const divisionStyles = {
            "Crown's": "bg-yellow-500 text-black",
            "Cronw's": "bg-yellow-500 text-black",
            "Valyrian": "bg-red-500 text-white",
            "Dragon's": "bg-green-500 text-white",
            "Luminous": "bg-cyan-500 text-white",
            "Sem divisão": "bg-slate-600 text-slate-300",
        };
        
        return divisionStyles[division] || divisionStyles["Sem divisão"];
    };
    
    container.innerHTML = players.map((player, index) => `
        <tr class="border-b border-slate-600/50 hover:bg-yellow-500/10 transition-colors duration-200">
            <td class="py-3 px-4">
                <div class="flex items-center">
                    <span class="${index === 0 ? "text-gaming-yellow font-bold" : "text-slate-400 font-bold"}">
                        #${index + 1}
                    </span>
                    ${index === 0 ? '<i class="fas fa-crown text-gaming-yellow ml-2"></i>' : ''}
                </div>
            </td>
            <td class="py-3 px-4 font-semibold text-slate-100">${player.name}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-bold ${getDivisionBadge(player.division)}">
                    ${player.division}
                </span>
            </td>
            <td class="py-3 px-4 text-center font-bold text-slate-100">
                ${formatNumber(player.matches)}
            </td>
            <td class="py-3 px-4 text-center font-bold text-gaming-green">
                ${formatNumber(player.wins)}
            </td>
            <td class="py-3 px-4 text-center font-bold text-gaming-green">
                ${player.winRate.toFixed(1)}%
            </td>
        </tr>
    `).join('');
}

function renderEvents(events) {
    const container = document.getElementById('eventsContainer');
    let html = '';
    
    // Dragon's League Event
    if (events.dragon) {
        html += `
            <div class="gaming-card p-6 rounded-lg">
                <div class="flex items-center space-x-3 mb-6">
                    <i class="fas fa-fire text-gaming-green text-2xl"></i>
                    <h3 class="text-xl font-bold text-gaming-green">${events.dragon.name}</h3>
                </div>
                
                <div class="space-y-3">
                    ${events.dragon.participants.map(participant => `
                        <div class="grid grid-cols-2 gap-4 p-3 bg-slate-800/50 rounded-lg">
                            <div>
                                <div class="font-semibold text-slate-100">${participant.name}</div>
                                <div class="text-sm text-gaming-yellow">${participant.kills} Kills</div>
                            </div>
                            <div class="text-right">
                                <div class="text-sm text-slate-400">
                                    Pontuação por Kills: <span class="text-gaming-green">${participant.killsScore || 0}</span>
                                </div>
                                <div class="text-sm text-slate-400">
                                    Pontuação por Classificação: <span class="text-gaming-cyan">${participant.classificationScore || 0}</span>
                                </div>
                                <div class="text-gaming-yellow font-bold">
                                    Total: ${formatNumber(participant.score || 0)} pts
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-4 pt-3 border-t border-slate-600 text-xs text-slate-400">
                    <i class="fas fa-clock mr-1"></i>
                    <span>Atualizado em: ${events.dragon.lastUpdate}</span>
                </div>
            </div>
        `;
    }
    
    // Valyrian League Event
    if (events.valyrian) {
        html += `
            <div class="gaming-card p-6 rounded-lg">
                <div class="flex items-center space-x-3 mb-6">
                    <i class="fas fa-dragon text-gaming-red text-2xl"></i>
                    <h3 class="text-xl font-bold text-gaming-red">${events.valyrian.name}</h3>
                </div>
                
                <div class="space-y-3">
                    ${events.valyrian.participants.map((participant, index) => `
                        <div class="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="text-gaming-red font-bold text-lg">
                                    #${index + 1}
                                </div>
                                <div>
                                    <div class="font-semibold text-slate-100">${participant.name}</div>
                                    <div class="text-sm text-slate-400">
                                        Inicial: <span class="text-slate-400">${formatNumber(participant.initial || 0)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-gaming-red font-bold">${formatNumber(participant.final || 0)}</div>
                                <div class="text-sm ${participant.gains >= 0 ? 'text-gaming-green' : 'text-gaming-red'}">
                                    ${participant.gains >= 0 ? '+' : ''}${formatNumber(participant.gains || 0)}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-4 pt-3 border-t border-slate-600 text-xs text-slate-400">
                    <i class="fas fa-clock mr-1"></i>
                    <span>Atualizado em: ${events.valyrian.lastUpdate}</span>
                </div>
            </div>
        `;
    }
    
    if (!html) {
        html = '<div class="col-span-2 text-center text-slate-400 py-8">Nenhum evento disponível no momento</div>';
    }
    
    container.innerHTML = html;
}

let chartInstance = null;

function renderHistoricalChart(historicalData) {
    const canvas = document.getElementById('historyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historicalData.map(item => {
                console.log('Using month label:', item.month);
                
                // Use the month column directly from the spreadsheet
                if (item.month && item.month !== item.date) {
                    // Extract just the month/year part (e.g., "novembro/2024" -> "Nov/24")
                    const monthStr = item.month.toLowerCase();
                    if (monthStr.includes('/')) {
                        const [monthName, year] = monthStr.split('/');
                        const monthMap = {
                            'janeiro': 'Jan', 'fevereiro': 'Fev', 'março': 'Mar', 'marco': 'Mar',
                            'abril': 'Abr', 'maio': 'Mai', 'junho': 'Jun',
                            'julho': 'Jul', 'agosto': 'Ago', 'setembro': 'Set',
                            'outubro': 'Out', 'novembro': 'Nov', 'dezembro': 'Dez'
                        };
                        const shortMonth = monthMap[monthName.trim()] || monthName.slice(0, 3);
                        const shortYear = year ? year.slice(-2) : '25';
                        return `${shortMonth}/${shortYear}`;
                    }
                    return item.month;
                }
                
                // Fallback to date parsing if month column not available
                const [day, month, year] = item.date.split('/').map(str => str.trim());
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const monthIndex = parseInt(month) - 1;
                const monthName = monthNames[monthIndex] || month;
                const yearShort = year ? year.slice(-2) : '25';
                return `${monthName}/${yearShort}`;
            }),
            datasets: [
                {
                    label: 'Luminous',
                    data: historicalData.map(item => item.luminous),
                    borderColor: '#F59E0B', // Amarelo
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
                {
                    label: 'Valyrian',
                    data: historicalData.map(item => item.valyrian),
                    borderColor: '#EF4444', // Vermelho
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
                {
                    label: "Dragon's",
                    data: historicalData.map(item => item.dragons),
                    borderColor: '#10B981', // Verde
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
                {
                    label: "Crown's",
                    data: historicalData.map(item => item.crowns),
                    borderColor: '#06B6D4', // Azul/Ciano
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#F8FAFC',
                        usePointStyle: true,
                        padding: 20,
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#F8FAFC',
                    bodyColor: '#F8FAFC',
                    borderColor: '#475569',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')} troféus`;
                        }
                    }
                },
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#94A3B8',
                        callback: function(value) {
                            // Format large numbers with K/M notation
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(0) + 'K';
                            }
                            return value.toLocaleString('pt-BR');
                        },
                    },
                    grid: {
                        color: '#1E293B',
                        drawBorder: false,
                    },
                },
                x: {
                    ticks: {
                        color: '#94A3B8',
                        maxRotation: 45,
                    },
                    grid: {
                        color: '#1E293B',
                        drawBorder: false,
                    },
                },
            },
        },
    });
}

// Main application
class BrawlLeaguesDashboard {
    constructor() {
        this.init();
        this.startAutoRefresh();
    }
    
    async init() {
        console.log('Initializing Brawl Leagues Dashboard...');
        await this.loadAllData();
    }
    
    async loadAllData() {
        try {
            // Load community stats
            try {
                const stats = await fetchCommunityStats();
                renderCommunityStats(stats);
            } catch (error) {
                console.error('Failed to load community stats:', error);
                document.getElementById('communityStats').innerHTML = 
                    '<div class="col-span-6 text-center text-red-400 p-8">Erro ao carregar estatísticas da comunidade</div>';
            }
            
            // Load division stats
            try {
                const divisions = await fetchDivisionStats();
                renderDivisionStats(divisions);
            } catch (error) {
                console.error('Failed to load division stats:', error);
                document.getElementById('divisionsContainer').innerHTML = 
                    '<div class="col-span-4 text-center text-red-400 p-8">Erro ao carregar estatísticas das divisões</div>';
            }
            
            // Load friendly stats
            try {
                const friendlyStats = await fetchFriendlyStats();
                renderFriendlyStats(friendlyStats);
            } catch (error) {
                console.error('Failed to load friendly stats:', error);
                document.getElementById('friendlyStatsContainer').innerHTML = 
                    '<div class="col-span-6 text-center text-red-400 p-8">Erro ao carregar estatísticas de amistosos</div>';
            }
            
            // Load player ranking
            try {
                const players = await fetchPlayerRanking();
                renderPlayerRanking(players);
            } catch (error) {
                console.error('Failed to load player ranking:', error);
                document.getElementById('playersRankingTable').innerHTML = 
                    '<tr><td colspan="6" class="text-center text-red-400 p-8">Erro ao carregar ranking de jogadores</td></tr>';
            }
            
            // Load historical data
            try {
                const historicalData = await fetchHistoricalData();
                renderHistoricalChart(historicalData);
            } catch (error) {
                console.error('Failed to load historical data:', error);
                const canvas = document.getElementById('historyChart');
                if (canvas) {
                    canvas.style.display = 'none';
                    canvas.parentElement.innerHTML = '<div class="text-center text-red-400 p-8">Erro ao carregar dados históricos</div>';
                }
            }
            
            // Load events
            try {
                const events = await fetchEventsData();
                renderEvents(events);
            } catch (error) {
                console.error('Failed to load events:', error);
                document.getElementById('eventsContainer').innerHTML = 
                    '<div class="col-span-2 text-center text-red-400 p-8">Erro ao carregar eventos</div>';
            }
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }
    
    startAutoRefresh() {
        setInterval(() => {
            console.log('Auto-refreshing dashboard data...');
            this.loadAllData();
        }, CONFIG.REFRESH_INTERVAL);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BrawlLeaguesDashboard();
});