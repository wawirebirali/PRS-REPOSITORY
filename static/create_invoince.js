// =========================================================
// INVOICE MODULE
// =========================================================

let invoiceModuleInitialized = false;
let selectedInvoiceId = null;


// =========================================================
// INITIALIZE INVOICE MODULE
// =========================================================

function initializeInvoiceModule() {

    if (invoiceModuleInitialized) {
        return;
    }

    invoiceModuleInitialized = true;

    console.log("Initializing Invoice Module...");


    // =====================================================
    // SET DEFAULT DATE
    // =====================================================

    setInvoiceDate();


    // =====================================================
    // LOAD AVAILABLE GRNs
    // =====================================================

    loadInvoiceGRNs();


    // =====================================================
    // GRN SELECT CHANGE
    // =====================================================

    const grnSelect =
        document.getElementById("invoiceGrnId");


    if (grnSelect) {

        grnSelect.addEventListener(
            "change",
            function () {

                const grnId = this.value;

                console.log(
                    "Selected GRN:",
                    grnId
                );

                loadInvoiceGRNItems(grnId);
            }
        );

    } else {

        console.warn(
            "invoiceGrnId was not found during Invoice Module initialization."
        );
    }


    // =====================================================
    // INVOICE FORM SUBMIT
    // =====================================================

    const form =
        document.getElementById("invoiceForm");


    if (form) {

        form.addEventListener(
            "submit",
            submitInvoice
        );

    } else {

        console.warn(
            "invoiceForm was not found."
        );
    }


    console.log(
        "Invoice Module initialized."
    );
}


// =========================================================
// OPEN INVOICE FORM
// =========================================================

function openInvoiceForm() {

    console.log(
        "Opening Invoice Entry Form..."
    );


    const panel =
        document.getElementById(
            "invoiceFormPanel"
        );


    if (!panel) {

        console.error(
            "invoiceFormPanel was not found."
        );

        return;
    }


    // =====================================================
    // INITIALIZE MODULE
    // =====================================================

    initializeInvoiceModule();


    // =====================================================
    // SHOW FORM
    // =====================================================

    panel.style.display = "block";


    // =====================================================
    // GENERATE INVOICE NUMBER
    // =====================================================

    generateInvoiceNo();


    // =====================================================
    // SET DATE
    // =====================================================

    setInvoiceDate();


    // =====================================================
    // REFRESH GRNs
    // =====================================================

    loadInvoiceGRNs();


    console.log(
        "Invoice form opened."
    );
}


// =========================================================
// CLOSE INVOICE FORM
// =========================================================

function closeInvoiceForm() {

    const panel =
        document.getElementById(
            "invoiceFormPanel"
        );


    if (!panel) {
        return;
    }


    panel.style.display = "none";
}


// =========================================================
// CLEAR INVOICE FORM
// =========================================================

function clearInvoiceForm() {

    const form =
        document.getElementById(
            "invoiceForm"
        );


    if (form) {
        form.reset();
    }


    // =====================================================
    // RESET GRN
    // =====================================================

    const grnSelect =
        document.getElementById(
            "invoiceGrnId"
        );


    if (grnSelect) {
        grnSelect.value = "";
    }


    // =====================================================
    // RESET PO NUMBER
    // =====================================================

    const poNumber =
        document.getElementById(
            "invoicePoNumber"
        );


    if (poNumber) {
        poNumber.value = "";
    }


    // =====================================================
    // RESET SUPPLIER
    // =====================================================

    const supplierName =
        document.getElementById(
            "invoiceSupplierName"
        );


    if (supplierName) {
        supplierName.value = "";
    }


    // =====================================================
    // CLEAR ITEMS
    // =====================================================

    const body =
        document.getElementById(
            "invoiceItemsBody"
        );


    if (body) {
        body.innerHTML = "";
    }


    // =====================================================
    // RESET TOTAL
    // =====================================================

    const total =
        document.getElementById(
            "invoiceTotal"
        );


    if (total) {
        total.textContent = "0.00";
    }


    // =====================================================
    // GENERATE NEW INVOICE NUMBER
    // =====================================================

    generateInvoiceNo();


    // =====================================================
    // RESET DATE
    // =====================================================

    setInvoiceDate();
}


// =========================================================
// LOAD AVAILABLE GRNs
//
// GET:
// /finance/api/invoices/grns
// =========================================================

async function loadInvoiceGRNs() {

    const grnSelect =
        document.getElementById(
            "invoiceGrnId"
        );


    if (!grnSelect) {

        console.error(
            "invoiceGrnId not found."
        );

        return;
    }


    // =====================================================
    // LOADING STATE
    // =====================================================

    grnSelect.innerHTML = `
        <option value="">
            Loading GRNs...
        </option>
    `;


    grnSelect.disabled = true;


    try {

        console.log(
            "Loading available GRNs for Invoice..."
        );


        const response =
            await fetch(
                "/finance/api/invoices/grns",
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "GRN list API returned HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "INVOICE GRN LIST RESPONSE:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load GRNs."
            );
        }


        const grns =
            Array.isArray(data.grns)
                ? data.grns
                : [];


        // =================================================
        // RESET DROPDOWN
        // =================================================

        grnSelect.innerHTML = `
            <option value="">
                -- Select GRN --
            </option>
        `;


        // =================================================
        // NO GRNs
        // =================================================

        if (!grns.length) {

            grnSelect.innerHTML += `
                <option value="" disabled>
                    No available GRNs
                </option>
            `;

            return;
        }


        // =================================================
        // ADD GRNs
        // =================================================

        grns.forEach(
            function (grn) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    grn.grn_id;


                option.textContent =
                    grn.grn_no;


                option.dataset.poNumber =
                    grn.po_number || "";


                option.dataset.supplierName =
                    grn.supplier_name || "";


                grnSelect.appendChild(
                    option
                );
            }
        );


        console.log(
            "Loaded " +
            grns.length +
            " GRNs into Invoice dropdown."
        );

    }
    catch (error) {

        console.error(
            "LOAD INVOICE GRNs ERROR:",
            error
        );


        grnSelect.innerHTML = `
            <option value="">
                Failed to load GRNs
            </option>
        `;

    }
    finally {

        grnSelect.disabled = false;
    }
}


// =========================================================
// GENERATE INVOICE NUMBER
//
// CURRENT ENDPOINT:
// /procurement/api/invoices/next-number
//
// IMPORTANT:
// Your console currently shows HTTP 404 here.
// That means this Flask route does not currently exist.
// =========================================================
// =========================================================
// GENERATE INVOICE NUMBER
//
// GET:
// /finance/api/invoices/next-number
// =========================================================

async function generateInvoiceNo() {

    const invoiceNo =
        document.getElementById("invoice_no");

    if (!invoiceNo) {
        console.error("invoice_no input not found.");
        return false;
    }

    invoiceNo.value = "Generating...";

    try {

        console.log(
            "Generating invoice number..."
        );

        const response =
            await fetch(
                "/finance/api/invoices/next-number",
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

        console.log(
            "Invoice number HTTP status:",
            response.status
        );

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Invoice number API response:",
                errorText
            );

            throw new Error(
                "Invoice number API returned HTTP " +
                response.status
            );
        }

        const data =
            await response.json();

        console.log(
            "INVOICE NUMBER RESPONSE:",
            data
        );

        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to generate invoice number."
            );
        }

        if (!data.invoice_no) {

            throw new Error(
                "Invoice number was not returned by the server."
            );
        }

        invoiceNo.value =
            data.invoice_no;

        console.log(
            "Generated Invoice Number:",
            data.invoice_no
        );

        return true;

    }
    catch (error) {

        console.error(
            "Invoice number error:",
            error
        );

        invoiceNo.value = "";

        alert(
            "Unable to generate invoice number.\n\n" +
            error.message
        );

        return false;
    }
}

// =========================================================
// SET INVOICE DATE
// =========================================================

function setInvoiceDate() {

    const invoiceDate =
        document.getElementById(
            "invoice_date"
        );


    if (!invoiceDate) {
        return;
    }


    const today =
        new Date();


    invoiceDate.value =
        today
            .toISOString()
            .split("T")[0];
}


// =========================================================
// ADD BLANK ROW
// =========================================================

function addBlankInvoiceRow() {

    const body =
        document.getElementById(
            "invoiceItemsBody"
        );


    if (!body) {
        return;
    }


    if (body.children.length === 0) {

        body.innerHTML =
            createInvoiceRow();
    }
}


// =========================================================
// LOAD GRN DETAILS FOR INVOICE
//
// GET:
// /finance/api/invoices/grn/<grn_id>
// =========================================================

async function loadInvoiceGRNItems(grnId) {

    const body =
        document.getElementById(
            "invoiceItemsBody"
        );


    const poNumber =
        document.getElementById(
            "invoicePoNumber"
        );


    const supplierName =
        document.getElementById(
            "invoiceSupplierName"
        );


    if (!body) {

        console.error(
            "invoiceItemsBody not found."
        );

        return;
    }


    // =====================================================
    // NO GRN SELECTED
    // =====================================================

    if (!grnId) {

        if (poNumber) {
            poNumber.value = "";
        }


        if (supplierName) {
            supplierName.value = "";
        }


        body.innerHTML = "";


        calculateInvoiceTotal();


        return;
    }


    // =====================================================
    // LOADING STATE
    // =====================================================

    if (poNumber) {

        poNumber.value =
            "Loading...";
    }


    if (supplierName) {

        supplierName.value =
            "Loading...";
    }


    body.innerHTML = `

        <tr>

            <td
                colspan="5"
                style="
                    text-align:center;
                    padding:20px;
                "
            >

                Loading GRN details...

            </td>

        </tr>

    `;


    try {

        console.log(
            "Loading GRN details:",
            grnId
        );


        // =================================================
        // FINANCE GRN API
        // =================================================

        const response =
            await fetch(
                `/finance/api/invoices/grn/${encodeURIComponent(grnId)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        console.log(
            "GRN details HTTP status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "GRN API returned HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "INVOICE GRN API RESPONSE:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load GRN details."
            );
        }


        // =================================================
        // GRN HEADER
        // =================================================

        const grn =
            data.grn || {};


        // =================================================
        // PO NUMBER
        // =================================================

        if (poNumber) {

            poNumber.value =
                grn.po_number || "";
        }


        // =================================================
        // SUPPLIER
        // =================================================

        if (supplierName) {

            supplierName.value =
                grn.supplier_name || "";
        }


        // =================================================
        // GRN ITEMS
        // =================================================

        const items =
            Array.isArray(data.items)
                ? data.items
                : [];


        body.innerHTML = "";


        // =================================================
        // NO ITEMS
        // =================================================

        if (!items.length) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="
                            text-align:center;
                            color:#777;
                            padding:20px;
                        "
                    >

                        No items found for this GRN.

                    </td>

                </tr>

            `;


            calculateInvoiceTotal();


            return;
        }


        // =================================================
        // CREATE ITEM ROWS
        // =================================================

        items.forEach(
            function (item) {

                body.insertAdjacentHTML(
                    "beforeend",
                    createInvoiceRow(item)
                );
            }
        );


        // =================================================
        // CALCULATE TOTAL
        // =================================================

        calculateInvoiceTotal();


        console.log(
            "PO:",
            grn.po_number
        );


        console.log(
            "Supplier:",
            grn.supplier_name
        );


        console.log(
            "Invoice Items:",
            items
        );

    }
    catch (error) {

        console.error(
            "Invoice GRN loading error:",
            error
        );


        if (poNumber) {
            poNumber.value = "";
        }


        if (supplierName) {
            supplierName.value = "";
        }


        body.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        color:red;
                        padding:20px;
                    "
                >

                    Failed to load GRN details.

                </td>

            </tr>

        `;
    }
}


// =========================================================
// CREATE INVOICE ROW
//
// IMPORTANT:
// There is ONLY ONE createInvoiceRow() now.
// =========================================================

function createInvoiceRow(item = {}) {

    const materialName =
        item.item_name ||
        item.material_name ||
        "";


    const description =
        item.description ||
        "";


    const quantity =
        Number(
            item.quantity ??
            item.quantity_received ??
            0
        );


    // =====================================================
    // UNIT PRICE
    // =====================================================

    const unitPrice =
        Number(
            item.unit_price ?? 0
        );


    // =====================================================
    // AMOUNT
    // =====================================================

    const amount =
        Number(
            item.amount ??
            (quantity * unitPrice)
        );


    return `

        <tr>

            <!-- =========================================
                 ITEM
            ========================================== -->

            <td>

                ${escapeInvoiceHtml(
                    materialName
                )}

                <input
                    type="hidden"
                    name="item_id[]"
                    value="${escapeInvoiceHtml(
                        item.item_id || ""
                    )}"
                >

                <input
                    type="hidden"
                    name="grn_item_id[]"
                    value="${escapeInvoiceHtml(
                        item.grn_item_id || ""
                    )}"
                >

                <input
                    type="hidden"
                    name="item_name[]"
                    value="${escapeInvoiceHtml(
                        materialName
                    )}"
                >

            </td>


            <!-- =========================================
                 DESCRIPTION
            ========================================== -->

            <td>

                ${escapeInvoiceHtml(
                    description
                )}

                <input
                    type="hidden"
                    name="description[]"
                    value="${escapeInvoiceHtml(
                        description
                    )}"
                >

            </td>


            <!-- =========================================
                 QUANTITY
            ========================================== -->

            <td class="invoice-qty">

                ${quantity.toFixed(2)}

                <input
                    type="hidden"
                    name="quantity[]"
                    value="${quantity}"
                >

            </td>


            <!-- =========================================
                 UNIT PRICE
            ========================================== -->

            <td>

                <input
                    type="number"
                    name="unit_price[]"
                    class="invoice-price"
                    value="${
                        unitPrice > 0
                            ? unitPrice.toFixed(2)
                            : ""
                    }"
                    placeholder="Enter unit price"
                    step="0.01"
                    min="0"
                    required
                    oninput="calculateInvoiceRow(this)"
                >

            </td>


            <!-- =========================================
                 AMOUNT
            ========================================== -->

            <td>

                <input
                    type="number"
                    name="amount[]"
                    class="invoice-amount"
                    value="${amount.toFixed(2)}"
                    step="0.01"
                    min="0"
                    readonly
                >

            </td>

        </tr>

    `;
}


// =========================================================
// CALCULATE SINGLE INVOICE ROW
//
// Called when user enters/changing unit price.
// =========================================================
// =========================================================
// CREATE INVOICE ROW
// =========================================================
// =========================================================
// CALCULATE SINGLE INVOICE ROW
// =========================================================

function calculateInvoiceRow(input) {

    const row =
        input.closest("tr");

    if (!row) {
        return;
    }

    const quantityInput =
        row.querySelector(
            'input[name="quantity[]"]'
        );

    const priceInput =
        row.querySelector(
            'input[name="unit_price[]"]'
        );

    const amountInput =
        row.querySelector(
            'input[name="amount[]"]'
        );

    const quantity =
        parseFloat(
            quantityInput?.value
        ) || 0;

    const unitPrice =
        parseFloat(
            priceInput?.value
        ) || 0;

    const amount =
        quantity * unitPrice;

    if (amountInput) {

        amountInput.value =
            amount.toFixed(2);
    }

    calculateInvoiceTotal();
}


// =========================================================
// BACKWARD COMPATIBILITY
// =========================================================

function updateInvoiceRowAmount(input) {

    calculateInvoiceRow(input);

}





function updateInvoiceRowAmount(input) {

    return calculateInvoiceRow(input);
}




// =========================================================
// CALCULATE INVOICE TOTAL
//
// This was missing from your original code and caused:
//
// ReferenceError:
// calculateInvoiceTotal is not defined
// =========================================================
// =========================================================
// CALCULATE INVOICE TOTAL
// =========================================================

// =========================================================
// CALCULATE INVOICE TOTAL
// =========================================================

function calculateInvoiceTotal() {

    const rows = document.querySelectorAll(
        "#invoiceItemsBody tr"
    );

    let total = 0;

    rows.forEach(function (row) {

        const quantityInput =
            row.querySelector(
                'input[name="quantity[]"]'
            );

        const priceInput =
            row.querySelector(
                'input[name="unit_price[]"]'
            );

        const amountInput =
            row.querySelector(
                'input[name="amount[]"]'
            );

        if (!quantityInput || !priceInput) {
            return;
        }

        const quantity =
            parseFloat(quantityInput.value) || 0;

        const unitPrice =
            parseFloat(priceInput.value) || 0;

        const amount =
            quantity * unitPrice;

        // Update amount field
        if (amountInput) {
            amountInput.value =
                amount.toFixed(2);
        }

        total += amount;
    });

    // =====================================================
    // UPDATE TOTAL DISPLAY
    // =====================================================

    const totalElement =
        document.getElementById(
            "invoiceTotal"
        );

    if (totalElement) {

        totalElement.textContent =
            total.toLocaleString(
                "en-UG",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );
    }

    console.log(
        "CALCULATED INVOICE TOTAL:",
        total
    );

    return total;
}
// =========================================================
// SUBMIT / SAVE INVOICE
//
// POST:
// /procurement/save_invoice
// =========================================================

async function submitInvoice(event) {

    event.preventDefault();

    const form =
        document.getElementById(
            "invoiceForm"
        );

    if (!form) {

        console.error(
            "invoiceForm not found."
        );

        return;
    }


    // =====================================================
    // GET FORM VALUES
    // =====================================================

    const grnId =
        document.getElementById(
            "invoiceGrnId"
        )?.value?.trim();

    const invoiceNo =
        document.getElementById(
            "invoice_no"
        )?.value?.trim();

    const invoiceDate =
        document.getElementById(
            "invoice_date"
        )?.value;

    const createdBy =
        document.getElementById(
            "invoiceCreatedBy"
        )?.value;


    // =====================================================
    // VALIDATE GRN
    // =====================================================

    if (!grnId) {

        alert(
            "Please select a GRN."
        );

        return;
    }


    // =====================================================
    // VALIDATE INVOICE NUMBER
    // =====================================================

    if (
        !invoiceNo ||
        invoiceNo === "Generating..."
    ) {

        alert(
            "Invoice number has not been generated."
        );

        return;
    }


    // =====================================================
    // VALIDATE DATE
    // =====================================================

    if (!invoiceDate) {

        alert(
            "Invoice date is required."
        );

        return;
    }


    // =====================================================
    // VALIDATE CREATED BY
    // =====================================================

    if (!createdBy) {

        alert(
            "Created by user is missing."
        );

        return;
    }


    // =====================================================
    // GET ITEM ROWS
    // =====================================================

    const itemRows =
        document.querySelectorAll(
            "#invoiceItemsBody tr"
        );


    if (!itemRows.length) {

        alert(
            "Please select a GRN with at least one item."
        );

        return;
    }


    // =====================================================
    // RECALCULATE EVERYTHING BEFORE SAVE
    // =====================================================

    const total =
        calculateInvoiceTotal();


    console.log(
        "FINAL INVOICE TOTAL:",
        total
    );


    // =====================================================
    // VALIDATE TOTAL
    // =====================================================

    if (
        !Number.isFinite(total) ||
        total <= 0
    ) {

        alert(
            "Invoice total must be greater than zero.\n\n" +
            "Please enter a unit price for the invoice item."
        );

        return;
    }


    // =====================================================
    // PREVENT DOUBLE SUBMIT
    // =====================================================

    const saveButton =
        form.querySelector(
            ".invoice-save-btn"
        );

    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "Saving...";
    }


    try {

        // =================================================
        // BUILD FORM DATA
        // =================================================

        const formData =
            new FormData(form);


        // =================================================
        // DEBUG FORM DATA
        // =================================================

        console.log(
            "========== INVOICE FORM DATA =========="
        );

        for (
            const [key, value]
            of formData.entries()
        ) {

            console.log(
                key + ":",
                value
            );
        }

        console.log(
            "======================================="
        );


        // =================================================
        // SAVE INVOICE
        // =================================================

        const response =
            await fetch(
                "/finance/save_invoice",
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        // =================================================
        // READ RESPONSE AS TEXT FIRST
        // =================================================

        const responseText =
            await response.text();


        console.log(
            "SAVE INVOICE HTTP STATUS:",
            response.status
        );

        console.log(
            "SAVE INVOICE RAW RESPONSE:",
            responseText
        );


        // =================================================
        // PARSE JSON
        // =================================================

        let data;

        try {

            data =
                JSON.parse(
                    responseText
                );

        }
        catch (jsonError) {

            throw new Error(
                "Server returned an invalid response. HTTP " +
                response.status
            );
        }


        console.log(
            "SAVE INVOICE RESPONSE:",
            data
        );


        // =================================================
        // CHECK SERVER RESPONSE
        // =================================================

        if (
            !response.ok ||
            data.success !== true
        ) {

            throw new Error(
                data.message ||
                "Failed to save invoice."
            );
        }


        // =================================================
        // SUCCESS
        // =================================================

        alert(
            "Invoice " +
            (
                data.invoice_no ||
                invoiceNo
            ) +
            " created successfully."
        );


        // =================================================
        // CLOSE FORM
        // =================================================

        closeInvoiceForm();


        // =================================================
        // CLEAR FORM
        // =================================================

        clearInvoiceForm();


        // =================================================
        // RELOAD INVOICE TABLE
        // =================================================

        await loadInvoices();

    }
    catch (error) {

        console.error(
            "SAVE INVOICE ERROR:",
            error
        );

        alert(
            error.message ||
            "Failed to save invoice."
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "💾 Save Invoice";
        }
    }
}



// =========================================================
// LOAD ALL INVOICES
//
// GET:
// /finance/api/invoices
// =========================================================

async function loadInvoices() {

    const body =
        document.getElementById(
            "invoiceBody"
        );


    if (!body) {

        console.warn(
            "invoiceBody not found."
        );

        return;
    }


    // =====================================================
    // LOADING
    // =====================================================

    body.innerHTML = `

        <tr>

            <td
                colspan="8"
                style="
                    text-align:center;
                    padding:20px;
                "
            >

                Loading invoices...

            </td>

        </tr>

    `;


    try {

        console.log(
            "Loading invoices..."
        );


        // =================================================
        // API REQUEST
        // =================================================

        const response =
            await fetch(
                "/finance/api/invoices",
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        console.log(
            "Invoice API HTTP status:",
            response.status
        );


        // =================================================
        // READ RESPONSE
        // =================================================

        const responseText =
            await response.text();


        console.log(
            "RAW INVOICE LIST RESPONSE:",
            responseText
        );


        if (!response.ok) {

            throw new Error(
                "Invoice API returned HTTP " +
                response.status
            );
        }


        // =================================================
        // PARSE JSON
        // =================================================

        let data;


        try {

            data =
                JSON.parse(
                    responseText
                );

        }
        catch (jsonError) {

            console.error(
                "Invoice JSON parse error:",
                jsonError
            );

            throw new Error(
                "Invoice API returned invalid JSON."
            );
        }


        console.log(
            "INVOICE LIST RESPONSE:",
            data
        );


        // =================================================
        // API SUCCESS CHECK
        // =================================================

        if (
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Failed to load invoices."
            );
        }


        // =================================================
        // GET INVOICES
        // =================================================

        const invoices =
            Array.isArray(
                data.invoices
            )
                ? data.invoices
                : [];


        body.innerHTML = "";


        // =================================================
        // NO INVOICES
        // =================================================

        if (!invoices.length) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        style="
                            text-align:center;
                            padding:20px;
                        "
                    >

                        No invoices found.

                    </td>

                </tr>

            `;

            return;
        }


        // =================================================
        // BUILD TABLE
        // =================================================

        invoices.forEach(
            function (invoice) {

                const row =
                    document.createElement(
                        "tr"
                    );


                // =================================================
                // INVOICE ID
                // =================================================

                row.setAttribute(
                    "data-id",
                    invoice.invoice_id
                );


                // =================================================
                // SUPPORT BOTH:
                //
                // invoice_no
                // invoice_number
                // =================================================

                const invoiceNumber =
                    invoice.invoice_no ||
                    invoice.invoice_number ||
                    "-";


                // =================================================
                // SUPPORT BOTH:
                //
                // status
                // invoice_status
                // =================================================

                const invoiceStatus =
                    invoice.invoice_status ||
                    invoice.status ||
                    "-";


                // =================================================
                // TABLE ROW
                // =================================================

                row.innerHTML = `

                    <td>

                        <button
                            type="button"
                            onclick="
                                selectInvoice(
                                    ${invoice.invoice_id}
                                )
                            "
                        >

                            Select

                        </button>

                    </td>


                    <td>

                        ${escapeInvoiceHtml(
                            invoice.prs_no ||
                            "-"
                        )}

                    </td>


                    <td>

                        ${escapeInvoiceHtml(
                            invoiceNumber
                        )}

                    </td>


                    <td>

                        ${escapeInvoiceHtml(
                            invoice.grn_no ||
                            "-"
                        )}

                    </td>


                    <td>

                        ${escapeInvoiceHtml(
                            invoice.supplier_name ||
                            "-"
                        )}

                    </td>


                    <td>

                        ${escapeInvoiceHtml(
                            invoice.department_name ||
                            "-"
                        )}

                    </td>


                    <td>

                        ${escapeInvoiceHtml(
                            invoiceStatus
                        )}

                    </td>


                    <td>

                        ${formatInvoiceDate(
                            invoice.invoice_date
                        )}

                    </td>

                `;


                // =================================================
                // ROW CLICK
                // =================================================

                row.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target.tagName ===
                            "BUTTON"
                        ) {

                            return;
                        }


                        selectInvoice(
                            invoice.invoice_id
                        );

                    }
                );


                body.appendChild(
                    row
                );

            }
        );


        console.log(
            "Loaded " +
            invoices.length +
            " invoices."
        );

    }
    catch (error) {

        console.error(
            "LOAD INVOICES ERROR:",
            error
        );


        body.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="
                        text-align:center;
                        color:red;
                        padding:20px;
                    "
                >

                    Failed to load invoices.

                </td>

            </tr>

        `;

    }
}



async function loadInvoices() {

    const body =
        document.getElementById(
            "invoiceBody"
        );


    if (!body) {
        return;
    }


    body.innerHTML = `

        <tr>

            <td
                colspan="8"
                style="
                    text-align:center;
                    padding:20px;
                "
            >

                Loading invoices...

            </td>

        </tr>

    `;


    try {

        const response =
            await fetch(
                "/finance/api/invoices",
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Invoice API returned HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "INVOICE LIST RESPONSE:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load invoices."
            );
        }


        const invoices =
            Array.isArray(data.invoices)
                ? data.invoices
                : [];


        body.innerHTML = "";


        if (!invoices.length) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        style="
                            text-align:center;
                            padding:20px;
                        "
                    >

                        No invoices found.

                    </td>

                </tr>

            `;

            return;
        }


        invoices.forEach(
            function (invoice) {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.setAttribute(
                    "data-id",
                    invoice.invoice_id
                );


                row.innerHTML = `

                    <td>

                        <button
                            type="button"
                            onclick="
                                selectInvoice(
                                    ${invoice.invoice_id}
                                )
                            "
                        >

                            Select

                        </button>

                    </td>


                    <td>
                        ${escapeInvoiceHtml(
                            invoice.prs_no || "-"
                        )}
                    </td>


                    <td>
                        ${escapeInvoiceHtml(
                            invoice.invoice_no || "-"
                        )}
                    </td>


                    <td>
                        ${escapeInvoiceHtml(
                            invoice.grn_no || "-"
                        )}
                    </td>


                    <td>
                        ${escapeInvoiceHtml(
                            invoice.supplier_name || "-"
                        )}
                    </td>


                    <td>
                        ${escapeInvoiceHtml(
                            invoice.department_name || "-"
                        )}
                    </td>


                    <td>
                        ${escapeInvoiceHtml(
                            invoice.invoice_status || "-"
                        )}
                    </td>


                    <td>
                        ${formatInvoiceDate(
                            invoice.invoice_date
                        )}
                    </td>

                `;


                row.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target.tagName ===
                            "BUTTON"
                        ) {
                            return;
                        }


                        selectInvoice(
                            invoice.invoice_id
                        );
                    }
                );


                body.appendChild(
                    row
                );
            }
        );

    }
    catch (error) {

        console.error(
            "LOAD INVOICES ERROR:",
            error
        );


        body.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="
                        text-align:center;
                        color:red;
                        padding:20px;
                    "
                >

                    Failed to load invoices.

                </td>

            </tr>

        `;
    }
}


// =========================================================
// SELECT INVOICE
// =========================================================

async function selectInvoice(invoiceId) {

    if (!invoiceId) {
        return;
    }


    selectedInvoiceId =
        invoiceId;


    // =====================================================
    // REMOVE PREVIOUS SELECTION
    // =====================================================

    document
        .querySelectorAll(
            "#invoiceBody tr"
        )
        .forEach(
            function (row) {

                row.classList.remove(
                    "selected"
                );
            }
        );


    // =====================================================
    // SELECT CURRENT ROW
    // =====================================================

    const selectedRow =
        document.querySelector(
            `#invoiceBody tr[data-id="${invoiceId}"]`
        );


    if (selectedRow) {

        selectedRow.classList.add(
            "selected"
        );
    }


    // =====================================================
    // LOAD DETAILS
    // =====================================================

    await loadInvoiceDetails(
        invoiceId
    );
}


// =========================================================
// LOAD SINGLE INVOICE DETAILS
//
// GET:
// /finance/api/invoices/<invoice_id>
// =========================================================

async function loadInvoiceDetails(invoiceId) {

    try {

        const response =
            await fetch(
                `/finance/api/invoices/${encodeURIComponent(invoiceId)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Invoice details API returned HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "INVOICE DETAILS:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load invoice details."
            );
        }


        const invoice =
            data.invoice || {};


        const items =
            Array.isArray(data.items)
                ? data.items
                : [];


        // =================================================
        // HEADER
        // =================================================

        setText(
            "i_invoice",
            invoice.invoice_no || "-"
        );


        setText(
            "i_grn",
            invoice.grn_no || "-"
        );


        setText(
            "i_supplier",
            invoice.supplier_name || "-"
        );


        setText(
            "i_amount",
            Number(
                invoice.total_amount || 0
            ).toLocaleString(
                "en-UG",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )
        );


        setText(
            "i_date",
            formatInvoiceDate(
                invoice.invoice_date
            )
        );


        // =================================================
        // ITEMS
        // =================================================

        const previewBody =
            document.getElementById(
                "invoicePreviewItemsBody"
            );


        if (previewBody) {

            previewBody.innerHTML = "";


            items.forEach(
                function (item) {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${escapeInvoiceHtml(
                                item.item_name || "-"
                            )}
                        </td>


                        <td>
                            ${Number(
                                item.quantity || 0
                            ).toFixed(2)}
                        </td>


                        <td>
                            ${Number(
                                item.unit_price || 0
                            ).toLocaleString(
                                "en-UG",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )}
                        </td>


                        <td>
                            ${Number(
                                item.amount || 0
                            ).toLocaleString(
                                "en-UG",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )}
                        </td>

                    `;


                    previewBody.appendChild(
                        row
                    );
                }
            );
        }


        // =================================================
        // SIGNATURES
        // =================================================

        const signatures =
            data.signatures || {};

        const approval = data.approval || {};
        const setSignature = (id, path) => {
            const image = document.getElementById(id);
            if (!image) return;
            if (!path) {
                image.removeAttribute("src");
                image.style.display = "none";
                return;
            }
            image.src = path.startsWith("/")
                ? path
                : `/static/${path.replace(/^static\//, "")}`;
            image.style.display = "block";
        };

        setText("invoice_prepared_name", signatures.prepared_name);
        setText("invoice_prepared_date", formatInvoiceDate(invoice.invoice_date));
        setSignature("invoice_prepared_signature", signatures.prepared_signature);

        setText("invoice_hod_name", signatures.hod);
        setText("invoice_hod_status", approval.hod_status || "PENDING");
        setText("invoice_hod_date", formatInvoiceDate(approval.hod_approved_at));
        setSignature("invoice_hod_signature", signatures.hod_signature);

        setText("invoice_ceo_name", signatures.ceo);
        setText("invoice_ceo_status", approval.ceo_status || "PENDING");
        setText("invoice_ceo_date", formatInvoiceDate(approval.ceo_approved_at));
        setSignature("invoice_ceo_signature", signatures.ceo_signature);

    }
    catch (error) {

        console.error(
            "LOAD INVOICE DETAILS ERROR:",
            error
        );


        alert(
            error.message ||
            "Failed to load invoice details."
        );
    }
}


// =========================================================
// HELPER: SET TEXT
// =========================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "-";
    }
}


// =========================================================
// FORMAT DATE
// =========================================================

function formatInvoiceDate(value) {

    if (!value) {
        return "-";
    }


    try {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;
        }


        return date.toLocaleDateString(
            "en-GB"
        );

    }
    catch (error) {

        return value;
    }
}


// =========================================================
// SEARCH INVOICE
// =========================================================

function searchInvoice() {

    const input =
        document.getElementById(
            "invoiceSearch"
        );


    const table =
        document.getElementById(
            "invoiceTable"
        );


    if (
        !input ||
        !table
    ) {

        return;
    }


    const search =
        input.value
            .toLowerCase()
            .trim();


    const rows =
        table.querySelectorAll(
            "tbody tr"
        );


    rows.forEach(
        function (row) {

            const text =
                row.textContent
                    .toLowerCase();


            row.style.display =
                text.includes(search)
                    ? ""
                    : "none";
        }
    );
}


// =========================================================
// PRINT INVOICE
// =========================================================

function printInvoice() {

    const printArea =
        document.getElementById(
            "invoicePrintArea"
        );


    if (!printArea) {

        console.error(
            "Invoice print area not found."
        );

        return;
    }


    if (!selectedInvoiceId) {

        alert(
            "Please select an invoice first."
        );

        return;
    }


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the invoice."
        );

        return;
    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Purchase Invoice
            </title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th,
                td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: center;
                }

                th {
                    background: #2c7a7b;
                    color: white;
                }

                h2,
                h3 {
                    text-align: center;
                }

            </style>

        </head>

        <body>

            ${printArea.innerHTML}

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        function () {

            printWindow.print();

            printWindow.close();

        },
        500
    );
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeInvoiceHtml(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}


// =========================================================
// OPTIONAL COMPATIBILITY FUNCTION
//
// If any old HTML still calls:
// updateInvoiceRowAmount(this)
//
// it will now work.
// =========================================================

function updateInvoiceRowAmount(input) {

    calculateInvoiceRow(input);
}


// =========================================================
// OPTIONAL COMPATIBILITY FUNCTION
//
// If any old HTML still calls:
// calculateInvoiceRow(this)
//
// it will work.
// =========================================================


// =========================================================
// AUTO INITIALIZE WHEN DOM IS READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * Do not force initialization if the invoice
         * form/table is not on this page.
         */

        const invoiceForm =
            document.getElementById(
                "invoiceForm"
            );


        const invoicePanel =
            document.getElementById(
                "invoiceFormPanel"
            );


        if (
            invoiceForm ||
            invoicePanel
        ) {

            console.log(
                "Invoice page detected."
            );

            initializeInvoiceModule();
        }
    }
);