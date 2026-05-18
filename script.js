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
    if (sectionId === 'admin') renderAdminPanel();
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

            // Mostramos el botón de "Mi Panel" si el usuario no es un USER normal
            const btnPanelRol = document.getElementById('btn-panel-rol');
            if (btnPanelRol) {
                btnPanelRol.classList.toggle('hidden', currentUser.rol === 'USER');
            }
            
            // --- INICIALIZACIÓN DE BIBLIOTECA EXCLUSIVA POR USUARIO ---
            // Solo si este correo no tiene historial en LocalStorage, le damos sus juegos base
            const storageKey = `nexus_owned_games_${currentUser.email}`;
            if (!localStorage.getItem(storageKey)) {
                const juegosPorDefecto = [
                    { id: 1, titulo: "TEKKEN 8" },
                    { id: 6, titulo: "Furi" }
                ];
                localStorage.setItem(storageKey, JSON.stringify(juegosPorDefecto));
            }
            // ---------------------------------------------------------

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
            list.innerHTML = games.map(g => {
                // Comprobamos si el usuario activo es administrador
                const isAdmin = currentUser && currentUser.rol === 'ADMIN';
                
                return `
                <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; height:380px; padding:1rem; border: ${isAdmin ? '2px dashed var(--a)' : '1px solid rgba(0,0,0,0.04)'};">
                    <div style="text-align:center;">
                        <div class="game-card-img-container">
                            ${g.imagen ? `
                                <img src="${g.imagen}" alt="${g.titulo}" class="game-card-img">
                            ` : `
                                <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-weight:600; font-size:0.9rem;">
                                    📸 Sin portada
                                </div>
                            `}
                        </div>
                        
                        <h3 style="margin:0 0 0.3rem 0; font-size:1.15rem; text-align:left;">${g.titulo}</h3>
                        <p class="price" style="font-size:1.3rem; font-weight:700; color:var(--p); margin:0; text-align:left;">${g.precio} €</p>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:8px; margin-top:auto;">
                        <button class="btn-p" style="width:100%;" onclick="addToCart(${g.id}, '${g.titulo.replace(/'/g, "\\'")}', ${g.precio})">
                            Agregar al Carrito
                        </button>
                        ${isAdmin ? `
                            <button class="btn-logout" style="width:100%; padding:0.5rem; font-size:0.9rem; background:var(--a);" onclick="deleteGameMaster(${g.id})">
                                🗑️ Eliminar Producto
                            </button>
                        ` : ''}
                    </div>
                </div>
                `;
            }).join('');
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
    modal.classList.add('hidden'); 
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
        // 1. Apuntamos a la biblioteca exclusiva de este usuario
        const storageKey = `nexus_owned_games_${currentUser.email}`;
        let ownedGames = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        // 2. ¡AQUÍ ESTÁ LA CLAVE! Recorremos ÚNICAMENTE los elementos reales del carrito (cart)
        cart.forEach(item => {
            // Validamos que el juego no estuviera ya comprado para no duplicarlo
            if (!ownedGames.some(g => g.id === item.id)) {
                ownedGames.push({ id: item.id, titulo: item.titulo });
            }
        });
        
        // 3. Guardamos los cambios en su cuenta
        localStorage.setItem(storageKey, JSON.stringify(ownedGames));

        // 4. Limpiamos carrito y cerramos pasarela
        cart = [];
        localStorage.removeItem('nexus_cart');
        updateCartDOM();
        closePaymentPasarela();
        showNotification("🔒 Transacción aprobada. Títulos transferidos.");
        showSection('library');
    }, 1500);
}

// --- FUNCIONES EXCLUSIVAS DE ADMINISTRACIÓN (BORRADO) ---

function deleteGameMaster(gameId) {
    if (!confirm("⚠️ ¿Estás completamente seguro de eliminar este juego? Se borrarán también todas sus consultas de soporte técnico asociadas.")) return;

    fetch(`${API_URL}/juegos/${gameId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        showNotification("💥 Juego purgado del catálogo global.");
        renderStore(); // Refrescamos la tienda
        if (currentUser.rol === 'ADMIN') renderAdminPanel(); // Refrescamos el listado del admin si existe
    })
    .catch(() => showNotification("Error al intentar procesar el borrado.", "error"));
}

function deleteCommentMaster(commentId) {
    if (!confirm("¿Deseas eliminar este registro de comentario de la base de datos?")) return;

    fetch(`${API_URL}/comentarios/${commentId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        showNotification("🗑️ Registro de feedback destruido con éxito.");
        renderAdminPanel(); // Refrescamos el panel de auditoría
    })
    .catch(() => showNotification("Error al intentar borrar el comentario.", "error"));
}

function renderAdminPanel() {
    const listContainer = document.getElementById('admin-audit-comments');
    if (!listContainer) return;

    fetch(`${API_URL}/comentarios`)
        .then(res => res.json())
        .then(comments => {
            if (comments.length === 0) {
                listContainer.innerHTML = '<p style="color:var(--text-muted);">No hay logs de comentarios activos en la plataforma.</p>';
                return;
            }

            listContainer.innerHTML = comments.map(c => `
                <div style="background:#f8fafc; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <p style="margin:0 0 4px 0; font-size:0.85rem; color:var(--text-muted);"><b>Juego ID ${c.id_juego}:</b> ${c.juego_titulo} | <b>De:</b> ${c.usuario_nombre}</p>
                        <p style="margin:0; font-style:italic;">"${c.mensaje}"</p>
                    </div>
                    <button class="btn-logout" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:var(--a);" onclick="deleteCommentMaster(${c.id})">
                        Eliminar Log
                    </button>
                </div>
            `).join('');
        });
}

// --- COMENTARIOS / BIBLIOTECA ---
function renderLibrary() {
    const container = document.getElementById('library-games');
    if (!container) return;

    if (!currentUser) {
        container.innerHTML = '<p style="color:var(--text-muted);">Inicia sesión para ver tu biblioteca.</p>';
        return;
    }

    const storageKey = `nexus_owned_games_${currentUser.email}`;
    const userGames = JSON.parse(localStorage.getItem(storageKey)) || [];

    if (userGames.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">Tu biblioteca está vacía. ¡Visita la tienda para adquirir juegos!</p>';
        return;
    }

    fetch(`${API_URL}/comentarios`)
        .then(res => res.json())
        .then(allComments => {
            container.innerHTML = userGames.map(g => {
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
                            <button type="button" class="btn-p" style="width:auto;" onclick="sendFeedback(${g.id})">Enviar Feedback</button>
                        </div>
                    </div>
                `;
            }).join('');
        });
}

function sendFeedback(gameId) {
    const input = document.getElementById(`feed-msg-${gameId}`);
    if (!input || !input.value.trim()) {
        showNotification("No puedes transmitir una consulta vacía.", "error");
        return;
    }

    // Validación estricta para evitar corromper la sesión asíncrona
    if (!currentUser) {
        showNotification("Sesión no válida. Por favor, identifícate.", "error");
        return;
    }

    const nombreUsuario = currentUser.username;

    fetch(`${API_URL}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id_juego: gameId, 
            mensaje: input.value,
            usuario_nombre: nombreUsuario 
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification("🚀 Consulta de soporte indexada con éxito.");
            input.value = '';
            // Renderizamos la biblioteca asegurando que currentUser sigue intacto
            renderLibrary(); 
        }
    })
    .catch(() => showNotification("Error al conectar con el servidor de feedback.", "error"));
}

// --- PANEL DEV ---
function renderDevPanel() {
    const listContainer = document.getElementById('dev-comments-list');
    if (!listContainer) return;

    fetch(`${API_URL}/comentarios`)
        .then(res => res.json())
        .then(comments => {
            if (comments.length === 0) {
                listContainer.innerHTML = '<p style="color:var(--text-muted);">No hay consultas pendientes de soporte.</p>';
                return;
            }

            listContainer.innerHTML = comments.map(c => `
                <div style="background:#f8fafc; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #e2e8f0; position: relative;">
                    
                    <button type="button" 
                            style="position: absolute; top: 10px; right: 10px; background: var(--a); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;" 
                            onclick="deleteCommentMasterDev(${c.id})">
                        🗑️ Eliminar
                    </button>

                    <p style="margin:0 80px 4px 0; font-size:0.85rem; color:var(--text-muted); text-align: left;">
                        <b>Juego:</b> ${c.juego_titulo} | <b>Usuario:</b> ${c.usuario_nombre}
                    </p>
                    <p style="margin:0 0 10px 0; font-style:italic; text-align: left;">"${c.mensaje}"</p>
                    
                    ${c.respuesta_dev ? `
                        <p style="margin:0; color:var(--success); font-weight:600; text-align: left;">✓ Respondido: "${c.respuesta_dev}"</p>
                    ` : `
                        <div style="display:flex; gap:10px; margin-top:10px;">
                            <input type="text" id="dev-rep-${c.id}" placeholder="Escribe la solución técnica..." style="flex:1; padding:0.5rem; border-radius:6px; border:1px solid #cbd5e1; font-size:0.9rem;">
                            <button type="button" class="btn-p" style="width:auto; padding:0.5rem 1rem; font-size:0.9rem;" onclick="sendDevReply(${c.id})">Responder</button>
                        </div>
                    `}
                </div>
            `).join('');
        });
}

// FUNCIÓN AUXILIAR DE BORRADO EXCLUSIVA PARA EL REFRESCO DEL DEV
function deleteCommentMasterDev(commentId) {
    if (!confirm("¿Deseas eliminar permanentemente esta incidencia de soporte?")) return;

    fetch(`${API_URL}/comentarios/${commentId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        showNotification("🗑️ Feedback eliminado del sistema.");
        renderDevPanel(); // Refresca instantáneamente el panel del desarrollador sin desloguear
    })
    .catch(() => showNotification("Error al intentar borrar el comentario.", "error"));
}

function sendDevReply(commentId) {
    const input = document.getElementById(`dev-rep-${commentId}`);
    if (!input || !input.value.trim()) {
        showNotification("Campo vacío.", "error");
        return;
    }

    if (!currentUser) {
        showNotification("Sesión inválida o expirada.", "error");
        return;
    }

    fetch(`${API_URL}/comentarios/${commentId}/respuesta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuesta_dev: input.value })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification("✅ Réplica archivada.");
            // Refrescamos el panel manteniendo la sesión activa
            renderDevPanel();
        }
    })
    .catch(() => showNotification("Error al procesar la respuesta en el backend.", "error"));
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

// --- REDIRECCIÓN AL PANEL DE TRABAJO SEGÚN EL ROL ACTIVO ---
function redirectToRolePanel() {
    if (!currentUser) return;
    
    if (currentUser.rol === 'DEV') {
        showSection('dev');
    } else if (currentUser.rol === 'ADMIN') {
        showSection('admin');
    } else {
        showSection('shop');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('auth-btns').classList.remove('hidden');
    document.getElementById('user-menu').classList.add('hidden');
    
    // --- NUEVA LÓGICA: Ocultar el botón del panel al cerrar sesión ---
    const btnPanelRol = document.getElementById('btn-panel-rol');
    if (btnPanelRol) {
        btnPanelRol.classList.add('hidden');
    }
    // -----------------------------------------------------------------

    const oldCounter = document.getElementById('cart-counter');
    if (oldCounter) oldCounter.remove();
    
    showSection('login');
    showNotification("Sesión cerrada.");
}