ALTER TABLE requisitions
ADD COLUMN item_budget DECIMAL(12,2) DEFAULT 0 AFTER submission_date;


ALTER TABLE users
ADD COLUMN phone VARCHAR(50) NULL AFTER email;


ALTER TABLE purchase_orders
ADD COLUMN quotation_id INT NULL AFTER requisition_id;




ALTER TABLE invoices
ADD COLUMN created_by INT NULL AFTER status;


ALTER TABLE invoices
ADD CONSTRAINT fk_invoice_created_by
FOREIGN KEY (created_by)
REFERENCES users(user_id)
ON DELETE SET NULL
ON UPDATE CASCADE;