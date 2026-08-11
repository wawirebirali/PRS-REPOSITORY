ALTER TABLE requisitions
ADD COLUMN item_budget DECIMAL(12,2) DEFAULT 0 AFTER submission_date;