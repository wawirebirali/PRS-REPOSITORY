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