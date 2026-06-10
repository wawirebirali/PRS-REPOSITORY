ALTER TABLE quotation_request_items 
ADD COLUMN uom VARCHAR(25) NULL;


ALTER TABLE quotations
ADD COLUMN delivery_date DATE NULL;

ALTER TABLE quotation_request_suppliers
ADD COLUMN selected_supplier ENUM('YES','NO') DEFAULT 'NO';