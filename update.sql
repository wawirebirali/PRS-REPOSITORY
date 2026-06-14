ALTER TABLE quotation_request_items 
ADD COLUMN uom VARCHAR(25) NULL;


ALTER TABLE quotations
ADD COLUMN delivery_date DATE NULL;

ALTER TABLE quotation_request_suppliers
ADD COLUMN selected_supplier ENUM('YES','NO') DEFAULT 'NO';


ALTER TABLE purchase_orders
ADD COLUMN supplier_id INT,
ADD CONSTRAINT fk_purchase_orders_supplier
FOREIGN KEY (supplier_id)
REFERENCES suppliers(supplier_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;


ALTER TABLE `quotations` ADD `created_by` INT NOT NULL AFTER `delivery_date`;
ADD CONSTRAINT fk_quotation_user_created
FOREIGN KEY (user_id)
REFERENCES userss(user_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;


ALTER TABLE `grn` ADD `status` ENUM('verified','canceled','pending') NOT NULL AFTER `created_at`;