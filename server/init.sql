-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Grupos
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    admin_id INTEGER REFERENCES users(id),
    encargado_id INTEGER REFERENCES users(id),
    current_fine_amount INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Participantes
CREATE TABLE IF NOT EXISTS participants (
    user_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id),
    username VARCHAR(50),
    accumulated_fine INTEGER DEFAULT 0,
    current_objective TEXT DEFAULT 'Sin objetivo',
    has_wildcard BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, group_id)
);

-- Tabla de Evidencias
CREATE TABLE IF NOT EXISTS evidence (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id),
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(50),
    week_id VARCHAR(20) NOT NULL,
    description TEXT,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Retos
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id),
    challenger_id INTEGER REFERENCES users(id),
    challenger_name VARCHAR(50),
    challenged_id INTEGER REFERENCES users(id),
    challenged_name VARCHAR(50),
    description TEXT,
    fine_amount INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'PENDING'
);

-- Tabla de Logs
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id),
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(20) DEFAULT 'INFO'
);

-- Tabla de Semanas Cerradas
CREATE TABLE IF NOT EXISTS closed_weeks (
    group_id INTEGER REFERENCES groups(id),
    week_id VARCHAR(20),
    PRIMARY KEY (group_id, week_id)
);