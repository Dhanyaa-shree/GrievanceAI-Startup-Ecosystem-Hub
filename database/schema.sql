-- ============================================================
-- GRIEVANCEAI DATABASE SCHEMA
-- Complete schema with officers, tickets, chat, elite, premium,
-- ratings, and General category support.
-- ============================================================

CREATE DATABASE IF NOT EXISTS grievance_ai;
USE grievance_ai;

-- ============================================================
-- TABLE 1: Whitelist Numbers
-- ============================================================
CREATE TABLE IF NOT EXISTS whitelist_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile_number VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO whitelist_numbers (mobile_number) VALUES
('9876543210'), ('9876543211'), ('9876543212'), ('9876543213'), ('9876543214'),
('9876543215'), ('9876543216'), ('9876543217'), ('9876543218'), ('9876543219'),
('9876543220'), ('9876543221'), ('9876543222'), ('9876543223'), ('9876543224'),
('9876543225'), ('9876543226'), ('9876543227'), ('9876543228'), ('9876543229'),
('9876543230'), ('9876543231'), ('9876543232'), ('9876543233'), ('9876543234'),
('9876543235');

-- ============================================================
-- TABLE 2: Founders
-- ============================================================
CREATE TABLE IF NOT EXISTS founders (
    founder_id INT AUTO_INCREMENT PRIMARY KEY,
    founder_name VARCHAR(100) NOT NULL,
    startup_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mobile_number VARCHAR(10) UNIQUE NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 3: Officers
-- (Must be before `grievances` so we can add the FK inline)
-- ============================================================
CREATE TABLE IF NOT EXISTS officers (
    officer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    max_grievances INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);

-- ============================================================
-- TABLE 4: Grievances
-- (assigned_officer_id FK can now reference officers because
--  officers is created above)
-- ============================================================
CREATE TABLE IF NOT EXISTS grievances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    founder_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    predicted_category VARCHAR(50) NOT NULL,
    status ENUM('Pending', 'Under Review', 'Resolved') DEFAULT 'Pending',
    date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_officer_id INT NULL,
    assignment_status ENUM('Unassigned', 'Assigned', 'Under Review', 'Resolved') DEFAULT 'Unassigned',
    has_active_ticket BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (founder_id) REFERENCES founders(founder_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_officer_id) REFERENCES officers(officer_id) ON DELETE SET NULL,

    INDEX idx_founder_id (founder_id),
    INDEX idx_status (status),
    INDEX idx_category (predicted_category),
    INDEX idx_assignment_status (assignment_status),
    INDEX idx_assigned_officer (assigned_officer_id)
);

-- ============================================================
-- TABLE 5: Officer Availability
-- ============================================================
CREATE TABLE IF NOT EXISTS officer_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    officer_id INT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    status_message VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
    UNIQUE KEY unique_officer_availability (officer_id)
);

-- ============================================================
-- TABLE 6: Grievance Assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS grievance_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    grievance_id INT NOT NULL,
    officer_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(50) DEFAULT 'admin',
    status ENUM('Active', 'Completed', 'Reassigned') DEFAULT 'Active',
    completion_notes TEXT,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
    INDEX idx_grievance (grievance_id),
    INDEX idx_officer (officer_id),
    INDEX idx_status (status)
);

-- ============================================================
-- TABLE 7: Tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    grievance_id INT NOT NULL,
    founder_id INT NOT NULL,
    officer_id INT NOT NULL,
    ticket_type ENUM('chat', 'document', 'call') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Paid', 'Active', 'Completed', 'Cancelled', 'Expired') DEFAULT 'Pending',
    payment_id VARCHAR(100),
    payment_method VARCHAR(100),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
    FOREIGN KEY (founder_id) REFERENCES founders(founder_id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
    INDEX idx_founder (founder_id),
    INDEX idx_officer (officer_id),
    INDEX idx_status (status),
    INDEX idx_type (ticket_type)
);

-- ============================================================
-- TABLE 8: Ticket Activity Log
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_activity_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 9: Elite Documents
-- ============================================================
CREATE TABLE IF NOT EXISTS elite_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    founder_id INT NOT NULL,
    officer_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_reviewed BOOLEAN DEFAULT FALSE,
    review_notes TEXT,
    review_at TIMESTAMP NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (founder_id) REFERENCES founders(founder_id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_reviewed (is_reviewed)
);

-- ============================================================
-- TABLE 10: Chat Messages
-- (Single chat table — used by all tiers)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    sender_type ENUM('founder', 'officer') NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    document_id INT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES elite_documents(document_id) ON DELETE SET NULL,
    INDEX idx_ticket (ticket_id),
    INDEX idx_sender (sender_type, sender_id),
    INDEX idx_read (is_read),
    INDEX idx_document (document_id)
);

-- ============================================================
-- TABLE 11: Officer Chat Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS officer_chat_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    officer_id INT NOT NULL,
    ticket_id INT NOT NULL,
    founder_id INT NOT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unread_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (founder_id) REFERENCES founders(founder_id) ON DELETE CASCADE,
    UNIQUE KEY unique_officer_session (ticket_id),
    INDEX idx_officer (officer_id),
    INDEX idx_founder (founder_id),
    INDEX idx_active (is_active)
);

-- ============================================================
-- TABLE 12: Founder Chat Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS founder_chat_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    founder_id INT NOT NULL,
    ticket_id INT NOT NULL,
    officer_id INT NOT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unread_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (founder_id) REFERENCES founders(founder_id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
    UNIQUE KEY unique_founder_session (ticket_id),
    INDEX idx_founder (founder_id),
    INDEX idx_officer (officer_id),
    INDEX idx_active (is_active)
);

-- ============================================================
-- TABLE 13: Premium Meetings
-- slot_key is a generated column that is only populated for
-- Scheduled/Rescheduled meetings, so the unique index blocks
-- double-booking without blocking re-booking of cancelled slots.
-- ============================================================
CREATE TABLE IF NOT EXISTS premium_meetings (
    meeting_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    founder_id INT NOT NULL,
    officer_id INT NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    meeting_duration INT DEFAULT 30,
    meeting_topic VARCHAR(255) DEFAULT 'Expert Consultation',
    zoom_link VARCHAR(500),
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'Rescheduled') DEFAULT 'Scheduled',
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    slot_key VARCHAR(100)
        GENERATED ALWAYS AS (
            CASE WHEN status IN ('Scheduled', 'Rescheduled')
                 THEN CONCAT(officer_id, '_', meeting_date, '_', meeting_time)
                 ELSE NULL END
        ) STORED,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (founder_id) REFERENCES founders(founder_id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
    UNIQUE KEY unique_active_slot (slot_key),
    INDEX idx_meeting_slot (officer_id, meeting_date, meeting_time),
    INDEX idx_officer (officer_id),
    INDEX idx_date (meeting_date),
    INDEX idx_status (status)
);

-- ============================================================
-- TABLE 14: Officer Ratings
-- ============================================================
CREATE TABLE IF NOT EXISTS officer_ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    officer_id INT NOT NULL,
    founder_id INT NOT NULL,
    grievance_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
    FOREIGN KEY (founder_id) REFERENCES founders(founder_id) ON DELETE CASCADE,
    FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
    UNIQUE KEY unique_grievance_rating (grievance_id),
    INDEX idx_officer (officer_id),
    INDEX idx_founder (founder_id),
    INDEX idx_rating (rating)
);

-- ============================================================
-- OFFICER SEED DATA
-- Password: officer123 (hashes are set by seed_officers.py)
-- ============================================================

-- Hiring Officers (Placement Cell)
INSERT IGNORE INTO officers (name, email, password_hash, category) VALUES
('Dr. Rajesh Kumar',  'placement1@clg.edu', 'PENDING_HASH', 'Hiring'),
('Prof. Priya Sharma','placement2@clg.edu', 'PENDING_HASH', 'Hiring'),
('Dr. Amit Patel',    'placement3@clg.edu', 'PENDING_HASH', 'Hiring');

-- Marketing Officers
INSERT IGNORE INTO officers (name, email, password_hash, category) VALUES
('Ms. Sneha Reddy',   'marketing1@clg.edu', 'PENDING_HASH', 'Marketing'),
('Mr. Vikram Singh',  'marketing2@clg.edu', 'PENDING_HASH', 'Marketing'),
('Ms. Ananya Nair',   'marketing3@clg.edu', 'PENDING_HASH', 'Marketing');

-- Legal Officers (Lawyers)
INSERT IGNORE INTO officers (name, email, password_hash, category) VALUES
('Adv. Sunil Mehta',  'legal1@clg.edu', 'PENDING_HASH', 'Legal'),
('Adv. Neha Gupta',   'legal2@clg.edu', 'PENDING_HASH', 'Legal'),
('Adv. Ravi Desai',   'legal3@clg.edu', 'PENDING_HASH', 'Legal');

-- Funding Officers
INSERT IGNORE INTO officers (name, email, password_hash, category) VALUES
('Mr. Suresh Reddy',  'funding1@clg.edu', 'PENDING_HASH', 'Funding'),
('Ms. Deepa Nair',    'funding2@clg.edu', 'PENDING_HASH', 'Funding'),
('Mr. Rohan Shah',    'funding3@clg.edu', 'PENDING_HASH', 'Funding');

-- Mentorship Officers
INSERT IGNORE INTO officers (name, email, password_hash, category) VALUES
('Dr. Shreya Krishnan','mentor1@clg.edu', 'PENDING_HASH', 'Mentorship'),
('Mr. Arun Prakash',   'mentor2@clg.edu', 'PENDING_HASH', 'Mentorship'),
('Ms. Kavya Sharma',   'mentor3@clg.edu', 'PENDING_HASH', 'Mentorship');

-- General Officers (NEW)
INSERT IGNORE INTO officers (name, email, password_hash, category) VALUES
('Mr. Aditya Rao',    'general1@clg.edu', 'PENDING_HASH', 'General'),
('Ms. Meera Pillai',  'general2@clg.edu', 'PENDING_HASH', 'General'),
('Mr. Nikhil Joshi',  'general3@clg.edu', 'PENDING_HASH', 'General');

-- Initialize availability for all officers
INSERT IGNORE INTO officer_availability (officer_id, is_available)
SELECT officer_id, TRUE FROM officers;

-- ============================================================
-- SAMPLE FOUNDERS
-- ============================================================
INSERT IGNORE INTO founders (founder_name, startup_name, email, mobile_number) VALUES
('Pooja Singh',  'TechFlow',      'pooja@techflow.com',   '9876543210'),
('Rahul Sharma', 'HealthCare AI', 'rahul@healthcare.com', '9876543211');

-- ============================================================
-- SAMPLE GRIEVANCES
-- ============================================================
INSERT IGNORE INTO grievances
    (founder_id, title, description, predicted_category, status, date, assignment_status, has_active_ticket)
VALUES
    (1,
     'Payment Gateway Integration Failed',
     'Our payment gateway is failing randomly. Customers cannot complete transactions.',
     'Funding', 'Pending', NOW() - INTERVAL 1 DAY, 'Unassigned', FALSE),
    (2,
     'Hiring Technical Talent',
     'Struggling to find developers. Need recruitment strategy advice.',
     'Hiring', 'Under Review', NOW() - INTERVAL 2 DAY, 'Unassigned', FALSE);