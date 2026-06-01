document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    checkSavedTheme();
    
    // Lógica da Splash Screen (Desaparece após 2.5 segundos)
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) {
            splash.classList.add('fade-out');
        }
    }, 2500); 
});

// ==========================================
// FUNÇÃO DE NOTIFICAÇÕES VISUAIS (TOASTS)
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Escolhe o ícone baseado no tipo de alerta
    let icon = 'info';
    if(type === 'success') icon = 'check_circle';
    if(type === 'error') icon = 'error';

    toast.innerHTML = `<span class="material-symbols-outlined" style="font-size: 24px;">${icon}</span> <p>${message}</p>`;
    
    container.appendChild(toast);

    // Remove do HTML após 3.5 segundos para não acumular lixo na memória
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// ==========================================
// BANCO DE DADOS SIMULADO E LOGIN
// ==========================================
const defaultSabrinaSeraphims = [
    { id: 'SR-001', name: 'Stella Pires Freitas', location: 'ETEC Santa Ifigênia' },
    { id: 'SR-002', name: 'Serena Pires Freitas', location: 'USP' }
];

function initDatabase() {
    let users = JSON.parse(localStorage.getItem('app_users'));
    if (!users) {
        users = [{
            name: 'Sabrina Freitas',
            email: 'sabrina.freitas123@outlook.com', // Atualizado para o e-mail da imagem
            password: '1234',
            username: '@sabrfrei073',
            phone: '+55 (11) 9 9719-4320',
            address: 'Parque das Flores, Osasco - SP',
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

    if (name === '' || email === '' || pass === '') {
        errorMsg.style.display = 'block';
        return;
    }

    let users = JSON.parse(localStorage.getItem('app_users'));
    
    if (users.find(u => u.email === email)) {
        errorMsg.innerText = "Este E-mail já está cadastrado!";
        errorMsg.style.display = 'block';
        return;
    }

    const newUser = {
        name: name,
        email: email,
        password: pass,
        seraphims: []
    };

    users.push(newUser);
    localStorage.setItem('app_users', JSON.stringify(users));

    localStorage.setItem('logged_user_email', newUser.email);
    loadUserData(newUser);
    navigateTo('home-screen');
    
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-pass').value = '';
    errorMsg.style.display = 'none';
}

function loadUserData(user) {
    document.getElementById('home-user-name').innerText = user.name.toUpperCase();
    document.getElementById('settings-user-name').innerText = user.name;
    document.getElementById('settings-user-email').innerText = user.email;

    // Novos dados da tela de configurações
    document.getElementById('settings-username').innerText = user.username || `@${user.name.split(' ')[0].toLowerCase()}`;
    document.getElementById('settings-phone').innerText = user.phone || 'Não informado';
    document.getElementById('settings-address').innerText = user.address || 'Brasil';

    const avatarUrl = `https://ui-avatars.com/api/?name=${user.name}&background=DEBC9F&color=000`;
    document.getElementById('home-avatar').src = avatarUrl;
    document.getElementById('settings-avatar').src = avatarUrl;

    renderSeraphims(user.seraphims);
    
    // Limpa o chat e cumprimenta o usuário pelo nome
    clearChat(user.name);
}

// Desenha a lista de anjinhos na Home e atualiza o Card de Destaque
function renderSeraphims(seraphimsArray) {
    const listContainer = document.getElementById('dynamic-trackers-list');
    listContainer.innerHTML = ''; 

    // Referências do novo Map Card
    const featuredName = document.getElementById('home-featured-name');
    const featuredLocation = document.getElementById('home-featured-location');

    if (seraphimsArray.length === 0) {
        listContainer.innerHTML = '<p style="font-size:12px; color:var(--text-muted); margin-top:10px;">Nenhum anjinho cadastrado ainda.</p>';
        
        // Se a pessoa não tem anjinhos, o card de destaque fica zerado
        featuredName.innerText = "Sem Anjinhos";
        featuredLocation.innerText = "Cadastre um rastreador abaixo.";
        return;
    }

    // MÁGICA: O primeiro Seraphim da lista vira o "Destaque" do card principal!
    featuredName.innerText = seraphimsArray[0].name;
    
    // Se for emergência, pinta de vermelho pra chamar mais atenção
    if (seraphimsArray[0].location.includes('ALERTA')) {
        featuredLocation.innerHTML = `<span style="color: #D32F2F;">${seraphimsArray[0].location}</span>`;
    } else {
        featuredLocation.innerText = seraphimsArray[0].location;
    }

    // Desenha a lista abaixo do card
    seraphimsArray.forEach(sera => {
        listContainer.innerHTML += `
            <div class="tracker-item" onclick="viewOnMap('${sera.id}')">
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

// ==========================================
// FUNÇÃO: FOCAR NO MAPA E ATUALIZAR GOOGLE MAPS
// ==========================================
function viewOnMap(seraphimId) {
    // 1. Descobre quem está logado
    const loggedEmail = localStorage.getItem('logged_user_email');
    let users = JSON.parse(localStorage.getItem('app_users'));
    const currentUser = users.find(u => u.email === loggedEmail);

    if (currentUser) {
        // 2. Acha qual Seraphim foi clicado baseado no ID
        const clickedSeraphim = currentUser.seraphims.find(s => s.id === seraphimId);

        if (clickedSeraphim) {
            // 3. Muda os textos na tela do Mapa
            document.getElementById('map-sera-name').innerText = clickedSeraphim.name;
            document.getElementById('map-sera-location').innerText = clickedSeraphim.location;
            
            // 4. MÁGICA: Muda a localização real do Iframe do Google Maps
            const mapIframe = document.getElementById('map-iframe');
            
            // Pega o local salvo. Se estiver "Sincronizando...", joga pro centro de SP
            let localDeBusca = clickedSeraphim.location;
            if (localDeBusca.includes('Sincronizando')) {
                localDeBusca = "São Paulo, SP"; 
            }
            
            // Formata a URL do iframe do Google Maps dinamicamente
            // O encodeURIComponent garante que espaços virem "%20" pra URL não quebrar
            mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(localDeBusca)}&output=embed`;

            // 5. Abre a tela do mapa
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
            id: inputId,
            name: inputName,
            location: 'Sincronizando...'
        });

        localStorage.setItem('app_users', JSON.stringify(users));
        renderSeraphims(users[userIndex].seraphims);

        document.getElementById('new-sera-name').value = '';
        document.getElementById('new-sera-id').value = '';

        // Substitui o alert antigo por este novo:
        showToast('Seraphim vinculado com sucesso!', 'success');
        navigateTo('home-screen');
    }
}

// ==========================================
// NOVA FUNÇÃO: LIMPAR O CHAT
// ==========================================
function clearChat(fullName = "") {
    const chatBox = document.getElementById('chat-box');
    
    // Pega só o primeiro nome da pessoa. Ex: de "Sabrina Freitas" vira "Sabrina"
    let firstName = fullName ? fullName.split(' ')[0] : "";
    
    let greeting = firstName 
        ? `Olá, ${firstName}! Como posso ajudar a monitorar seus anjinhos hoje?` 
        : `Olá! Como posso ajudar a monitorar seus anjinhos hoje?`;
    
    // Zera o chat e insere apenas a mensagem de saudação
    chatBox.innerHTML = `
        <div class="chat-message ai-message">
            <p>${greeting}</p>
        </div>
    `;
}

// LOGOUT
function logOut() {
    localStorage.removeItem('logged_user_email');
    clearChat(); // Limpa o chat ao sair
    navigateTo('login-screen');
}


// ==========================================
// RESTANTE (Navegação, Tema, IA) 
// ==========================================
function navigateTo(targetScreenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(targetScreenId).classList.add('active');

    const bottomNav = document.getElementById('bottom-nav');
    if (targetScreenId === 'login-screen' || targetScreenId === 'register-user-screen') {
        bottomNav.classList.add('hidden');
    } else {
        bottomNav.classList.remove('hidden');
    }

    const navButtons = document.querySelectorAll('.nav-btn, .add-btn');
    navButtons.forEach(btn => {
        if(btn.getAttribute('data-target') === targetScreenId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function toggleTheme() {
    const body = document.body;
    const toggleBtn = document.getElementById('theme-toggle');
    body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('seraphim_theme', isLight ? 'light' : 'dark');
    if(isLight) { toggleBtn.classList.remove('active'); } 
    else { toggleBtn.classList.add('active'); }
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
// LÓGICA DO CHAT IA (RELATÓRIOS, EASTER EGGS E EMERGÊNCIA)
// ==========================================

// Memória temporária da IA para esperar confirmações
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

        // --- VERIFICA SE A IA ESTAVA ESPERANDO UMA CONFIRMAÇÃO (EXCLUSÃO) ---
        if (pendingIAAction && pendingIAAction.type === 'delete') {
            const isPositive = textoUser.includes('sim') || textoUser.includes('certeza') || textoUser.includes('quero') || textoUser.includes('positivo') || textoUser.includes('apaga');
            
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

        // --- 1. IDENTIFICAÇÃO DE INTENÇÃO GERAL (GERAR TABELA/RELATÓRIO) ---
        const isRelatorioGeral = textoUser.includes('todos') || textoUser.includes('tabela') || textoUser.includes('relatório') || textoUser.includes('resumo');
        
        if (isRelatorioGeral) {
            if (currentUser.seraphims.length === 0) {
                aiMessageDiv.innerHTML = `<p>Você ainda não possui nenhum Seraphim cadastrado para eu gerar um relatório.</p>`;
            } else {
                // Montando a Tabela em HTML com design integrado ao App
                let tableHTML = `<p>📊 <b>Relatório Geral de Monitoramento:</b></p>`;
                tableHTML += `<div style="overflow-x: auto;">`; // Adicionado para não quebrar em telas pequenas
                tableHTML += `<table style="width:100%; margin-top:10px; border-collapse: collapse; font-size: 12px; text-align: left; background: var(--bg-dark); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">`;
                tableHTML += `<tr style="background-color: var(--accent-beige); color: #000;">
                                <th style="padding: 10px;">Anjinho</th>
                                <th style="padding: 10px;">Status / Local</th>
                                <th style="padding: 10px;">Bateria</th>
                              </tr>`;

                currentUser.seraphims.forEach(sera => {
                    let isAlert = sera.location.includes('ALERTA');
                    let statusColor = isAlert ? '#FF5252' : '#00C853'; // Vermelho ou Verde
                    let bateria = Math.floor(Math.random() * (100 - 60 + 1)) + 60; // Simula bateria entre 60 e 100%
                    let icon = isAlert ? '⚠️' : '✅';
                    
                    // Pega só o primeiro nome pra caber bonitinho na tabela
                    let nomeCurto = sera.name.split(' ')[0];

                    tableHTML += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">`;
                    tableHTML += `<td style="padding: 10px; color: var(--text-light); font-weight: bold;">${nomeCurto}</td>`;
                    tableHTML += `<td style="padding: 10px; color: ${statusColor};">${icon} ${isAlert ? 'EMERGÊNCIA' : sera.location}</td>`;
                    tableHTML += `<td style="padding: 10px; color: var(--text-muted);">${bateria}% 🔋</td>`;
                    tableHTML += `</tr>`;
                });
                tableHTML += `</table></div>`;
                tableHTML += `<p style="margin-top: 10px; font-size: 11px; color: var(--text-muted); text-align: right;">Sincronizado agora via satélite.</p>`;
                
                aiMessageDiv.innerHTML = tableHTML;
            }
            
            chatBox.appendChild(aiMessageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
            return; // Encerra aqui se for o comando da tabela
        }

        // --- 2. LÓGICA DE BUSCA INDIVIDUAL DE RASTREADORES ---
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
        
        // --- DICIONÁRIO DE COMANDOS SECRETOS INDIVIDUAIS ---
        const isSimulation = textoUser.includes('simular') || textoUser.includes('mover') || textoUser.includes('teletransportar');
        const isDeletion = textoUser.includes('deletar') || textoUser.includes('apagar') || textoUser.includes('remover') || textoUser.includes('excluir');
        const isEmergency = textoUser.includes('socorro') || textoUser.includes('emergência') || textoUser.includes('perigo') || textoUser.includes('alerta') || textoUser.includes('sos');

        // COMANDO DE EMERGÊNCIA
        if (foundSeraphim && isEmergency) {
            foundSeraphim.location = "🚨 ALERTA: BOTÃO SOS ACIONADO!";
            localStorage.setItem('app_users', JSON.stringify(users));
            renderSeraphims(currentUser.seraphims);

            aiMessageDiv.innerHTML = `<p style="color: #FF5252; font-weight: bold;">🚨 MODO CRÍTICO ATIVADO! 🚨</p><p style="color: #FF5252; margin-top: 5px;">O rastreador de <b>${foundSeraphim.name}</b> emitiu um sinal de SOS ou saiu da zona segura. A localização ao vivo foi fixada na Home e no Mapa. Recomendamos tentar contato imediato ou acionar as autoridades locais!</p>`;
        }
        // COMANDO DE EXCLUSÃO
        else if (foundSeraphim && isDeletion) {
            pendingIAAction = { type: 'delete', seraphim: foundSeraphim };
            aiMessageDiv.innerHTML = `<p>⚠️ Você está pedindo para <b>remover</b> o rastreador de <b>${foundSeraphim.name}</b>. Isso interromperá o monitoramento. <b>Tem certeza absoluta disso?</b></p>`;
        }
        // COMANDO DE SIMULAÇÃO DE MOVIMENTO
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
            while(newLocation === foundSeraphim.location) {
                newLocation = randomLocations[Math.floor(Math.random() * randomLocations.length)];
            }
            
            foundSeraphim.location = newLocation;
            localStorage.setItem('app_users', JSON.stringify(users));
            renderSeraphims(currentUser.seraphims);

            aiMessageDiv.innerHTML = `<p>🚀 <b>Simulação ativada!</b> O GPS de <b>${foundSeraphim.name}</b> foi atualizado para: <b style="color: #00C853;">${newLocation}</b>.</p>`;
        } 
        // PERGUNTA NORMAL SOBRE ALGUÉM ESPECÍFICO
        else if (foundSeraphim) {
            aiMessageDiv.innerHTML = `<p>O(a) <b>${foundSeraphim.name}</b> está seguro(a) no momento. Última localização: ${foundSeraphim.location}.</p>`;
        } 
        // RESPOSTA PADRÃO SE NÃO ENTENDER O COMANDO
        else {
            aiMessageDiv.innerHTML = `<p>Fiz uma varredura geral agora. Todos os seus rastreadores ativos estão enviando sinal corretamente. Você pode me pedir um <b>resumo</b> de <b>todos</b> eles ou perguntar por um anjinho específico!</p>`;
        }
        
        chatBox.appendChild(aiMessageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1500);
}
