-- =========================
-- 1. USERS TABLE
-- =========================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
  

    user_role ENUM('admin','finance','ceo','hod','procurement','employee') NOT NULL,
     department ENUM(
        'IT',
        'Finance',
        'HR',
        'Procurement',
        'Administration',
        'Operations',
        'Engineering',
        'Security',
        'QA',
        'QC',
        'Safety',
        'Warehouse',
        'Production',
        'Regulatory'
    ) NULL,
    signature VARCHAR(255) NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================
-- 2. DEPARTMENTS TABLE
-- =========================
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    manager_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_user_id) REFERENCES users(user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;



-- =========================
-- 3. REQUISITIONS TABLE
-- =========================
CREATE TABLE requisitions (
    requisition_id INT AUTO_INCREMENT PRIMARY KEY,
    prs_no VARCHAR(25) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    department_id INT NOT NULL,
    submission_date DATETIME NOT NULL,
    current_stage VARCHAR(100) NOT NULL,
    status ENUM('Pending','Completed','Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================
-- 4. REQUISITION ITEMS
-- =========================
CREATE TABLE requisition_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id INT NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    uom VARCHAR(50) NOT NULL,
    qty_stock INT NOT NULL,
    qty_required INT NOT NULL,
    required_date DATE NOT NULL,
    remark TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (requisition_id) REFERENCES requisitions(requisition_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;




-- =========================
-- 6. PAYMENTS
-- =========================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,

    requisition_id INT NULL,
    invoice_id INT NOT NULL,   -- ✅ RELATION TO INVOICES

    payment_no VARCHAR(50) NOT NULL UNIQUE,

    paid_by INT NOT NULL,

    payment_method ENUM(
        'Cash',
        'Bank Transfer',
        'Cheque',
        'Mobile Money'
    ) NOT NULL,

    amount DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) NOT NULL,
    balance DECIMAL(15,2) NOT NULL,

    currency VARCHAR(10) DEFAULT 'UGX',

    payment_status ENUM(
        'Pending',
        'Partial',
        'Completed',
        'Cancelled'
    ) DEFAULT 'Pending',

    payment_date DATE NOT NULL,

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- FK: invoice
    CONSTRAINT fk_payment_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(invoice_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- FK: requisition (optional traceability)
    CONSTRAINT fk_payment_requisition
        FOREIGN KEY (requisition_id)
        REFERENCES requisitions(requisition_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- FK: user who paid
    CONSTRAINT fk_payment_user
        FOREIGN KEY (paid_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

    CONSTRAINT fk_payments_requisition
        FOREIGN KEY (requisition_id)
        REFERENCES requisitions(requisition_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_payments_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(invoice_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_payments_user
        FOREIGN KEY (paid_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;Sign in to enable AI completions, or disable inline completions in Settings (DBCode > AI).

-- =========================
-- 7. PURCHASE ORDERS
-- =========================
CREATE TABLE purchase_orders (
    purchase_order_id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id INT NOT NULL,
    po_number VARCHAR(30) UNIQUE NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    order_date DATETIME NOT NULL,
    status ENUM('Pending','Approved','Delivered','Cancelled') DEFAULT 'Pending',
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (requisition_id) REFERENCES requisitions(requisition_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================
-- 8. PURCHASE ORDER ITEMS
-- =========================
CREATE TABLE purchase_order_items (
    po_item_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================
-- 9. INVOICES
-- =========================
CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    invoice_date DATETIME NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending','Verified','Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================
-- 10. INVOICE ITEMS
-- =========================
CREATE TABLE invoice_items (
    invoice_item_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================
-- 11. AUDIT TRAIL
-- =========================
CREATE TABLE audit_trail (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id INT NULL,
    record_reference VARCHAR(50) NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    ip_address VARCHAR(45) NOT NULL,
    device_info VARCHAR(255) NULL,
    status ENUM('Success','Failed') NOT NULL,
    action_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================
-- 12. NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    status ENUM('Unread','Read') DEFAULT 'Unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================
-- 13. SETTINGS
-- =========================
CREATE TABLE settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;




INSERT INTO departments (department_name) VALUES
('IT'),
('Finance'),
('HR'),
('Procurement'),
('Administration'),
('Operations'),
('Engineering'),
('Security'),
('QA'),
('QC'),
('Safety'),
('Warehouse'),
('Production'),
('Regulatory');




CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,

    supplier_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),

    email VARCHAR(150),
    phone VARCHAR(50),

    address TEXT,

    tin_number VARCHAR(100),
    registration_number VARCHAR(100),

    bank_name VARCHAR(100),
    account_number VARCHAR(100),

    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE quotation_requests (
    qrf_id INT AUTO_INCREMENT PRIMARY KEY,

    qrf_no VARCHAR(50) UNIQUE NOT NULL,

    requisition_id INT NOT NULL,

    requested_by INT NOT NULL,

    request_date DATE NOT NULL,

    deadline_date DATE,

    status ENUM(
        'PENDING',
        'SENT',
        'QUOTATIONS_RECEIVED',
        'COMPLETED',
        'CANCELLED'
    ) DEFAULT 'PENDING',

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (requisition_id)
        REFERENCES requisitions(requisition_id),

    FOREIGN KEY (requested_by)
        REFERENCES users(user_id)
);


CREATE TABLE quotation_request_suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    qrf_id INT NOT NULL,
    supplier_id INT NOT NULL,
    quotation_id INT NULL,

    sent_date DATE,

    supplier_response ENUM(
        'PENDING',
        'RESPONDED',
        'DECLINED'
    ) DEFAULT 'PENDING',

    FOREIGN KEY (qrf_id)
        REFERENCES quotation_requests(qrf_id),

    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id),

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(quotation_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);





CREATE TABLE grn (

    grn_id INT AUTO_INCREMENT PRIMARY KEY,

    grn_no VARCHAR(50) UNIQUE NOT NULL,

    po_id INT NOT NULL,

    supplier_id INT NOT NULL,

    received_by INT NOT NULL,

    received_date DATE NOT NULL,

    delivery_note_no VARCHAR(100),

    inspection_status ENUM(
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'PARTIAL'
    ) DEFAULT 'PENDING',

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (po_id)
        REFERENCES purchase_orders(purchase_order_id),

    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id),

    FOREIGN KEY (received_by)
        REFERENCES users(user_id)
);





CREATE TABLE grn_items (
    grn_item_id INT AUTO_INCREMENT PRIMARY KEY,

    grn_id INT NOT NULL,

    material_name VARCHAR(255),

    description TEXT,

    quantity_ordered DECIMAL(10,2),

    quantity_received DECIMAL(10,2),

    quantity_rejected DECIMAL(10,2),

    remarks TEXT,

    FOREIGN KEY (grn_id)
        REFERENCES grn(grn_id)
);






-- ==========================================
-- CREATE QUOTATION REQUEST ITEMS TABLE
-- ==========================================

CREATE TABLE quotation_request_items (

    quotation_request_item_id INT AUTO_INCREMENT PRIMARY KEY,

    qrf_id INT NOT NULL,

    material_name VARCHAR(255) NOT NULL,

    description TEXT,

    quantity INT NOT NULL DEFAULT 1,

    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    amount DECIMAL(12,2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (qrf_id)
        REFERENCES quotation_requests(qrf_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);



CREATE TABLE quotations (
    quotation_id INT AUTO_INCREMENT PRIMARY KEY,

    qrf_id INT NOT NULL,
    supplier_id INT NOT NULL,

    quotation_no VARCHAR(100),
    quotation_date DATE,

    total_amount DECIMAL(15,2),

    delivery_days INT,
    warranty VARCHAR(255),
    payment_terms VARCHAR(255),

    status ENUM('PENDING','SELECTED','REJECTED') DEFAULT 'PENDING',

    attachment VARCHAR(255),
    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (qrf_id)
        REFERENCES quotation_requests(qrf_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE TABLE quotation_records_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    item_name VARCHAR(255) NOT NULL,
    description TEXT,

    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    amount DECIMAL(12,2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(quotation_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);





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


CREATE TABLE approvals (
    approval_id INT AUTO_INCREMENT PRIMARY KEY,

    module_name ENUM('PRS', 'PO', 'GRN', 'INVOICE', 'PAYMENT', 'QRF') NOT NULL,
    document_id INT NOT NULL,

    hod_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    hod_user_id INT NULL,
    hod_approved_at DATETIME NULL,

    ceo_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    ceo_user_id INT NULL,
    ceo_approved_at DATETIME NULL,

    final_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',

    remarks TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_module_document (module_name, document_id),

    INDEX idx_module_document (module_name, document_id),
    INDEX idx_final_status (final_status),
    INDEX idx_hod_status (hod_status),
    INDEX idx_ceo_status (ceo_status),

    CONSTRAINT fk_hod_user
        FOREIGN KEY (hod_user_id) REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_ceo_user
        FOREIGN KEY (ceo_user_id) REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


CREATE TABLE budgets (

    budget_id INT AUTO_INCREMENT PRIMARY KEY,

    budget_no VARCHAR(30) UNIQUE NOT NULL,

    department_id INT NOT NULL,

    budget_item VARCHAR(150) NOT NULL,

    budget_type ENUM(
        'Monthly',
        'Quarterly',
        'Yearly'
    ) NOT NULL,

    budget_amount DECIMAL(18,2) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status ENUM(
        'Pending',
        'Approved',
        'Rejected',
        'Expired'
    ) DEFAULT 'Pending',

    created_by INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (department_id)
        REFERENCES departments(department_id),

    FOREIGN KEY (created_by)
        REFERENCES users(user_id)

);





ALTER TABLE payments 
MODIFY payment_date DATETIME DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE approvals
MODIFY module_name ENUM(
    'PRS',
    'PO',
    'GRN',
    'INVOICE',
    'PAYMENT',
    'QRF',
    'QUOTATION'
) NOT NULL;


INSERT INTO approvals (
    module_name,
    document_id
)
VALUES (
    'QUOTATION',
    15
);



CREATE TABLE company_budget (

    company_budget_id INT AUTO_INCREMENT PRIMARY KEY,

    budget_no VARCHAR(30) NOT NULL UNIQUE,

    department_id INT NOT NULL,

    financial_year YEAR NOT NULL,

    budget_type ENUM(
        'Monthly',
        'Quarterly',
        'Yearly'
    ) NOT NULL,

    allocated_amount DECIMAL(18,2) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    remarks TEXT,

    created_by INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_company_budget_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_company_budget_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


CREATE TABLE department_budget (

    department_budget_id INT AUTO_INCREMENT PRIMARY KEY,

    company_budget_id INT NOT NULL,

    budget_no VARCHAR(30) NOT NULL UNIQUE,

    department_id INT NOT NULL,

    budget_item VARCHAR(200) NOT NULL,

    quantity INT NOT NULL DEFAULT 1,

    unit_cost DECIMAL(18,2) NOT NULL,

    total_budget DECIMAL(18,2)
        GENERATED ALWAYS AS (quantity * unit_cost) STORED,

    budget_type ENUM(
        'Monthly',
        'Quarterly',
        'Yearly'
    ) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    remarks TEXT,

    ceo_status ENUM(
        'Pending',
        'Approved',
        'Rejected'
    ) DEFAULT 'Pending',

    ceo_user_id INT NULL,

    ceo_approval_date DATETIME NULL,

    created_by INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_department_budget_company
        FOREIGN KEY (company_budget_id)
        REFERENCES company_budget(company_budget_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_department_budget_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_department_budget_creator
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_department_budget_ceo
        FOREIGN KEY (ceo_user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);
