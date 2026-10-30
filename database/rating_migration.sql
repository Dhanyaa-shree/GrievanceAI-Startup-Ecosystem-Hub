-- ============================================================
-- OFFICER RATING SYSTEM MIGRATION
-- Run this ONCE after your initial schema is set up.
-- Safe to re-run — uses IF NOT EXISTS and existence checks.
-- ============================================================

USE grievance_ai;

-- ============================================================
-- Create officer_ratings table
-- ============================================================
CREATE TABLE IF NOT EXISTS officer_ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    officer_id INT NOT NULL,
    founder_id INT NOT NULL,
    grievance_id INT NOT NULL,
    rating TINYINT NOT NULL,
    feedback VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),

    FOREIGN KEY (officer_id)   REFERENCES officers(officer_id)   ON DELETE CASCADE,
    FOREIGN KEY (founder_id)   REFERENCES founders(founder_id)   ON DELETE CASCADE,
    FOREIGN KEY (grievance_id) REFERENCES grievances(id)        ON DELETE CASCADE,

    UNIQUE KEY unique_grievance_rating (grievance_id),
    INDEX idx_officer (officer_id),
    INDEX idx_founder (founder_id),
    INDEX idx_rating  (rating)
);

-- ============================================================
-- Fallback trigger for MySQL < 8.0.16
-- (CHECK constraints aren't enforced before 8.0.16)
-- ============================================================
DROP TRIGGER IF EXISTS trg_officer_ratings_insert_check;
DROP TRIGGER IF EXISTS trg_officer_ratings_update_check;

DELIMITER $$

CREATE TRIGGER trg_officer_ratings_insert_check
BEFORE INSERT ON officer_ratings
FOR EACH ROW
BEGIN
    IF NEW.rating < 1 OR NEW.rating > 5 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Rating must be between 1 and 5';
    END IF;
END$$

CREATE TRIGGER trg_officer_ratings_update_check
BEFORE UPDATE ON officer_ratings
FOR EACH ROW
BEGIN
    IF NEW.rating < 1 OR NEW.rating > 5 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Rating must be between 1 and 5';
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- Done
-- ============================================================
SELECT '✅ officer_ratings table ready' AS status;
DESCRIBE officer_ratings;