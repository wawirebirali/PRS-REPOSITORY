// ============================================================
// CREATE PURCHASE ORDER FROM SELECTED QUOTATION
// PROCUREMENT DASHBOARD
// ============================================================


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentPOPRS = null;

let currentPOQuotation = null;

let currentPOQuotationData = null;


// ============================================================
// SHOW MESSAGE
// ============================================================

function showPOMsg(message, type = "success") {

    // Try existing message element
    let msg = document.getElementById("msg");

    // If no message element exists, create one
    if (!msg) {

        msg = document.createElement("div");

        msg.id = "msg";

        document.body.appendChild(msg);

    }


    msg.className = type;

    msg.innerText = message;

    msg.style.display = "block";


    setTimeout(() => {

        msg.style.display = "none";

    }, 4000);

}


// ============================================================
// SHOW CREATE PO FROM QUOTATION BOX
// ============================================================
// ============================================================
// SHOW CREATE PO FROM QUOTATION BOX
// ============================================================

function showPOQuotationBox() {

    const box =
        document.getElementById(
            "poQuotationBox"
        );


    if (!box) {

        console.error(
            "poQuotationBox element not found."
        );

        return;

    }


    // Show PO form
    box.style.display =
        "block";


    // Hide quotation entry form
    const quotationEntryForm =
        document.getElementById(
            "quotationEntryForm"
        );


    if (quotationEntryForm) {

        quotationEntryForm.style.display =
            "none";

    }


    // Reset form
    resetPOQuotationForm();


    // Set current date
    setCurrentPODate();


    // Load next PO number
    loadNextPONumber();

}

// ============================================================
// HIDE CREATE PO FROM QUOTATION BOX
// ============================================================

function hidePOQuotationBox() {

    const box =
        document.getElementById(
            "poQuotationBox"
        );


    if (box) {

        box.style.display =
            "none";

    }


    resetPOQuotationForm();

}


// ============================================================
// RESET PO QUOTATION FORM
// ============================================================

function resetPOQuotationForm() {

    // Reset global variables

    currentPOPRS = null;

    currentPOQuotation = null;

    currentPOQuotationData = null;


    // ========================================================
    // PRS
    // ========================================================

    const prsSelect =
        document.getElementById(
            "po_prs_id"
        );


    if (prsSelect) {

        prsSelect.value = "";

    }


    // ========================================================
    // COMPARISON SECTION
    // ========================================================

    const comparison =
        document.getElementById(
            "poQuotationComparison"
        );


    if (comparison) {

        comparison.style.display =
            "none";

    }


    // ========================================================
    // QUOTATION TABLE
    // ========================================================

    const quotationBody =
        document.getElementById(
            "poQuotationComparisonBody"
        );


    if (quotationBody) {

        quotationBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;">

                    Select a PRS to load quotations.

                </td>

            </tr>

        `;

    }


    // ========================================================
    // SELECTED QUOTATION SECTION
    // ========================================================

    const selectedQuotation =
        document.getElementById(
            "selectedPOQuotation"
        );


    if (selectedQuotation) {

        selectedQuotation.style.display =
            "none";

    }


    // ========================================================
    // QUOTATION SELECT
    // ========================================================

    const quotationSelect =
        document.getElementById(
            "po_quotation_id"
        );


    if (quotationSelect) {

        quotationSelect.innerHTML = `

            <option value="">

                -- Select Quotation --

            </option>

        `;

    }


    // ========================================================
    // SUPPLIER
    // ========================================================

    const supplier =
        document.getElementById(
            "po_supplier"
        );


    if (supplier) {

        supplier.value = "";

    }


    const supplierId =
        document.getElementById(
            "po_supplier_id"
        );


    if (supplierId) {

        supplierId.value = "";

    }


    // ========================================================
    // DEPARTMENT
    // ========================================================

    const department =
        document.getElementById(
            "po_department"
        );


    if (department) {

        department.value = "";

    }


    const departmentId =
        document.getElementById(
            "po_department_id"
        );


    if (departmentId) {

        departmentId.value = "";

    }


    // ========================================================
    // PRS NUMBER
    // ========================================================

    const prsNumber =
        document.getElementById(
            "po_prs_number"
        );


    if (prsNumber) {

        prsNumber.value = "";

    }


    // ========================================================
    // PO NUMBER
    // ========================================================

    const poNumber =
        document.getElementById(
            "po_number"
        );


    if (poNumber) {

        poNumber.value = "";

    }


    // ========================================================
    // PO DATE
    // ========================================================

    const poDate =
        document.getElementById(
            "po_date"
        );


    if (poDate) {

        poDate.value = "";

    }


    // ========================================================
    // ITEMS
    // ========================================================

    const itemsBody =
        document.getElementById(
            "poQuotationItemsBody"
        );


    if (itemsBody) {

        itemsBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="text-align:center;">

                    Select a quotation to load items.

                </td>

            </tr>

        `;

    }


    // ========================================================
    // TOTAL
    // ========================================================

    const total =
        document.getElementById(
            "poTotalAmount"
        );


    if (total) {

        total.innerText =
            "0.00";

    }

}


// ============================================================
// LOAD PRS QUOTATIONS FOR PO
// ============================================================

async function loadPRSQuotationsForPO() {

    const prsSelect =
        document.getElementById(
            "po_prs_id"
        );


    const comparisonBox =
        document.getElementById(
            "poQuotationComparison"
        );


    const tbody =
        document.getElementById(
            "poQuotationComparisonBody"
        );


    if (!prsSelect) {

        console.error(
            "po_prs_id not found."
        );

        return;

    }


    const prsId =
        prsSelect.value;


    currentPOPRS =
        prsId;


    // ========================================================
    // NO PRS SELECTED
    // ========================================================

    if (!prsId) {

        comparisonBox.style.display =
            "none";

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;">

                    Select a PRS to load quotations.

                </td>

            </tr>

        `;

        return;

    }


    // ========================================================
    // SHOW COMPARISON BOX
    // ========================================================

    comparisonBox.style.display =
        "block";


    tbody.innerHTML = `

        <tr>

            <td
                colspan="6"
                style="text-align:center;">

                Loading quotations...

            </td>

        </tr>

    `;


    try {

        // ====================================================
        // CALL FLASK API
        // ====================================================

        const response =
            await fetch(
                `/procurement/get_po_prs_quotations/${prsId}`
            );


        const result =
            await response.json();


        console.log(
            "PO quotations response:",
            result
        );


        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Failed to load quotations."
            );

        }


        const quotations =
            result.data || [];


        // ====================================================
        // NO QUOTATIONS
        // ====================================================

        if (
            quotations.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="text-align:center;">

                        No quotations found for this PRS.

                    </td>

                </tr>

            `;

            showPOMsg(
                "No quotations found for this PRS.",
                "error"
            );

            return;

        }


        // ====================================================
        // CLEAR TABLE
        // ====================================================

        tbody.innerHTML = "";


        // ====================================================
        // ADD QUOTATIONS
        // ====================================================

        quotations.forEach(
            quotation => {

                const row =
                    document.createElement(
                        "tr"
                    );


                // Store quotation data
                row.dataset.quotationId =
                    quotation.quotation_id;


                row.dataset.amount =
                    quotation.total_amount || 0;


                row.dataset.supplierId =
                    quotation.supplier_id || "";


                row.dataset.supplierName =
                    quotation.supplier_name || "";


                row.dataset.quotationNo =
                    quotation.quotation_no || "";


                row.dataset.deliveryDate =
                    quotation.delivery_date || "";


                row.dataset.warranty =
                    quotation.warranty || "";


                row.dataset.paymentTerms =
                    quotation.payment_terms || "";


                row.dataset.status =
                    quotation.status || "";


                // ==================================================
                // CHECK SELECTED STATUS
                // ==================================================

                const isSelected =
                    String(
                        quotation.status || ""
                    ).toUpperCase() ===
                    "SELECTED";


                // ==================================================
                // CREATE ROW
                // ==================================================

                row.innerHTML = `

                    <td>

                        <input
                            type="radio"
                            name="poQuotationRadio"
                            value="${quotation.quotation_id}"
                            ${isSelected ? "checked" : ""}
                        >

                    </td>


                    <td>

                        ${quotation.quotation_no || "-"}

                    </td>


                    <td>

                        ${quotation.supplier_name || "-"}

                    </td>


                    <td>

                        ${formatPOAmount(
                            quotation.total_amount
                        )}

                    </td>


                    <td>

                        ${formatDeliveryDate(
                            quotation.delivery_date
                        )}

                    </td>


                    <td>

                        ${quotation.warranty || "-"}

                    </td>

                `;


                // ==================================================
                // CLICK ROW TO SELECT
                // ==================================================

                row.addEventListener(
                    "click",
                    function(event) {

                        if (
                            event.target.tagName !==
                            "INPUT"
                        ) {

                            const radio =
                                row.querySelector(
                                    "input[type='radio']"
                                );


                            if (radio) {

                                radio.checked =
                                    true;

                            }

                        }


                        // Remove selection
                        document
                            .querySelectorAll(
                                "#poQuotationComparisonBody tr"
                            )
                            .forEach(
                                r => {

                                    r.classList.remove(
                                        "selected"
                                    );

                                }
                            );


                        row.classList.add(
                            "selected"
                        );

                    }
                );


                tbody.appendChild(
                    row
                );


                // Mark selected quotation
                if (isSelected) {

                    row.classList.add(
                        "selected"
                    );

                }

            }
        );


        showPOMsg(
            `${quotations.length} quotation(s) loaded.`,
            "success"
        );

    }

    catch (error) {

        console.error(
            "Load PO quotations error:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;">

                    Failed to load quotations.

                </td>

            </tr>

        `;


        showPOMsg(
            error.message ||
            "Failed to load quotations.",
            "error"
        );

    }

}


// ============================================================
// COMPARE PO QUOTATIONS
// ============================================================
// ============================================================
// COMPARE PO QUOTATIONS
// ============================================================
// ============================================================
// COMPARE PO QUOTATIONS
// ============================================================
// ============================================================
// COMPARE PO QUOTATIONS
// ============================================================
// ============================================================
// COMPARE PO QUOTATIONS
// FIND LOWEST QUOTATION AND HIGHLIGHT BEST SUPPLIER
// ============================================================

function comparePOQuotations() {

    console.log(
        "=========================================="
    );

    console.log(
        "COMPARING PO QUOTATIONS"
    );

    console.log(
        "=========================================="
    );


    // ========================================================
    // GET ALL TABLE ROWS
    // ========================================================

    const rows =
        document.querySelectorAll(
            "#poQuotationComparisonBody tr"
        );


    console.log(
        "Total rows:",
        rows.length
    );


    // ========================================================
    // GET ONLY REAL QUOTATION ROWS
    // ========================================================

    const quotationRows =
        Array.from(rows).filter(
            function(row) {

                return (
                    row.dataset &&
                    row.dataset.quotationId
                );

            }
        );


    console.log(
        "Valid quotation rows:",
        quotationRows.length
    );


    // ========================================================
    // CHECK IF QUOTATIONS EXIST
    // ========================================================

    if (
        quotationRows.length === 0
    ) {

        alert(
            "No quotations available for comparison."
        );

        showPOMsg(
            "No quotations available for comparison.",
            "error"
        );

        return;

    }


    // ========================================================
    // VARIABLES
    // ========================================================

    let bestRow =
        null;


    let lowestAmount =
        Infinity;


    // ========================================================
    // REMOVE PREVIOUS HIGHLIGHTING
    // ========================================================

    quotationRows.forEach(
        function(row) {

            row.classList.remove(
                "best"
            );


            row.classList.remove(
                "selected"
            );


            const radio =
                row.querySelector(
                    "input[type='radio']"
                );


            if (radio) {

                radio.checked =
                    false;

            }

        }
    );


    // ========================================================
    // FIND LOWEST QUOTATION
    // ========================================================

    quotationRows.forEach(
        function(row) {

            // ==================================================
            // GET QUOTATION DETAILS
            // ==================================================

            const quotationId =
                row.dataset.quotationId;


            const quotationNo =
                row.dataset.quotationNo ||
                "Unknown";


            const supplierName =
                row.dataset.supplierName ||
                "Unknown Supplier";


            const amount =
                parseFloat(
                    row.dataset.amount
                ) || 0;


            console.log(
                "Quotation ID:",
                quotationId
            );


            console.log(
                "Quotation No:",
                quotationNo
            );


            console.log(
                "Supplier:",
                supplierName
            );


            console.log(
                "Amount:",
                amount
            );


            // ==================================================
            // IGNORE INVALID AMOUNTS
            // ==================================================

            if (
                amount <= 0
            ) {

                return;

            }


            // ==================================================
            // FIND LOWEST AMOUNT
            // ==================================================

            if (
                amount <
                lowestAmount
            ) {

                lowestAmount =
                    amount;


                bestRow =
                    row;

            }

        }
    );


    // ========================================================
    // CHECK IF BEST QUOTATION WAS FOUND
    // ========================================================

    if (!bestRow) {

        alert(
            "Could not determine the best quotation. Please check quotation amounts."
        );


        showPOMsg(
            "Could not determine the best quotation.",
            "error"
        );


        return;

    }


    // ========================================================
    // GET BEST QUOTATION INFORMATION
    // ========================================================

    const bestQuotationId =
        bestRow.dataset.quotationId;


    const bestQuotationNo =
        bestRow.dataset.quotationNo ||
        "Unknown";


    const bestSupplierName =
        bestRow.dataset.supplierName ||
        "Unknown Supplier";


    const bestSupplierId =
        bestRow.dataset.supplierId ||
        "";


    const bestDeliveryDate =
        bestRow.dataset.deliveryDate ||
        "";


    const bestWarranty =
        bestRow.dataset.warranty ||
        "";


    const bestPaymentTerms =
        bestRow.dataset.paymentTerms ||
        "";


    // ========================================================
    // HIGHLIGHT BEST ROW
    // ========================================================

    bestRow.classList.add(
        "best"
    );


    bestRow.classList.add(
        "selected"
    );


    // ========================================================
    // CHECK BEST QUOTATION RADIO BUTTON
    // ========================================================

    const bestRadio =
        bestRow.querySelector(
            "input[type='radio']"
        );


    if (bestRadio) {

        bestRadio.checked =
            true;

    }


    // ========================================================
    // STORE BEST QUOTATION GLOBALLY
    // ========================================================

    currentPOQuotation =
        bestQuotationId;


    currentPOQuotationData = {

        quotation_id:
            bestQuotationId,

        quotation_no:
            bestQuotationNo,

        supplier_id:
            bestSupplierId,

        supplier_name:
            bestSupplierName,

        total_amount:
            lowestAmount,

        delivery_date:
            bestDeliveryDate,

        warranty:
            bestWarranty,

        payment_terms:
            bestPaymentTerms

    };


    // ========================================================
    // LOG BEST QUOTATION
    // ========================================================

    console.log(
        "=========================================="
    );

    console.log(
        "BEST QUOTATION FOUND"
    );

    console.log(
        "Quotation ID:",
        bestQuotationId
    );

    console.log(
        "Quotation No:",
        bestQuotationNo
    );

    console.log(
        "Supplier:",
        bestSupplierName
    );

    console.log(
        "Supplier ID:",
        bestSupplierId
    );

    console.log(
        "Lowest Amount:",
        lowestAmount
    );

    console.log(
        "=========================================="
    );


    // ========================================================
    // SHOW SUCCESS MESSAGE
    // ========================================================

    showPOMsg(

        "Best quotation selected: " +
        bestQuotationNo +
        " - " +
        bestSupplierName,

        "success"

    );


    // ========================================================
    // ALERT USER
    // ========================================================

    alert(

        "BEST SUPPLIER QUOTATION FOUND\n\n" +

        "Quotation No: " +
        bestQuotationNo +

        "\n\nSupplier: " +
        bestSupplierName +

        "\n\nTotal Amount: UGX " +
        formatPOAmount(
            lowestAmount
        ) +

        "\n\nThe best quotation has been highlighted."

    );

}


// ============================================================
// SELECT APPROVED QUOTATION
// ============================================================

async function selectApprovedQuotation() {

    const selectedRadio =
        document.querySelector(
            "input[name='poQuotationRadio']:checked"
        );


    if (!selectedRadio) {

        showPOMsg(
            "Please select a quotation first.",
            "error"
        );

        return;

    }


    const row =
        selectedRadio.closest(
            "tr"
        );


    if (!row) {

        showPOMsg(
            "Selected quotation could not be found.",
            "error"
        );

        return;

    }


    const quotationId =
        row.dataset.quotationId;


    if (!quotationId) {

        showPOMsg(
            "Quotation ID is missing.",
            "error"
        );

        return;

    }


    currentPOQuotation =
        quotationId;


    // ========================================================
    // GET SELECTED QUOTATION DATA
    // ========================================================

    currentPOQuotationData = {

        quotation_id:
            quotationId,

        quotation_no:
            row.dataset.quotationNo || "",

        supplier_id:
            row.dataset.supplierId || "",

        supplier_name:
            row.dataset.supplierName || "",

        total_amount:
            row.dataset.amount || 0,

        delivery_date:
            row.dataset.deliveryDate || "",

        warranty:
            row.dataset.warranty || "",

        payment_terms:
            row.dataset.paymentTerms || ""

    };


    // ========================================================
    // SHOW SELECTED QUOTATION SECTION
    // ========================================================

    const selectedSection =
        document.getElementById(
            "selectedPOQuotation"
        );


    if (selectedSection) {

        selectedSection.style.display =
            "block";

    }


    // ========================================================
    // LOAD QUOTATION SELECT
    // ========================================================

    const quotationSelect =
        document.getElementById(
            "po_quotation_id"
        );


    if (quotationSelect) {

        quotationSelect.innerHTML = `

            <option value="${quotationId}">

                ${currentPOQuotationData.quotation_no}

            </option>

        `;


        quotationSelect.value =
            quotationId;

    }


    // ========================================================
    // LOAD SUPPLIER
    // ========================================================

    const supplier =
        document.getElementById(
            "po_supplier"
        );


    if (supplier) {

        supplier.value =
            currentPOQuotationData.supplier_name;

    }


    const supplierId =
        document.getElementById(
            "po_supplier_id"
        );


    if (supplierId) {

        supplierId.value =
            currentPOQuotationData.supplier_id;

    }


    // ========================================================
    // LOAD PRS NUMBER
    // ========================================================

    const prsSelect =
        document.getElementById(
            "po_prs_id"
        );


    const prsNumber =
        document.getElementById(
            "po_prs_number"
        );


    if (
        prsSelect &&
        prsNumber
    ) {

        const selectedOption =
            prsSelect.options[
                prsSelect.selectedIndex
            ];


        if (selectedOption) {

            prsNumber.value =
                selectedOption.text.trim();

        }

    }


    // ========================================================
    // SET PO DATE
    // ========================================================

    setCurrentPODate();


    // ========================================================
    // LOAD QUOTATION ITEMS
    // ========================================================

    await loadQuotationForPO();


    showPOMsg(
        "Quotation selected. Review the PO details.",
        "success"
    );

}

// ============================================================
// LOAD SELECTED QUOTATION FOR PURCHASE ORDER
// ============================================================

async function loadQuotationForPO() {

    console.log(
        "=========================================="
    );

    console.log(
        "LOADING QUOTATION FOR PURCHASE ORDER"
    );

    console.log(
        "=========================================="
    );


    // ========================================================
    // GET QUOTATION SELECT
    // ========================================================

    const quotationSelect =
        document.getElementById(
            "po_quotation_id"
        );


    if (!quotationSelect) {

        console.error(
            "po_quotation_id element not found."
        );

        return;

    }


    // ========================================================
    // GET SELECTED QUOTATION ID
    // ========================================================

    const quotationId =
        quotationSelect.value;


    console.log(
        "Selected quotation ID:",
        quotationId
    );


    // ========================================================
    // VALIDATE QUOTATION ID
    // ========================================================

    if (!quotationId) {

        console.warn(
            "No quotation selected."
        );

        return;

    }


    // ========================================================
    // SAVE CURRENT QUOTATION
    // ========================================================

    currentPOQuotation =
        quotationId;


    // ========================================================
    // GET FORM ELEMENTS
    // ========================================================

    const supplier =
        document.getElementById(
            "po_supplier"
        );


    const supplierId =
        document.getElementById(
            "po_supplier_id"
        );


    const department =
        document.getElementById(
            "po_department"
        );


    const departmentId =
        document.getElementById(
            "po_department_id"
        );


    const prsNumber =
        document.getElementById(
            "po_prs_number"
        );


    const itemsBody =
        document.getElementById(
            "poQuotationItemsBody"
        );


    const totalElement =
        document.getElementById(
            "poTotalAmount"
        );


    // ========================================================
    // SHOW LOADING
    // ========================================================

    if (itemsBody) {

        itemsBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="text-align:center;">

                    Loading quotation details...

                </td>

            </tr>

        `;

    }


    try {

        // ====================================================
        // CALL CORRECT API
        // ====================================================

        const response =
            await fetch(
                `/procurement/api/quotation-for-po/${quotationId}`
            );


        console.log(
            "Quotation API HTTP status:",
            response.status
        );


        // ====================================================
        // READ RESPONSE
        // ====================================================

        const result =
            await response.json();


        console.log(
            "Quotation details response:",
            result
        );


        // ====================================================
        // CHECK API RESPONSE
        // ========================================================

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(

                result.message ||

                result.error ||

                "Failed to load quotation."

            );

        }


        // ====================================================
        // GET QUOTATION
        // ====================================================

        const quotation =
            result.quotation || {};


        // ====================================================
        // GET ITEMS
        // ====================================================

        const items =
            result.items || [];


        console.log(
            "Quotation:",
            quotation
        );


        console.log(
            "Quotation items:",
            items
        );


        // ====================================================
        // UPDATE SUPPLIER
        // ====================================================

        if (supplier) {

            supplier.value =
                quotation.supplier_name || "";

        }


        // ====================================================
        // UPDATE SUPPLIER ID
        // ====================================================

        if (supplierId) {

            supplierId.value =
                quotation.supplier_id || "";

        }


        // ====================================================
        // UPDATE DEPARTMENT
        // ====================================================

        if (department) {

            department.value =
                quotation.department_name || "";

        }


        // ====================================================
        // UPDATE DEPARTMENT ID
        // ====================================================

        if (departmentId) {

            departmentId.value =
                quotation.department_id || "";

        }


        // ====================================================
        // UPDATE PRS NUMBER
        // ====================================================

        if (prsNumber) {

            prsNumber.value =
                quotation.prs_no || "";

        }


        // ====================================================
        // NO ITEMS
        // ====================================================

        if (
            items.length === 0
        ) {

            if (itemsBody) {

                itemsBody.innerHTML = `

                    <tr>

                        <td
                            colspan="5"
                            style="text-align:center;">

                            No quotation items found.

                        </td>

                    </tr>

                `;

            }


            if (totalElement) {

                totalElement.innerText =
                    formatPOAmount(
                        quotation.total_amount || 0
                    );

            }


            showPOMsg(
                "Quotation loaded, but no quotation items were found.",
                "error"
            );


            return;

        }


        // ====================================================
        // CLEAR ITEMS
        // ====================================================

        if (itemsBody) {

            itemsBody.innerHTML = "";

        }


        // ====================================================
        // CALCULATE TOTAL
        // ====================================================

        let calculatedTotal =
            0;


        // ====================================================
        // DISPLAY ITEMS
        // ====================================================

        items.forEach(
            function(item) {

                const quantity =
                    parseFloat(
                        item.quantity
                    ) || 0;


                const unitPrice =
                    parseFloat(
                        item.unit_price
                    ) || 0;


                const itemTotal =
                    quantity *
                    unitPrice;


                calculatedTotal +=
                    itemTotal;


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapePOHTML(
                            item.item_name || "-"
                        )}
                    </td>

                    <td>
                        ${escapePOHTML(
                            item.description || "-"
                        )}
                    </td>

                    <td>
                        ${quantity}
                    </td>

                    <td>
                        ${formatPOAmount(
                            unitPrice
                        )}
                    </td>

                    <td>
                        ${formatPOAmount(
                            itemTotal
                        )}
                    </td>

                `;


                if (itemsBody) {

                    itemsBody.appendChild(
                        row
                    );

                }

            }
        );


        // ====================================================
        // GET FINAL TOTAL
        // ====================================================

        const finalTotal =
            parseFloat(
                quotation.total_amount
            ) || calculatedTotal;


        // ====================================================
        // DISPLAY TOTAL
        // ====================================================

        if (totalElement) {

            totalElement.innerText =
                formatPOAmount(
                    finalTotal
                );

        }


        // ====================================================
        // SAVE CURRENT QUOTATION DATA
        // ====================================================

        currentPOQuotationData = {

            quotation_id:
                quotation.quotation_id,

            quotation_no:
                quotation.quotation_no,

            supplier_id:
                quotation.supplier_id,

            supplier_name:
                quotation.supplier_name,

            qrf_id:
                quotation.qrf_id,

            qrf_no:
                quotation.qrf_no,

            requisition_id:
                quotation.requisition_id,

            prs_no:
                quotation.prs_no,

            department_id:
                quotation.department_id,

            department_name:
                quotation.department_name,

            quotation_date:
                quotation.quotation_date,

            delivery_date:
                quotation.delivery_date,

            warranty:
                quotation.warranty,

            payment_terms:
                quotation.payment_terms,

            total_amount:
                finalTotal,

            items:
                items

        };


        console.log(
            "Current PO quotation data:",
            currentPOQuotationData
        );


        // ====================================================
        // SUCCESS MESSAGE
        // ====================================================

        showPOMsg(
            "Quotation loaded successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Load quotation for PO error:",
            error
        );


        // ====================================================
        // SHOW ERROR IN TABLE
        // ====================================================

        if (itemsBody) {

            itemsBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="text-align:center;">

                        Failed to load quotation items.

                    </td>

                </tr>

            `;

        }


        // ====================================================
        // RESET TOTAL
        // ====================================================

        if (totalElement) {

            totalElement.innerText =
                "0.00";

        }


        // ====================================================
        // SHOW ERROR MESSAGE
        // ====================================================

        showPOMsg(

            error.message ||

            "Failed to load quotation.",

            "error"

        );

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapePOHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
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

// ============================================================
// CREATE PURCHASE ORDER
// ============================================================

async function createPO() {

    // ========================================================
    // GET VALUES
    // ========================================================

    const prsId =
        document.getElementById(
            "po_prs_id"
        ).value;


    const quotationId =
        document.getElementById(
            "po_quotation_id"
        ).value;


    const supplierId =
        document.getElementById(
            "po_supplier_id"
        ).value;


    // ========================================================
    // VALIDATE
    // ========================================================

    if (!prsId) {

        showPOMsg(
            "Please select a PRS.",
            "error"
        );

        return;

    }


    if (!quotationId) {

        showPOMsg(
            "Please select an approved quotation.",
            "error"
        );

        return;

    }


    if (!supplierId) {

        showPOMsg(
            "Supplier information is missing.",
            "error"
        );

        return;

    }


    // ========================================================
    // CONFIRM
    // ========================================================

    const confirmed =
        confirm(
            "Are you sure you want to create a Purchase Order from this quotation?"
        );


    if (!confirmed) {

        return;

    }


    // ========================================================
    // DISABLE BUTTON
    // ========================================================

    const buttons =
        document.querySelectorAll(
            "#selectedPOQuotation button"
        );


    buttons.forEach(
        button => {

            if (
                button.innerText
                    .toLowerCase()
                    .includes(
                        "create purchase order"
                    )
            ) {

                button.disabled =
                    true;

                button.innerText =
                    "Creating PO...";

            }

        }
    );


    try {

        // ====================================================
        // SEND REQUEST
        // ====================================================

        const response =
            await fetch(
                "/procurement/create_po_from_selected",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            quotation_id:
                                parseInt(
                                    quotationId
                                ),

                            prs_id:
                                parseInt(
                                    prsId
                                )

                        })

                }
            );


        const result =
            await response.json();


        console.log(
            "Create PO response:",
            result
        );


        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Failed to create Purchase Order."
            );

        }


        // ====================================================
        // SUCCESS
        // ====================================================

        showPOMsg(
            `Purchase Order ${result.po_number} created successfully.`,
            "success"
        );


        alert(
            `Purchase Order created successfully.\n\nPO Number: ${result.po_number}\nSupplier: ${result.supplier_name}`
        );


        // ====================================================
        // CLOSE FORM
        // ====================================================

        hidePOQuotationBox();


        // ====================================================
        // OPTIONAL: RELOAD PO LIST
        // ====================================================

        if (
            typeof loadPurchaseOrders ===
            "function"
        ) {

            loadPurchaseOrders();

        }


    }

    catch (error) {

        console.error(
            "Create PO error:",
            error
        );


        showPOMsg(
            error.message ||
            "Failed to create Purchase Order.",
            "error"
        );

    }

    finally {

        // ====================================================
        // ENABLE BUTTON
        // ====================================================

        buttons.forEach(
            button => {

                if (
                    button.innerText
                        .toLowerCase()
                        .includes(
                            "creating po"
                        )
                ) {

                    button.disabled =
                        false;

                    button.innerText =
                        "Create Purchase Order";

                }

            }
        );

    }

}


// ============================================================
// SET CURRENT PO DATE
// ============================================================

function setCurrentPODate() {

    const poDate =
        document.getElementById(
            "po_date"
        );


    if (!poDate) {

        return;

    }


    const now =
        new Date();


    // Convert to local datetime-local format
    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const hours =
        String(
            now.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutes =
        String(
            now.getMinutes()
        ).padStart(
            2,
            "0"
        );


    poDate.value =
        `${year}-${month}-${day}T${hours}:${minutes}`;

}


// ============================================================
// FORMAT AMOUNT
// ============================================================

function formatPOAmount(amount) {

    const number =
        parseFloat(
            amount
        ) || 0;


    return number.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


// ============================================================
// FORMAT DELIVERY DATE
// ============================================================

function formatDeliveryDate(dateValue) {

    if (!dateValue) {

        return "-";

    }


    // If already formatted
    if (
        typeof dateValue !== "string"
    ) {

        return dateValue;

    }


    return dateValue
        .split("T")[0];

}




// ============================================================
// LOAD NEXT PO NUMBER
// FORMAT: PO/YEAR/0001
// ============================================================

async function loadNextPONumber() {

    const poNumberInput =
        document.getElementById(
            "po_number"
        );


    if (!poNumberInput) {

        console.error(
            "po_number input not found."
        );

        return;

    }


    // Show loading
    poNumberInput.value =
        "Loading...";


    try {

        const response =
            await fetch(
                "/procurement/api/next-po-number"
            );


        const result =
            await response.json();


        console.log(
            "Next PO Number Response:",
            result
        );


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Failed to load PO number."
            );

        }


        // Display:
        // PO/2026/0001

        poNumberInput.value =
            result.po_number;


    }

    catch (error) {

        console.error(
            "Load next PO number error:",
            error
        );


        poNumberInput.value =
            "";


        showPOMsg(
            "Failed to load next PO number.",
            "error"
        );

    }

}


// ============================================================
// PAGE LOAD
// ============================================================
document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "PO from quotation JavaScript loaded."
        );

    }
);