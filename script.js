// BASE DE DATOS EXTENDIDA (CATÁLOGO GRANDE)
let games = [
    { id: 1, title: "TEKKEN 8", price: 14.99, dev: "Bandai_Namco", image: "IMGS/Tekken8.jpg", comments: [] },
    { id: 2, title: "Kingdom Hearts IV", price: 99.99, dev: "Squarenix", image: "IMGS/Kingdom_Hearts_IV.jpg", comments: [] },
    { id: 3, title: "Marvel Spiderman 3", price: 69.99, dev: "Insomniac_Games", image: "IMGS/Marvel_Spiderman_3.jpg", comments: [] },
    { id: 4, title: "Grand Theft Auto VI", price: 99.99, dev: "RockstarGames", image: "IMGS/GTAVI.jpg", comments: [] },
    { id: 5, title: "Dying Light: The Beast", price: 59.99, dev: "Techland", image: "IMGS/Dying_Light_Beast.jpg", comments: [] },
    { id: 6, title: "*Furi", price: 6.50, dev: "The_Game_Bakers", image: "IMGS/Furi.jpg", comments: [] },
    { id: 7, title: "Bloodborne PC Edition", price: 79.99, dev: "FromSoftware", image: "IMGS/Bloodborne.jpg", comments: [] },
];

let currentUser = null;
let myLibrary = [];
let cart = [];

function showSection(id) {
    const sections = ['sec-login', 'sec-admin', 'sec-shop', 'sec-library', 'sec-dev'];
    sections.forEach(sec => {
        const el = document.getElementById(sec);
        if(el) el.classList.add('hidden');
    });
    
    if (id === 'shop') renderStore();
    if (id === 'library') renderLibrary();
    if (id === 'dev') renderDevPanel();

    const target = document.getElementById('sec-' + id);
    if(target) target.classList.remove('hidden');
}

function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.toLowerCase();
    const pass = document.getElementById('pass').value;

    if(pass.length < 8) {
        alert("Seguridad: La contraseña debe tener al menos 8 caracteres.");
        return;
    }
    
    currentUser = { email: email, role: 'USER' };
    const badge = document.getElementById('role-badge');
    badge.className = "role-badge ";

    // DETERMINACIÓN INTELIGENTE DE LOS TRES ROLES
    if (email.includes('admin')) {
        currentUser.role = 'ADMIN';
        badge.innerText = "ADMINISTRADOR SISTEMA";
        badge.classList.add('badge-admin');
        showSection('admin');
    } else if (email.includes('dev')) {
        currentUser.role = 'DEV';
        badge.innerText = "CREADOR INDIE";
        badge.classList.add('badge-dev');
        showSection('dev');
    } else {
        currentUser.role = 'USER';
        badge.innerText = "COMPRADOR PREMIUM";
        badge.classList.add('badge-user');
        showSection('shop');
    }

    document.getElementById('auth-btns').classList.add('hidden');
    document.getElementById('user-menu').classList.remove('hidden');
}

function logout() {
    currentUser = null;
    cart = [];
    document.getElementById('cart-counter').innerText = "🛒 Carrito: 0 juegos";
    document.getElementById('auth-btns').classList.remove('hidden');
    document.getElementById('user-menu').classList.add('hidden');
    document.getElementById('email').value = "";
    document.getElementById('pass').value = "";
    showSection('login');
}

function renderStore() {
    const list = document.getElementById('product-list');
    if(!list) return;
    
    list.innerHTML = games.map(g => `
        <div class="game-card">
            <div class="game-card-img-container">
                <img src="${g.image}" alt="${g.title}" class="game-card-img">
            </div>
            <div class="game-card-body">
                <h3>${g.title}</h3>
                <span class="dev-tag">Estudio: ${g.dev}</span>
                <p class="price">${g.price.toFixed(2)}€</p>
                <button class="btn-p" onclick="addToCart(${g.id})">Añadir al Carrito</button>
            </div>
        </div>
    `).join('');
}

function addToCart(id) {
    const game = games.find(g => g.id === id);
    if (myLibrary.some(item => item.id === id)) {
        alert("Ya posees una licencia de este software en tu biblioteca.");
        return;
    }
    if (cart.some(item => item.id === id)) {
        alert("Este producto ya está en tu cesta de la compra.");
        return;
    }
    cart.push(game);
    document.getElementById('cart-counter').innerText = `🛒 Carrito: ${cart.length} juegos`;
    
    if(confirm(`¿Deseas procesar la pasarela de pago para: ${game.title}?`)) {
        myLibrary.push(game);
        cart = cart.filter(item => item.id !== id);
        document.getElementById('cart-counter').innerText = `🛒 Carrito: ${cart.length} juegos`;
        alert("¡Transacción procesada! Licencia inyectada en tu biblioteca.");
    }
}

function renderLibrary() {
    const container = document.getElementById('library-list');
    if(!container) return;
    if (myLibrary.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:3rem; background:white; border-radius:12px;">Tu biblioteca de licencias está vacía. Explora el catálogo comercial.</p>`;
        return;
    }

    container.innerHTML = myLibrary.map(g => `
        <div class="card" style="margin-bottom:1.5rem; padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; color:var(--s); flex:1;">🎮 ${g.title}</h3>
                <button class="btn-p" style="width:auto; background:var(--success); font-size:0.85rem; padding:0.5rem 1rem;" onclick="alert('Ejecutando binario del juego... Simulación estable a 60FPS')">Ejecutar Software</button>
            </div>
            
            <div class="comment-box">
                <h4 style="margin:0 0 0.5rem 0;">📨 Canal de Opiniones y Reporte Técnico</h4>
                <div id="comments-area-${g.id}">
                    ${g.comments.map(c => `
                        <div style="font-size:0.9rem; margin-bottom:0.5rem;">
                            <b>${c.user}:</b> "${c.text}"
                            ${c.reply ? `<div class="reply-box"><b>Respuesta oficial del Autor:</b> ${c.reply}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex; gap:10px; margin-top:0.8rem;">
                    <input type="text" id="input-comment-${g.id}" placeholder="Escribe una reseña técnica..." style="flex:1; padding:0.5rem; border-radius:6px; border:1px solid #cbd5e1;">
                    <button class="btn-p" style="width:auto; padding:0.5rem 1rem;" onclick="sendComment(${g.id})">Enviar Feedback</button>
                </div>
            </div>
        </div>
    `).join('');
}

function sendComment(gameId) {
    const input = document.getElementById(`input-comment-${gameId}`);
    if (!input.value || !input.value.trim()) return;

    const game = games.find(g => g.id === gameId);
    game.comments.push({
        user: currentUser.email,
        text: input.value
    });

    input.value = "";
    renderLibrary();
}

function renderDevPanel() {
    const container = document.getElementById('dev-comments-list');
    if(!container) return;
    const myGames = games.filter(g => g.dev === currentUser.email || g.dev.includes('Indie') || g.dev === 'System_Indie');

    if (myGames.every(g => g.comments.length === 0)) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No hay hilos de conversación pendientes en tus videojuegos publicados.</p>`;
        return;
    }

    container.innerHTML = myGames.map(g => g.comments.map((c, index) => `
        <div class="comment-box" style="background:#fff;">
            <p style="margin:0 0 0.5rem 0;"><b>Juego:</b> ${g.title} | <b>Usuario:</b> ${c.user}</p>
            <p style="margin:0; font-style:italic; color:var(--s);">"${c.text}"</p>
            ${c.reply ? `
                <div class="reply-box"><b>Tú:</b> ${c.reply}</div>
            ` : `
                <div style="display:flex; gap:10px; margin-top:0.5rem;">
                    <input type="text" id="dev-reply-${g.id}-${index}" placeholder="Escribir respuesta oficial de autor..." style="flex:1; padding:0.4rem; border-radius:6px; border:1px solid #cbd5e1; font-size:0.9rem;">
                    <button class="btn-p" style="width:auto; padding:0.4rem 1rem; font-size:0.85rem;" onclick="sendDevReply(${g.id}, ${index})">Remitir Réplica</button>
                </div>
            `}
        </div>
    `).join('')).join('');
}

function sendDevReply(gameId, index) {
    const input = document.getElementById(`dev-reply-${gameId}-${index}`);
    if (!input.value || !input.value.trim()) return;

    const game = games.find(g => g.id === gameId);
    game.comments[index].reply = input.value;
    renderDevPanel();
}

function publishGame() {
    const title = document.getElementById('new-title').value;
    const price = parseFloat(document.getElementById('new-price').value);

    if (!title || isNaN(price)) {
        alert("Por favor, cumplimente todos los campos con datos lógicos.");
        return;
    }

    games.push({
        id: Date.now(),
        title: title,
        price: price,
        dev: currentUser.email,
        comments: []
    });

    alert("¡Proyecto Indie inyectado al Catálogo Global satisfactoriamente!");
    document.getElementById('new-title').value = "";
    document.getElementById('new-price').value = "";
    renderDevPanel();
}