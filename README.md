# Nexus Games Pro - Community Edition 🎮

Este repositorio contiene el **Producto Mínimo Viable (MVP)** funcional desarrollado para el **Proyecto Intermodular de 2º de DAW** en el **IES Francisco de Quevedo**.

La aplicación es una **Single Page Application (SPA)** nativa que integra la gestión de catálogos de videojuegos, paneles analíticos para desarrolladores y auditoría de sistemas.

🚀 Instrucciones para la Ejecución del Proyecto (Local Deployment)
Al tratarse de una arquitectura Full-Stack desacoplada con un servidor API REST en Node.js, la plataforma no puede ejecutarse de forma puramente estática desde GitHub. Para probar la persistencia de datos, el flujo de roles y el carrito, siga estos pasos:

Descargar el proyecto: Clone el repositorio o descargue el archivo .zip desde GitHub y descomprímalo en su equipo.

Instalar dependencias: Abra una terminal en la carpeta raíz del proyecto e instale los módulos necesarios ejecutando:

Bash
npm install express cors
Encender el Servidor (Back-End): Inicie el motor de persistencia JSON ejecutando el archivo del servidor:

Bash
node server.js
(Verá un mensaje en la consola confirmando que la API está activa en el puerto 3000).

Ejecutar la Aplicación (Front-End): Ahora, abra el archivo index.html en su navegador. El mensaje de error desaparecerá y la comunicación asíncrona estará 100% operativa.

## 🛠️ Tecnologías Utilizadas
* **Frontend:** HTML5 Semántico, CSS3 Avanzado (Variables globales, Flexbox, CSS Grid) y JavaScript ES6+ Nativo (Vanilla JS).
* **Persistencia y Sistemas:** Estructura relacional SQL ANSI y scripts de automatización de copias de seguridad.

## 🔑 Credenciales para la Corrección (Simulación de Roles)
Para probar los tres flujos y entornos de la SPA, utilice los siguientes accesos en el formulario de login:
1. **Perfil Administrador:** Introduzca un correo que contenga la palabra `admin` (Ej: `admin@nexus.com`) y cualquier contraseña de 8+ caracteres. *(Acceso a cortafuegos y backups manuales)*.
2. **Perfil Desarrollador (`DEV`):** Introduzca un correo que contenga la palabra `dev` (Ej: `pablo@dev.com`) y cualquier contraseña de 8+ caracteres. *(Acceso a gráficas de ventas, publicación de juegos y réplicas de feedback)*.
3. **Perfil Usuario (`USER`):** Cualquier otra combinación de correo estándar. *(Acceso a tienda, carrito de compras y biblioteca con sistema de reseñas)*.
