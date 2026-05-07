-- ============================================================
--  AgriHub Database Setup
--  Run this in phpMyAdmin or MySQL command line
-- ============================================================

-- Create the database
CREATE DATABASE IF NOT EXISTS agrihub
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE agrihub;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    email      VARCHAR(150)  NOT NULL UNIQUE,
    password   VARCHAR(255)  NOT NULL,
    role       ENUM('farmer','trader','official','admin') NOT NULL DEFAULT 'farmer',
    phone      VARCHAR(20)   DEFAULT NULL,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Produce ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produce (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id       INT          NOT NULL,
    commodity       VARCHAR(100) NOT NULL,
    quantity_kg     DECIMAL(10,2) NOT NULL,
    source_location VARCHAR(150) DEFAULT NULL,
    quality_grade   ENUM('A','B','C','ungraded') DEFAULT 'ungraded',
    status          ENUM('pending','verified','sold') DEFAULT 'pending',
    notes           TEXT         DEFAULT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Prices ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prices (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    commodity    VARCHAR(100)  NOT NULL,
    price_ugx    DECIMAL(10,2) NOT NULL,
    unit         VARCHAR(20)   DEFAULT 'kg',
    logged_by    INT           NOT NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    produce_id    INT           NOT NULL,
    buyer_id      INT           NOT NULL,
    seller_id     INT           NOT NULL,
    amount_ugx    DECIMAL(12,2) NOT NULL,
    quantity_kg   DECIMAL(10,2) NOT NULL,
    recorded_by   INT           NOT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produce_id)  REFERENCES produce(id)  ON DELETE CASCADE,
    FOREIGN KEY (buyer_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (seller_id)   REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)    ON DELETE CASCADE
);

-- ── Quality Checks ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quality_checks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    produce_id  INT  NOT NULL,
    official_id INT  NOT NULL,
    grade       ENUM('A','B','C') NOT NULL,
    notes       TEXT DEFAULT NULL,
    checked_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produce_id)  REFERENCES produce(id) ON DELETE CASCADE,
    FOREIGN KEY (official_id) REFERENCES users(id)   ON DELETE CASCADE
);

-- ── Seed: default admin account ──────────────────────────────
-- Password: admin123
INSERT IGNORE INTO users (name, email, password, role) VALUES (
    'AgriHub Admin',
    'admin@agrihub.ug',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin'
);
