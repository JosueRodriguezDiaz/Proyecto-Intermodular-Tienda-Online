// script.js - Controlador de UI y Comunicaciones Asíncronas
const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('nexus_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartDOM();
    injectPaymentModal();
});

// --- MOTOR DE NOTIFICACIONES TOAST ---
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '25px';
    toast.style.right = '25px';
    toast.style.padding = '1rem 1.8rem';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.2)';
    toast.style.background = type === 'success' ? '#10b981' : '#f43f5e';
    toast.style.transition = 'all 0.3s ease';
    
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// --- ENRUTADOR SPA ---
function showSection(sectionId) {
    const sections = ['sec-login', 'sec-shop', 'sec-library', 'sec-dev', 'sec-admin'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`sec-${sectionId}`);
    if (target) target.classList.remove('hidden');

    if (sectionId === 'shop') renderStore();
    if (sectionId === 'library') renderLibrary();
    if (sectionId === 'dev') renderDevPanel();
}

// --- LOGIN ---
function login() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (!email || pass.length < 8) {
        showNotification("Autenticación denegada: Contraseña inferior a 8 caracteres.", "error");
        return;
    }

    fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            document.getElementById('auth-btns').classList.add('hidden');
            document.getElementById('user-menu').classList.remove('hidden');
            
            const badge = document.getElementById('role-badge');
            badge.textContent = currentUser.rol;
            badge.className = `role-badge badge-${currentUser.rol.toLowerCase()}`;

            document.getElementById('btn-my-games').classList.toggle('hidden', currentUser.rol === 'ADMIN');
            
            // Redirección inteligente de paneles según rol
            if (currentUser.rol === 'DEV') {
                showSection('dev');
            } else if (currentUser.rol === 'ADMIN') {
                showSection('admin');
            } else {
                showSection('shop');
            }
            
            showNotification(`Bienvenido al sistema, ${currentUser.username}.`);
        }
    })
    .catch(() => showNotification("Error de enlace: El servidor backend está apagado.", "error"));
}

// --- RENDER TIENDA ---
function renderStore() {
    const list = document.getElementById('store-list');
    if (!list) return;

    fetch(`${API_URL}/juegos`)
        .then(res => res.json())
        .then(games => {
            list.innerHTML = games.map(g => `
                <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; height:340px; padding:1rem;">
                    <div style="text-align:center;">
                        <img src="${g.imagen || 'https://via.placeholder.com/150x200?text=Nexus+Games'}" 
                             alt="${g.titulo}" 
                             style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:0.8rem;">
                        
                        <h3 style="margin:0 0 0.3rem 0; font-size:1.15rem; text-align:left;">${g.titulo}</h3>
                        <p class="price" style="font-size:1.3rem; font-weight:700; color:var(--p); margin:0; text-align:left;">${g.precio} €</p>
                    </div>
                    <button class="btn-p" style="margin-top:auto; width:100%;" onclick="addToCart(${g.id}, '${g.titulo.replace(/'/g, "\\'")}', ${g.precio})">
                        Agregar al Carrito
                    </button>
                </div>
            `).join('');
        });
}

// --- LOGICA DEL CARRITO ---
function addToCart(id, titulo, precio) {
    if (cart.some(item => item.id === id)) {
        showNotification("El producto ya está asignado al carro.", "error");
        return;
    }
    cart.push({ id, titulo, precio });
    localStorage.setItem('nexus_cart', JSON.stringify(cart));
    updateCartDOM();
    showNotification(`"${titulo}" integrado al carro de compras.`);
}

function updateCartDOM() {
    let counter = document.getElementById('cart-counter');
    if (!counter) {
        const menu = document.getElementById('user-menu');
        if (menu) {
            counter = document.createElement('button');
            counter.id = 'cart-counter';
            counter.className = 'btn-s';
            counter.style.background = 'var(--a)';
            counter.style.color = 'white';
            counter.style.border = 'none';
            counter.onclick = () => openPaymentPasarela();
            menu.insertBefore(counter, document.getElementById('role-badge'));
        }
    }
    if (counter) {
        counter.innerHTML = `🛒 Carrito (${cart.length})`;
    }
}

// --- PASARELA DE PAGO ---
function injectPaymentModal() {
    if (document.getElementById('payment-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.className = 'hidden'; 
    modal.style.position = 'fixed';
    modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100%'; modal.style.height = '100%';
    modal.style.background = 'rgba(15,23,42,0.7)'; modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center'; modal.style.zIndex = '99999';
    modal.style.display = 'none';
    
    modal.innerHTML = `
        <div class="card" style="width:400px; padding:2rem; background:white; border-radius:12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
            <h3 style="margin-top:0; color:var(--s);">💳 Transacción Bancaria Segura</h3>
            <p id="payment-total" style="font-weight:700; color:var(--p); margin-bottom: 1rem;"></p>
            <div style="display:flex; flex-direction:column; gap:12px; margin:1.5rem 0;">
                <input type="text" id="card-num" placeholder="Número de Tarjeta (16 dígitos)" maxLength="16" style="padding:0.7rem; border-radius:6px; border:1px solid #cbd5e1;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <input type="text" id="card-exp" placeholder="MM/AA" maxLength="5" style="padding:0.7rem; border-radius:6px; border:1px solid #cbd5e1;">
                    <input type="password" id="card-cvv" placeholder="CVV" maxLength="3" style="padding:0.7rem; border-radius:6px; border:1px solid #cbd5e1;">
                </div>
            </div>
            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button class="btn-s" style="background: #e2e8f0; color: #334155; border: 1px solid #cbd5e1;" onclick="closePaymentPasarela()">Cancelar</button>
                <button class="btn-p" style="background:var(--success);" onclick="processSecurePayment()">Verificar Pago</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function openPaymentPasarela() {
    if (cart.length === 0) return showNotification("El carro de compras está vacío.", "error");
    
    // Calculamos el total
    const total = cart.reduce((sum, item) => sum + item.precio, 0).toFixed(2);
    document.getElementById('payment-total').textContent = `Importe a liquidar: ${total} €`;
    
    // Buscamos o creamos el contenedor para la lista de productos dentro del modal
    let listaProductos = document.getElementById('cart-items-list');
    if (!listaProductos) {
        // Si no existe el contenedor de la lista, lo creamos justo encima del total
        listaProductos = document.createElement('div');
        listaProductos.id = 'cart-items-list';
        listaProductos.style.maxHeight = '150px';
        listaProductos.style.overflowY = 'auto';
        listaProductos.style.marginBottom = '1rem';
        listaProductos.style.borderBottom = '1px solid #e2e8f0';
        listaProductos.style.paddingBottom = '0.5rem';
        const totalElement = document.getElementById('payment-total');
        totalElement.parentNode.insertBefore(listaProductos, totalElement);
    }

    // Dibujamos los juegos que hay en el carrito con su botón de eliminar
    listaProductos.innerHTML = cart.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.95rem;">
            <span>📋 ${item.titulo} (${item.precio} €)</span>
            <button onclick="removeFromCart(${item.id})" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:600; font-size:0.8rem;">
                Eliminar
            </button>
        </div>
    `).join('');

    const modal = document.getElementById('payment-modal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function removeFromCart(id) {
    // Filtramos el array para dejar fuera el ID que queremos borrar
    cart = cart.filter(item => item.id !== id);
    
    // Guardamos el carrito actualizado en el almacenamiento local
    localStorage.setItem('nexus_cart', JSON.stringify(cart));
    
    // Actualizamos el contador del botón superior de la tienda
    updateCartDOM();
    
    // Si el carrito se ha quedado completamente vacío, cerramos la ventana automáticamente
    if (cart.length === 0) {
        closePaymentPasarela();
        showNotification("El carrito se ha quedado vacío.");
    } else {
        // Si aún quedan juegos, volvemos a renderizar la lista y el nuevo total sin cerrar el modal
        const total = cart.reduce((sum, item) => sum + item.precio, 0).toFixed(2);
        document.getElementById('payment-total').textContent = `Importe a liquidar: ${total} €`;
        openPaymentPasarela(); 
        showNotification("Producto retirado del carrito.");
    }
}

function closePaymentPasarela() {
    const modal = document.getElementById('payment-modal');
    modal.classList.add('hidden'); // ¡Añadimos hidden para que se oculte!
    modal.style.display = 'none';
}

function closePaymentPasarela() {
    document.getElementById('payment-modal').style.display = 'none';
}

function processSecurePayment() {
    const num = document.getElementById('card-num').value;
    const exp = document.getElementById('card-exp').value;
    const cvv = document.getElementById('card-cvv').value;

    if (num.length !== 16 || exp.length < 5 || cvv.length !== 3) {
        showNotification("Datos de tarjeta incompletos.", "error");
        return;
    }

    showNotification("Conectando con la entidad bancaria...");
    setTimeout(() => {
        cart = [];
        localStorage.removeItem('nexus_cart');
        updateCartDOM();
        closePaymentPasarela();
        showNotification("🔒 Transacción aprobada. Títulos transferidos.");
        showSection('library');
    }, 1500);
}

// --- COMENTARIOS / BIBLIOTECA ---
function renderLibrary() {
    const container = document.getElementById('library-games');
    if (!container) return;

    const mockUserGames = [
        { id: 1, titulo: "TEKKEN 8" },
        { id: 6, titulo: "*Furi" }
    ];

    fetch(`${API_URL}/comentarios`)
        .then(res => res.json())
        .then(allComments => {
            container.innerHTML = mockUserGames.map(g => {
                const filteredComments = allComments.filter(c => c.id_juego === g.id);
                return `
                    <div class="card" style="margin-bottom:1.5rem; border-left:4px solid var(--p);">
                        <h3>🎮 Licencia activa: ${g.titulo}</h3>
                        <div style="background:var(--bg); padding:1rem; border-radius:8px; margin-bottom:1rem;">
                            <h4 style="margin-top:0; color:var(--text-muted);">Soporte Técnico:</h4>
                            ${filteredComments.length === 0 ? '<p style="color:var(--text-muted); font-size:0.9rem; margin:0;">Sin hilos abiertos.</p>' : filteredComments.map(c => `
                                <div style="border-bottom:1px solid #e2e8f0; padding:0.5rem 0;">
                                    <p style="margin:0;"><b>${c.usuario_nombre}:</b> "${c.mensaje}"</p>
                                    ${c.respuesta_dev ? `<p style="margin:5px 0 0 20px; color:var(--p); font-weight:500;"><b>Desarrollador:</b> "${c.respuesta_dev}"</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div style="display:flex; gap:10px;">
                            <input type="text" id="feed-msg-${g.id}" placeholder="Escribe tu consulta aquí..." style="flex:1; padding:0.6rem; border-radius:6px; border:1px solid #cbd5e1;">
                            <button class="btn-p" style="width:auto;" onclick="sendFeedback(${g.id})">Enviar Feedback</button>
                        </div>
                    </div>
                `;
            }).join('');
        });
}

function sendFeedback(gameId) {
    const input = document.getElementById(`feed-msg-${gameId}`);
    if (!input || !input.value.trim()) return showNotification("Campo de feedback vacío.", "error");

    fetch(`${API_URL}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_juego: gameId, mensaje: input.value })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification("✅ Feedback registrado en el servidor.");
            renderLibrary();
        }
    });
}

// --- PANEL DEV ---
function renderDevPanel() {
    const list = document.getElementById('dev-comments-list');
    if (!list) return;

    fetch(`${API_URL}/comentarios`)
        .then(res => res.json())
        .then(comments => {
            list.innerHTML = comments.map(c => `
                <div style="background:#f8fafc; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #e2e8f0;">
                    <p style="margin:0 0 6px 0; font-size:0.9rem; color:var(--text-muted);"><b>Línea comercial:</b> ${c.juego_titulo}</p>
                    <p style="margin:0 0 1rem 0; font-weight:500;">"${c.mensaje}"</p>
                    ${c.respuesta_dev ? `
                        <div style="background:rgba(99,102,241,0.06); padding:0.6rem; border-left:3px solid var(--p);">
                            <b>Tu Réplica:</b> "${c.respuesta_dev}"
                        </div>
                    ` : `
                        <div style="display:flex; gap:10px;">
                            <input type="text" id="dev-rep-${c.id}" placeholder="Formular respuesta..." style="flex:1; padding:0.5rem; border-radius:6px; border:1px solid #cbd5e1;">
                            <button class="btn-s" style="width:auto;" onclick="sendDevReply(${c.id})">Responder</button>
                        </div>
                    `}
                </div>
            `).join('');
        });
}

function sendDevReply(commentId) {
    const input = document.getElementById(`dev-rep-${commentId}`);
    if (!input || !input.value.trim()) return showNotification("Campo vacío.", "error");

    fetch(`${API_URL}/comentarios/${commentId}/respuesta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuesta_dev: input.value })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification("✅ Réplica archivada.");
            renderDevPanel();
        }
    });
}

function publishGame() {
    const title = document.getElementById('new-title').value;
    const precio = parseFloat(document.getElementById('new-price').value); // ¡Corregido aquí!

    if (!title || isNaN(precio)) {
        showNotification("Por favor, introduce un título y precio válidos.", "error");
        return;
    }

    fetch(`${API_URL}/juegos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: title, precio: precio })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification(`¡"${title}" se ha publicado con persistencia real!`);
            document.getElementById('new-title').value = '';
            document.getElementById('new-price').value = '';
            renderDevPanel();
        }
    });
}

function logout() {
    currentUser = null;
    document.getElementById('auth-btns').classList.remove('hidden');
    document.getElementById('user-menu').classList.add('hidden');
    const oldCounter = document.getElementById('cart-counter');
    if (oldCounter) oldCounter.remove();
    showSection('login');
    showNotification("Sesión cerrada.");
}