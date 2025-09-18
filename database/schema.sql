DROP TABLE IF EXISTS contact CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;

-- Users table
CREATE TABLE app_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

-- Contacts table
CREATE TABLE contact (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    relationship VARCHAR(50),
    is_emergency BOOLEAN DEFAULT FALSE
);

-- Try data
INSERT INTO app_user (username, email, password_hash)
VALUES 
('alice', 'alice@example.com', 'hashed_pw1'),
('bob', 'bob@example.com', 'hashed_pw2');

INSERT INTO contact (user_id, name, phone_number, email, relationship, is_emergency)
VALUES
(1, 'Alice Mother', '+61412345678', NULL, 'Mother', TRUE),
(1, 'Charlie Lee', '+61455554444', 'charlie@example.com', 'Colleague', FALSE);

INSERT INTO contact (user_id, name, phone_number, relationship, is_emergency)
VALUES
(2, 'Bob Father', '+61499998888', 'Father', TRUE),
(2, 'David Wu', '+61433332222', 'Friend', FALSE);

-- Get Alice's contacts
SELECT * FROM contact WHERE user_id = 1;

-- Get Alice's emergency contact
SELECT * FROM contact WHERE user_id = 1 AND is_emergency = TRUE;

-- Get all users and their emergency contact
SELECT u.username, c.name, c.phone_number
FROM app_user u
JOIN contact c ON u.id = c.user_id
WHERE c.is_emergency = TRUE;
