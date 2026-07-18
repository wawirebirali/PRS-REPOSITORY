-- =====================================================
-- UPDATE REQUISITIONS TABLE STRUCTURE
-- Add department budget and required date
-- Remove current_stage and status
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;


-- =====================================================
-- 1. Add department_budget_id column
-- =====================================================

ALTER TABLE requisitions
ADD COLUMN department_budget_id INT NULL
AFTER department_id;


-- =====================================================
-- 2. Add required_date column
-- =====================================================

ALTER TABLE requisitions
ADD COLUMN required_date DATE NULL
AFTER submission_date;


-- =====================================================
-- 3. Update existing records
-- Set required date from submission date
-- =====================================================

UPDATE requisitions
SET required_date = DATE(submission_date)
WHERE required_date IS NULL;


-- =====================================================
-- 4. Assign default department budget
-- Replace 1 with a valid budget ID
-- =====================================================

UPDATE requisitions
SET department_budget_id = 1
WHERE department_budget_id IS NULL;


-- =====================================================
-- 5. Make new columns mandatory
-- =====================================================

ALTER TABLE requisitions
MODIFY department_budget_id INT NOT NULL;


ALTER TABLE requisitions
MODIFY required_date DATE NOT NULL;


-- =====================================================
-- 6. Remove current_stage column
-- =====================================================

ALTER TABLE requisitions
DROP COLUMN current_stage;


-- =====================================================
-- 7. Remove status column
-- =====================================================

ALTER TABLE requisitions
DROP COLUMN status;


-- =====================================================
-- 8. Remove old foreign keys
-- =====================================================

ALTER TABLE requisitions
DROP FOREIGN KEY requisitions_ibfk_1;


ALTER TABLE requisitions
DROP FOREIGN KEY requisitions_ibfk_2;


-- =====================================================
-- 9. Add Department Budget foreign key
-- =====================================================

ALTER TABLE requisitions
ADD CONSTRAINT fk_requisition_budget
FOREIGN KEY (department_budget_id)
REFERENCES department_budget(department_budget_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;


-- =====================================================
-- 10. Recreate User foreign key
-- =====================================================

ALTER TABLE requisitions
ADD CONSTRAINT fk_requisition_user
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON UPDATE CASCADE
ON DELETE CASCADE;


-- =====================================================
-- 11. Recreate Department foreign key
-- =====================================================

ALTER TABLE requisitions
ADD CONSTRAINT fk_requisition_department
FOREIGN KEY (department_id)
REFERENCES departments(department_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;


SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================
-- CHECK FINAL STRUCTURE
-- =====================================================

DESCRIBE requisitions;



CREATE TABLE requisitions (

    requisition_id INT AUTO_INCREMENT PRIMARY KEY,

    prs_no VARCHAR(25) UNIQUE NOT NULL,

    user_id INT NOT NULL,

    department_id INT NOT NULL,

    department_budget_id INT NOT NULL,

    submission_date DATETIME NOT NULL,

    required_date DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_requisition_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_requisition_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_requisition_budget
        FOREIGN KEY (department_budget_id)
        REFERENCES department_budget(department_budget_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

) ENGINE=InnoDB;