document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    checkSavedTheme();
    
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) { splash.classList.add('fade-out'); }
    }, 2500); 
});

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if(type === 'success') icon = 'check_circle';
    if(type === 'error') icon = 'error';

    toast.innerHTML = `<span class="material-symbols-outlined" style="font-size: 24px;">${icon}</span> <p>${message}</p>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3500);
}

// === NOVO BANCO DE DADOS (COM ZONAS SEGURAS) ===
const defaultSabrinaSeraphims = [
    { 
        id: 'SR-001', name: 'Stella Pires Freitas', location: 'ETEC Santa Ifigênia',
        safeZones: [{ name: 'ETEC', active: true }]
    },
    { 
        id: 'SR-002', name: 'Serena Pires Freitas', location: 'USP',
        safeZones: [{ name: 'USP', active: true }, { name: 'Casa', active: true }]
    }
];

function initDatabase() {
    let users = JSON.parse(localStorage.getItem('app_users'));
    if (!users) {
        users = [{
            name: 'Sabrina Freitas', email: 'root', password: '1234',
            username: '@sabrfrei073', phone: '+55 (11) 9 9719-4320', address: 'Parque das Flores, Osasco - SP',
            seraphims: defaultSabrinaSeraphims
        }];
        localStorage.setItem('app_users', JSON.stringify(users));
    }
}

function handleLogin() {
    const emailInput = document.getElementById('login-email').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();
    const errorMsg = document.getElementById('login-error');
    let users = JSON.parse(localStorage.getItem('app_users'));
    const userFound = users.find(u => u.email === emailInput && u.password === passInput);

    if (userFound) {
        errorMsg.style.display = 'none';
        localStorage.setItem('logged_user_email', userFound.email); 
        loadUserData(userFound); 
        navigateTo('home-screen'); 
        document.getElementById('login-email').value = '';
        document.getElementById('login-pass').value = '';
    } else {
        showToast('E-mail ou senha incorretos!', 'error');
    }
}

function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    const errorMsg = document.getElementById('reg-error');

    if (name === '' || email === '' || pass === '') { errorMsg.style.display = 'block'; return; }

    let users = JSON.parse(localStorage.getItem('app_users'));
    if (users.find(u => u.email === email)) {
        errorMsg.innerText = "Este E-mail já está cadastrado!";
        errorMsg.style.display = 'block'; return;
    }

    const newUser = { name: name, email: email, password: pass, seraphims: [] };
    users.push(newUser);
    localStorage.setItem('app_users', JSON.stringify(users));
    localStorage.setItem('logged_user_email', newUser.email);
    loadUserData(newUser);
    navigateTo('home-screen');
    
    document.getElementById('reg-name').value = ''; document.getElementById('reg-email').value = ''; document.getElementById('reg-pass').value = '';
    errorMsg.style.display = 'none';
}

function loadUserData(user) {
    document.getElementById('home-user-name').innerText = user.name.toUpperCase();
    document.getElementById('settings-user-name').innerText = user.name;
    document.getElementById('settings-user-email').innerText = user.email;
    document.getElementById('settings-username').innerText = user.username || `@${user.name.split(' ')[0].toLowerCase()}`;
    document.getElementById('settings-phone').innerText = user.phone || 'Não informado';
    document.getElementById('settings-address').innerText = user.address || 'Brasil';

    const avatarUrl = `https://ui-avatars.com/api/?name=${user.name}&background=DEBC9F&color=000`;
    document.getElementById('home-avatar').src = avatarUrl; document.getElementById('settings-avatar').src = avatarUrl;
    renderSeraphims(user.seraphims);
    clearChat(user.name);
}

function renderSeraphims(seraphimsArray) {
    const listContainer = document.getElementById('dynamic-trackers-list');
    listContainer.innerHTML = ''; 
    const featuredName = document.getElementById('home-featured-name');
    const featuredLocation = document.getElementById('home-featured-location');

    if (seraphimsArray.length === 0) {
        listContainer.innerHTML = '<p style="font-size:12px; color:var(--text-muted); margin-top:10px;">Nenhum anjinho cadastrado ainda.</p>';
        featuredName.innerText = "Sem Anjinhos"; featuredLocation.innerText = "Cadastre um rastreador abaixo.";
        return;
    }

    featuredName.innerText = seraphimsArray[0].name;
    if (seraphimsArray[0].location.includes('ALERTA')) {
        featuredLocation.innerHTML = `<span style="color: #D32F2F;">${seraphimsArray[0].location}</span>`;
    } else {
        featuredLocation.innerText = seraphimsArray[0].location;
    }

    const featuredCard = document.querySelector('.map-card');
    featuredCard.onclick = () => openTrackerProfile(seraphimsArray[0].id);

    seraphimsArray.forEach(sera => {
        listContainer.innerHTML += `
            <div class="tracker-item" onclick="openTrackerProfile('${sera.id}')">
                <img src="https://ui-avatars.com/api/?name=${sera.name}&background=DEBC9F&color=000" class="avatar">
                <div class="tracker-info">
                    <h4>${sera.name}</h4>
                    <p>Última localização: ${sera.location}</p>
                </div>
                <span class="material-symbols-outlined">arrow_forward</span>
            </div>
        `;
    });
}

// === LÓGICA DO PERFIL E GEOFENCING (BUG FIX) ===
let currentOpenSeraphimId = null;

function openTrackerProfile(seraphimId) {
    const loggedEmail = localStorage.getItem('logged_user_email');
    let users = JSON.parse(localStorage.getItem('app_users'));
    const currentUser = users.find(u => u.email === loggedEmail);

    if (currentUser) {
        const clickedSeraphim = currentUser.seraphims.find(s => s.id === seraphimId);

        if (clickedSeraphim) {
            currentOpenSeraphimId = clickedSeraphim.id;

            document.getElementById('profile-name').innerText = clickedSeraphim.name;
            document.getElementById('profile-avatar').src = `https://ui-avatars.com/api/?name=${clickedSeraphim.name}&background=DEBC9F&color=000`;
            const bpm = Math.floor(Math.random() * (100 - 70 + 1)) + 70;
            document.getElementById('profile-bpm').innerText = `${bpm} BPM`;

            let statusEl = document.getElementById('profile-status');
            if (clickedSeraphim.location.includes('ALERTA')) {
                statusEl.innerText = "🚨 ALERTA CRÍTICO!"; statusEl.style.color = "#FF5252";
            } else {
                statusEl.innerText = "Online • Atualizado agora"; statusEl.style.color = "#00C853";
            }

            // LIMPA E CARREGA AS ZONAS DESSE ANJINHO ESPECÍFICO!
            const safeZonesList = document.getElementById('safe-zones-list');
            safeZonesList.innerHTML = '';
            
            // Corrige se for uma conta velha que não tinha safeZones criadas
            if(!clickedSeraphim.safeZones) { clickedSeraphim.safeZones = []; }

            clickedSeraphim.safeZones.forEach((zone, index) => {
                let toggleClass = zone.active ? 'active' : '';
                safeZonesList.innerHTML += `
                    <div class="settings-item" onclick="toggleSafeZone(${index})" style="cursor: pointer;">
                        <div class="settings-icon"><span class="material-symbols-outlined">place</span></div>
                        <div class="item-text">
                            <p>${zone.name}</p>
                            <small>Raio de 200m</small>
                        </div>
                        <div class="toggle ${toggleClass}"></div>
                    </div>
                `;
            });

            document.getElementById('btn-profile-map').onclick = () => viewOnMap(clickedSeraphim.id);
            navigateTo('tracker-profile-screen');
        }
    }
}

// ADICIONAR NOVA ZONA (SALVANDO NO BANCO DE DADOS DA CONTA CERTA)
function addSafeZone() {
    const zoneName = prompt("Qual o nome da nova Zona Segura? (Ex: Natação, Casa dos Avós, etc.)");
    if (zoneName && zoneName.trim() !== "") {
        const loggedEmail = localStorage.getItem('logged_user_email');
        let users = JSON.parse(localStorage.getItem('app_users'));
        const userIndex = users.findIndex(u => u.email === loggedEmail);
        
        if (userIndex !== -1) {
            let sera = users[userIndex].seraphims.find(s => s.id === currentOpenSeraphimId);
            if(sera) {
                if(!sera.safeZones) sera.safeZones = [];
                sera.safeZones.push({ name: zoneName, active: true });
                localStorage.setItem('app_users', JSON.stringify(users)); // Salva!
                
                openTrackerProfile(currentOpenSeraphimId); // Recarrega a tela com a nova zona
                showToast(`Zona '${zoneName}' adicionada e ativada!`, 'success');
            }
        }
    }
}

function toggleSafeZone(index) {
    const loggedEmail = localStorage.getItem('logged_user_email');
    let users = JSON.parse(localStorage.getItem('app_users'));
    const userIndex = users.findIndex(u => u.email === loggedEmail);
    if (userIndex !== -1) {
        let sera = users[userIndex].seraphims.find(s => s.id === currentOpenSeraphimId);
        if(sera && sera.safeZones && sera.safeZones[index]) {
            sera.safeZones[index].active = !sera.safeZones[index].active;
            localStorage.setItem('app_users', JSON.stringify(users));
            openTrackerProfile(currentOpenSeraphimId); // Recarrega a tela para piscar o botão
        }
    }
}

// === GERADOR DE PDF MÁGICO ===
function generatePDFHistory() {
    const loggedEmail = localStorage.getItem('logged_user_email');
    let users = JSON.parse(localStorage.getItem('app_users'));
    const currentUser = users.find(u => u.email === loggedEmail);
    
    if(currentUser) {
        const sera = currentUser.seraphims.find(s => s.id === currentOpenSeraphimId);
        if(sera) {
            showToast('Gerando relatório em PDF...', 'success');
            
            // Abre uma nova guia no navegador
            const printWindow = window.open('', '_blank');
            
            // Monta um relatório oficial
            const htmlContent = `
                <html>
                <head>
                    <title>Relatório - ${sera.name}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 3px solid #DEBC9F; padding-bottom: 20px; margin-bottom: 30px; }
                        .logo { font-size: 32px; font-weight: bold; margin: 0; font-family: serif;}
                        .brand { font-size: 16px; color: #8C6A4F; font-style: italic; margin: 0; }
                        h2 { color: #1E1E1E; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        .footer { margin-top: 40px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <p class="logo">SR</p>
                        <p class="brand">seraphim</p>
                    </div>
                    <h2>Relatório de Rastreamento Oficial</h2>
                    <p><strong>Anjinho Monitorado:</strong> ${sera.name}</p>
                    <p><strong>ID do Dispositivo:</strong> ${sera.id}</p>
                    <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                    
                    <h3>Histórico de Rota (Últimas 24 Horas)</h3>
                    <table>
                        <tr>
                            <th>Horário</th>
                            <th>Localização / Coordenadas</th>
                            <th>Status</th>
                        </tr>
                        <tr>
                            <td>Ontem, 21:00</td>
                            <td>Casa</td>
                            <td>✅ Seguro</td>
                        </tr>
                        <tr>
                            <td>Hoje, 07:30</td>
                            <td>Em trânsito...</td>
                            <td>✅ Seguro</td>
                        </tr>
                        <tr>
                            <td>Hoje, ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                            <td>${sera.location === 'Sincronizando...' ? 'Calibrando GPS...' : sera.location}</td>
                            <td style="color: ${sera.location.includes('ALERTA') ? '#D32F2F' : '#00C853'}">
                                <b>${sera.location.includes('ALERTA') ? '🚨 EMERGÊNCIA' : '✅ Seguro'}</b>
                            </td>
                        </tr>
                    </table>
                    
                    <div class="footer">
                        Documento gerado automaticamente com certificação de ponta a ponta pelo aplicativo Seraphim SA.
                    </div>
                    
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
                </html>
            `;
            
            // Injeta o HTML na nova guia e manda imprimir
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        }
    }
}

// === OUTRAS FUNÇÕES DE OPÇÕES E NAVEGAÇÃO ===
function openProfileOptions() {
    const action = prompt("Opções do Rastreador:\n\n1 - Renomear Anjinho\n2 - Excluir Rastreador\n\nDigite 1 ou 2:");
    if (action === "1") {
        const newName = prompt("Digite o novo nome para o rastreador:");
        if (newName && newName.trim() !== "") { updateSeraphimName(currentOpenSeraphimId, newName); }
    } else if (action === "2") {
        const confirmDelete = confirm("ALERTA: Tem certeza que deseja remover este rastreador do seu sistema?");
        if (confirmDelete) { deleteSeraphimFromProfile(currentOpenSeraphimId); }
    }
}

function updateSeraphimName(id, newName) {
    const loggedEmail = localStorage.getItem('logged_user_email');
    let users = JSON.parse(localStorage.getItem('app_users'));
    const userIndex = users.findIndex(u => u.email === loggedEmail);
    if (userIndex !== -1) {
        let sera = users[userIndex].seraphims.find(s => s.id === id);
        if (sera) {
            sera.name = newName;
            localStorage.setItem('app_users', JSON.stringify(users)); 
            document.getElementById('profile-name').innerText = newName;
            document.getElementById('profile-avatar').src = `https://ui-avatars.com/api/?name=${newName}&background=DEBC9F&color=000`;
            renderSeraphims(users[userIndex].seraphims);
            showToast('Nome atualizado com sucesso!', 'success');
        }
    }
}

function deleteSeraphimFromProfile(id) {
    const loggedEmail = localStorage.getItem('logged_user_email');
    let users = JSON.parse(localStorage.getItem('app_users'));
    const userIndex = users.findIndex(u => u.email === loggedEmail);
    if (userIndex !== -1) {
        users[userIndex].seraphims = users[userIndex].seraphims.filter(s => s.id !== id);
        localStorage.setItem('app_users', JSON.stringify(users)); 
        renderSeraphims(users[userIndex].seraphims);
        showToast('Rastreador excluído do sistema.', 'error');
        navigateTo('home-screen');
    }
}

function viewOnMap(seraphimId) {
    const loggedEmail = localStorage.getItem('logged_user_email');
    let users = JSON.parse(localStorage.getItem('app_users'));
    const currentUser = users.find(u => u.email === loggedEmail);

    if (currentUser) {
        const clickedSeraphim = currentUser.seraphims.find(s => s.id === seraphimId);
        if (clickedSeraphim) {
            document.getElementById('map-sera-name').innerText = clickedSeraphim.name;
            document.getElementById('map-sera-location').innerText = clickedSeraphim.location;
            const mapIframe = document.getElementById('map-iframe');
            let localDeBusca = clickedSeraphim.location;
            if (localDeBusca.includes('Sincronizando')) { localDeBusca = "São Paulo, SP"; }
            mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(localDeBusca)}&output=embed`;
            navigateTo('map-screen');
        }
    }
}

function saveNewSeraphim(event) {
    event.preventDefault(); 
    const inputName = document.getElementById('new-sera-name').value;
    const inputId = document.getElementById('new-sera-id').value;
    const loggedEmail = localStorage.getItem('logged_user_email');
    let users = JSON.parse(localStorage.getItem('app_users'));
    let userIndex = users.findIndex(u => u.email === loggedEmail);

    if (userIndex !== -1) {
        users[userIndex].seraphims.push({
            id: inputId, name: inputName, location: 'Sincronizando...', safeZones: [] // Nova conta começa com as zonas zeradas
        });
        localStorage.setItem('app_users', JSON.stringify(users));
        renderSeraphims(users[userIndex].seraphims);
        document.getElementById('new-sera-name').value = ''; document.getElementById('new-sera-id').value = '';
        showToast('Seraphim vinculado com sucesso!', 'success');
        navigateTo('home-screen');
    }
}

// ==========================================
// FUNÇÃO: LIMPAR CHAT E MENSAGEM INICIAL
// ==========================================
function clearChat(fullName = "") {
    const chatBox = document.getElementById('chat-box');
    let firstName = fullName ? fullName.split(' ')[0] : "";
    
    let greeting = firstName 
        ? `Olá, ${firstName}! Sou a IA do Seraphim, sua assistente de monitoramento.` 
        : `Olá! Sou a IA do Seraphim, sua assistente de monitoramento.`;
    
    // Adiciona a dica do comando "help" com uma formatação sutil
    chatBox.innerHTML = `
        <div class="chat-message ai-message">
            <p>${greeting}</p>
            <p style="margin-top: 10px; font-size: 12px; color: var(--text-muted);">
                💡 Digite <b style="color: var(--accent-beige);">"help"</b> ou <b style="color: var(--accent-beige);">"ajuda"</b> para ver a lista de comandos disponíveis.
            </p>
        </div>
    `;
}

function logOut() {
    localStorage.removeItem('logged_user_email');
    clearChat(); 
    navigateTo('login-screen');
}

function navigateTo(targetScreenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(targetScreenId).classList.add('active');

    const bottomNav = document.getElementById('bottom-nav');
    if (targetScreenId === 'login-screen' || targetScreenId === 'register-user-screen') {
        bottomNav.classList.add('hidden');
    } else { bottomNav.classList.remove('hidden'); }

    const navButtons = document.querySelectorAll('.nav-btn, .add-btn');
    navButtons.forEach(btn => {
        if(btn.getAttribute('data-target') === targetScreenId) { btn.classList.add('active'); } 
        else { btn.classList.remove('active'); }
    });
}

function toggleTheme() {
    const body = document.body;
    const toggleBtn = document.getElementById('theme-toggle');
    body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('seraphim_theme', isLight ? 'light' : 'dark');
    if(isLight) { toggleBtn.classList.remove('active'); } else { toggleBtn.classList.add('active'); }
}

function checkSavedTheme() {
    const savedTheme = localStorage.getItem('seraphim_theme');
    const toggleBtn = document.getElementById('theme-toggle');
    if(savedTheme === 'light') {
        document.body.classList.add('light-mode');
        toggleBtn.classList.remove('active');
    } else {
        document.body.classList.remove('light-mode');
        toggleBtn.classList.add('active');
    }
}

// ==========================================
// CÉREBRO DA IA (COMANDOS, HELP E HISTÓRICO)
// ==========================================
let pendingIAAction = null;

function sendAIMessage() {
    const inputField = document.getElementById('ai-input');
    const userText = inputField.value;
    
    if (userText.trim() === '') return;
    const chatBox = document.getElementById('chat-box');
    
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'chat-message user-message';
    userMessageDiv.innerHTML = `<p>${userText}</p>`;
    chatBox.appendChild(userMessageDiv);
    
    inputField.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'chat-message ai-message';
        const textoUser = userText.toLowerCase();
        
        const loggedEmail = localStorage.getItem('logged_user_email');
        let users = JSON.parse(localStorage.getItem('app_users'));
        let userIndex = users.findIndex(u => u.email === loggedEmail);
        const currentUser = users[userIndex];

        // 1. CHECA SE A IA ESPERA CONFIRMAÇÃO DE DELETAR
        if (pendingIAAction && pendingIAAction.type === 'delete') {
            const isPositive = textoUser.includes('sim') || textoUser.includes('certeza') || textoUser.includes('quero') || textoUser.includes('apaga');
            if (isPositive) {
                users[userIndex].seraphims = users[userIndex].seraphims.filter(s => s.id !== pendingIAAction.seraphim.id);
                localStorage.setItem('app_users', JSON.stringify(users));
                renderSeraphims(users[userIndex].seraphims);
                aiMessageDiv.innerHTML = `<p>🗑️ <b>Feito!</b> O(a) <b>${pendingIAAction.seraphim.name}</b> foi removido(a) do seu sistema.</p>`;
            } else {
                aiMessageDiv.innerHTML = `<p>Ação cancelada. O(a) <b>${pendingIAAction.seraphim.name}</b> continua protegido(a).</p>`;
            }
            pendingIAAction = null; 
            chatBox.appendChild(aiMessageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
            return;
        }

        // 2. COMANDO DE AJUDA / HELP
        const isHelp = textoUser === 'help' || textoUser === 'ajuda' || textoUser === 'comandos';
        if (isHelp) {
            aiMessageDiv.innerHTML = `
                <p>Aqui estão os comandos que você pode usar comigo:</p>
                <ul style="margin-top: 10px; margin-left: 15px; font-size: 13px; line-height: 1.6; color: var(--text-light);">
                    <li>📊 <b>"Relatório"</b> ou <b>"Tabela"</b>: Mostra o status de todos os seus anjinhos.</li>
                    <li>📍 <b>[Nome]</b>: Mostra onde um anjinho está agora (Ex: "Onde está a Stella?").</li>
                    <li>🕒 <b>"Histórico de [Nome]"</b>: Mostra a rota recente do anjinho.</li>
                    <li>🔋 <b>"Bateria da [Nome]"</b>: Verifica o nível de carga do dispositivo.</li>
                    <li>🚨 <b>"Socorro [Nome]"</b>: Simula/ativa o modo de emergência SOS.</li>
                    <li>🚀 <b>"Simular [Nome]"</b>: Move o anjinho no mapa (Apenas Teste).</li>
                    <li>🗑️ <b>"Deletar [Nome]"</b>: Remove o rastreador do sistema.</li>
                </ul>
            `;
            chatBox.appendChild(aiMessageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
            return;
        }

        // 3. COMANDO DE RELATÓRIO GERAL (TABELA)
        const isRelatorioGeral = textoUser.includes('todos') || textoUser.includes('tabela') || textoUser.includes('relatório') || textoUser.includes('resumo');
        if (isRelatorioGeral) {
            if (currentUser.seraphims.length === 0) {
                aiMessageDiv.innerHTML = `<p>Você ainda não possui nenhum Seraphim cadastrado para eu gerar um relatório.</p>`;
            } else {
                let tableHTML = `<p>📊 <b>Relatório Geral de Monitoramento:</b></p><div style="overflow-x: auto;"><table style="width:100%; margin-top:10px; border-collapse: collapse; font-size: 12px; text-align: left; background: var(--bg-dark); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><tr style="background-color: var(--accent-beige); color: #000;"><th style="padding: 10px;">Anjinho</th><th style="padding: 10px;">Status / Local</th><th style="padding: 10px;">Bateria</th></tr>`;
                currentUser.seraphims.forEach(sera => {
                    let isAlert = sera.location.includes('ALERTA');
                    let statusColor = isAlert ? '#FF5252' : '#00C853';
                    let bateria = Math.floor(Math.random() * (100 - 60 + 1)) + 60; 
                    let icon = isAlert ? '⚠️' : '✅';
                    let nomeCurto = sera.name.split(' ')[0];
                    tableHTML += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="padding: 10px; color: var(--text-light); font-weight: bold;">${nomeCurto}</td><td style="padding: 10px; color: ${statusColor};">${icon} ${isAlert ? 'EMERGÊNCIA' : sera.location}</td><td style="padding: 10px; color: var(--text-muted);">${bateria}% 🔋</td></tr>`;
                });
                tableHTML += `</table></div><p style="margin-top: 10px; font-size: 11px; color: var(--text-muted); text-align: right;">Sincronizado agora via satélite.</p>`;
                aiMessageDiv.innerHTML = tableHTML;
            }
            chatBox.appendChild(aiMessageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
            return;
        }

        // 4. BUSCA POR RASTREADOR ESPECÍFICO
        let foundSeraphim = null;
        if (currentUser && currentUser.seraphims.length > 0) {
            for (let sera of currentUser.seraphims) {
                let primeiroNome = sera.name.split(' ')[0].toLowerCase();
                if (textoUser.includes(primeiroNome) || textoUser.includes(sera.name.toLowerCase())) {
                    foundSeraphim = sera;
                    break;
                }
            }
        }
        
        // Dicionário de Novas Funcionalidades
        const isHistory = textoUser.includes('histórico') || textoUser.includes('rota') || textoUser.includes('passos');
        const isBattery = textoUser.includes('bateria') || textoUser.includes('carga') || textoUser.includes('energia');
        const isSimulation = textoUser.includes('simular') || textoUser.includes('mover') || textoUser.includes('teletransportar');
        const isDeletion = textoUser.includes('deletar') || textoUser.includes('apagar') || textoUser.includes('remover') || textoUser.includes('excluir');
        const isEmergency = textoUser.includes('socorro') || textoUser.includes('emergência') || textoUser.includes('perigo') || textoUser.includes('alerta') || textoUser.includes('sos');

        if (foundSeraphim && isEmergency) {
            foundSeraphim.location = "🚨 ALERTA: BOTÃO SOS ACIONADO!";
            localStorage.setItem('app_users', JSON.stringify(users));
            renderSeraphims(currentUser.seraphims);
            aiMessageDiv.innerHTML = `<p style="color: #FF5252; font-weight: bold;">🚨 MODO CRÍTICO ATIVADO! 🚨</p><p style="color: #FF5252; margin-top: 5px;">O rastreador de <b>${foundSeraphim.name}</b> emitiu um sinal de SOS ou saiu da zona segura. A localização ao vivo foi fixada na Home e no Mapa.</p>`;
        }
        else if (foundSeraphim && isDeletion) {
            pendingIAAction = { type: 'delete', seraphim: foundSeraphim };
            aiMessageDiv.innerHTML = `<p>⚠️ Você está pedindo para <b>remover</b> o rastreador de <b>${foundSeraphim.name}</b>. Isso interromperá o monitoramento. <b>Tem certeza absoluta disso?</b></p>`;
        }
        else if (foundSeraphim && isHistory) {
            // Gera um histórico falso bem realista
            aiMessageDiv.innerHTML = `
                <p>🕒 <b>Histórico de Rota de ${foundSeraphim.name}:</b></p>
                <ul style="margin-top: 10px; margin-left: 15px; font-size: 13px; color: var(--text-light); line-height: 1.6;">
                    <li><b>08:00</b> - Casa (Zona Segura)</li>
                    <li><b>08:30</b> - Em trânsito...</li>
                    <li><b>Agora</b> - ${foundSeraphim.location}</li>
                </ul>
                <p style="margin-top: 10px; font-size: 11px; color: var(--text-muted);">Para o histórico completo em PDF, acesse o perfil do anjinho.</p>
            `;
        }
        else if (foundSeraphim && isBattery) {
            // Gera uma bateria aleatória entre 15 e 100%
            let bateria = Math.floor(Math.random() * (100 - 15 + 1)) + 15;
            let corBat = bateria > 20 ? '#00C853' : '#FF5252';
            aiMessageDiv.innerHTML = `<p>🔋 A bateria do dispositivo de <b>${foundSeraphim.name}</b> está em <b style="color: ${corBat};">${bateria}%</b>.</p>`;
            if (bateria <= 20) {
                aiMessageDiv.innerHTML += `<p style="font-size: 12px; color: #FF5252; margin-top: 5px;">Recomendamos colocar a joia para carregar em breve.</p>`;
            }
        }
        else if (foundSeraphim && isSimulation) {
            const randomLocations = [
                "Parque Ibirapuera", "Avenida Paulista", "Shopping Morumbi", 
                "Aeroporto de Guarulhos", "Estação da Luz", "MASP", 
                "Bairro da Liberdade", "Allianz Parque", "Rua 25 de Março",
                "ETEC de Mauá", "ETEC Júlio de Mesquita", "ETEC Lauro Gomes",
                "ETEC Getúlio Vargas", "Mercado Municipal de São Paulo", "UNICAMP",
                "Pinacoteca de São Paulo", "PUC-SP", "FATEC de Osasco",
                "Morumbis", "Neo Química Arena", "SENAI Armando de Arruda Pereira",
                "Galeria do Rock", "Casa das rosas", "Museu da Língua Portuguesa"
            ];
            let newLocation = foundSeraphim.location;
            while(newLocation === foundSeraphim.location) { newLocation = randomLocations[Math.floor(Math.random() * randomLocations.length)]; }
            
            foundSeraphim.location = newLocation;
            localStorage.setItem('app_users', JSON.stringify(users));
            renderSeraphims(currentUser.seraphims);
            aiMessageDiv.innerHTML = `<p>🚀 <b>Simulação ativada!</b> O GPS de <b>${foundSeraphim.name}</b> foi atualizado para: <b style="color: #00C853;">${newLocation}</b>.</p>`;
        } 
        else if (foundSeraphim) {
            aiMessageDiv.innerHTML = `<p>O(a) <b>${foundSeraphim.name}</b> está seguro(a) no momento. Última localização: ${foundSeraphim.location}.</p>`;
        } else {
            aiMessageDiv.innerHTML = `<p>Fiz uma varredura geral agora. Todos os seus rastreadores ativos estão enviando sinal corretamente. Digite <b style="color: var(--accent-beige);">"help"</b> se precisar de ajuda com os comandos!</p>`;
        }
        
        chatBox.appendChild(aiMessageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1500);
}

// ==========================================
// FUNÇÃO: FILTRAR ANJINHOS NA BARRA DE PESQUISA
// ==========================================
function filterSeraphims() {
    // Pega o que o usuário digitou e transforma em minúsculas
    const searchTerm = document.getElementById('home-search').value.toLowerCase();
    
    // Pega todos os cards de anjinhos que estão desenhados na tela
    const trackerItems = document.querySelectorAll('.tracker-item');

    // Passa por cada um deles verificando o nome
    trackerItems.forEach(item => {
        // Pega o texto do <h4> (onde fica o nome do anjinho)
        const name = item.querySelector('h4').innerText.toLowerCase();
        
        // Se o nome incluir as letras digitadas, mostra. Se não, esconde.
        if (name.includes(searchTerm)) {
            item.style.display = 'flex'; 
        } else {
            item.style.display = 'none';
        }
    });
}