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
    requisition_id INT NOT NULL,
    paid_by INT NOT NULL,
    payment_method ENUM('Cash','Bank Transfer','Mobile Money','Cheque') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UGX',
    payment_status ENUM('Pending','Completed','Failed','Cancelled') DEFAULT 'Pending',
    transaction_reference VARCHAR(100) NULL,
    payment_date TIMESTAMP NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (requisition_id) REFERENCES requisitions(requisition_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (paid_by) REFERENCES users(user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;


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



-- =========================
-- 5. APPROVALS
-- =========================
CREATE TABLE approvals (
    approval_id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id INT NOT NULL,
    approver_id INT NOT NULL,
    role ENUM('HOD','CEO','Finance','Procurement') NOT NULL,
    action ENUM('Approved','Rejected') NULL,
    remarks TEXT NULL,
    hod_approval_date TIMESTAMP NULL,
    ceo_approval_date TIMESTAMP NULL,
    finance_approval_date TIMESTAMP NULL,
    procurement_approval_date TIMESTAMP NULL,
    hod_status ENUM('Pending','Approved') DEFAULT 'Pending',
    ceo_status ENUM('Pending','Approved') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (requisition_id) REFERENCES requisitions(requisition_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (approver_id) REFERENCES users(user_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
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

CREATE TABLE approval_stages (
    stage_id INT AUTO_INCREMENT PRIMARY KEY,

    requisition_id INT NOT NULL,
    stage ENUM('HOD','CEO','FINANCE','PROCUREMENT') NOT NULL,

    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',

    approver_id INT NULL,

    approval_date TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (requisition_id) REFERENCES requisitions(requisition_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (approver_id) REFERENCES users(user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);


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

    sent_date DATE,

    supplier_response ENUM(
        'PENDING',
        'RESPONDED',
        'DECLINED'
    ) DEFAULT 'PENDING',

    FOREIGN KEY (qrf_id)
        REFERENCES quotation_requests(qrf_id),

    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
);


CREATE TABLE quotations (
    quotation_id INT AUTO_INCREMENT PRIMARY KEY,

    qrf_id INT NOT NULL,

    supplier_id INT NOT NULL,

    quotation_no VARCHAR(100),

    quotation_date DATE,

    total_amount DECIMAL(15,2),

    delivery_days INT,

    payment_terms VARCHAR(255),

    warranty VARCHAR(255),

    status ENUM(
        'PENDING',
        'SELECTED',
        'REJECTED'
    ) DEFAULT 'PENDING',

    attachment VARCHAR(255),

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (qrf_id)
        REFERENCES quotation_requests(qrf_id),

    FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
);





CREATE TABLE quotation_items (
    quotation_item_id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    material_name VARCHAR(255) NOT NULL,

    quantity DECIMAL(10,2),

    description TEXT,
    brand VARCHAR(100),

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(quotation_id)
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


CREATE TABLE quotation_record_items (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    qrf_id INT NOT NULL,

    item_name VARCHAR(255) NOT NULL,
    description TEXT,

    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (qrf_id) REFERENCES quotation_requests(qrf_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);