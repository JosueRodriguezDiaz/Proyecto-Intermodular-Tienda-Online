CREATE DATABASE nexus_games;
USE nexus_games;


CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email_hash VARBINARY(255),
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'DEV', 'USER') DEFAULT 'USER'
);


CREATE TABLE juegos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100),
    precio DECIMAL(10,2),
    id_autor INT,
    FOREIGN KEY (id_autor) REFERENCES usuarios(id)
);


CREATE TABLE comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_juego INT,
    id_usuario INT,
    mensaje TEXT,
    respuesta_dev TEXT,
    FOREIGN KEY (id_juego) REFERENCES juegos(id),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);