function showQuotationEntry() {

    const quotationForm =
        document.getElementById(
            "quotationEntryForm"
        );

    const quotationTable =
        document.getElementById(
            "quotationTableList"
        );

    // ==========================================
    // SHOW QUOTATION ENTRY FORM
    // ==========================================

    if (quotationForm) {

        quotationForm.style.display =
            "block";

    }

    // ==========================================
    // HIDE QUOTATION TABLE
    // ==========================================

    if (quotationTable) {

        quotationTable.style.display =
            "none";

    }

    // ==========================================
    // LOAD NEXT QUOTATION NUMBER
    // ==========================================

    loadNextQuotationNumber();

}


function hideQuotationEntry() {

    const quotationForm =
        document.getElementById(
            "quotationEntryForm"
        );

    const quotationTable =
        document.getElementById(
            "quotationTableList"
        );

    if (quotationForm) {

        quotationForm.style.display =
            "none";

    }

    if (quotationTable) {

        quotationTable.style.display =
            "table";

    }

}

// =====================================================
// LOAD NEXT QUOTATION NUMBER
// =====================================================

async function loadNextQuotationNumber() {

    const quotationInput =
        document.getElementById("QTNo");

    if (!quotationInput) {
        return;
    }

    quotationInput.value = "Loading...";

    try {

        const response = await fetch(
            "/procurement/api/next-quotation-number"
        );

        const data = await response.json();

        if (data.success) {

            quotationInput.value =
                data.quotation_no;

        } else {

            quotationInput.value = "";

            console.error(
                data.message
            );

        }

    } catch (error) {

        console.error(
            "Failed to load quotation number:",
            error
        );

        quotationInput.value = "";

    }

}

// ==========================================================
// LOAD QRF DETAILS
// ==========================================================
// ==========================================================
// LOAD QRF DETAILS
// ==========================================================

async function loadQRFDetails() {

    // ======================================================
    // GET SELECTED QRF
    // ======================================================

    const qrfSelect =
        document.getElementById(
            "quotationQrfSelect"
        );

    const qrfId =
        qrfSelect.value;

    // ======================================================
    // GET FORM ELEMENTS
    // ======================================================

    const supplierIdInput =
        document.getElementById(
            "quotationSupplierId"
        );

    const supplierNameInput =
        document.getElementById(
            "quotationSupplierName"
        );

    const itemsTableBody =
        document.getElementById(
            "quotationItemsTableBody"
        );

    // ======================================================
    // NO QRF SELECTED
    // ======================================================

    if (!qrfId) {

        supplierIdInput.value = "";

        supplierNameInput.value = "";

        itemsTableBody.innerHTML = "";

        return;

    }

    // ======================================================
    // SHOW LOADING
    // ======================================================

    supplierNameInput.value =
        "Loading supplier...";

    itemsTableBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                style="text-align:center;">

                Loading quotation items...

            </td>

        </tr>

    `;

    try {

        // ==================================================
        // FETCH QRF DETAILS
        // ==================================================

        const response =
            await fetch(
                `/procurement/api/quotation-request/${qrfId}`
            );

        // ==================================================
        // CONVERT RESPONSE TO JSON
        // ==================================================

        const data =
            await response.json();

        // ==================================================
        // CHECK RESPONSE
        // ==================================================

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Failed to load QRF details."
            );

            supplierIdInput.value = "";

            supplierNameInput.value = "";

            itemsTableBody.innerHTML = "";

            return;

        }

        // ==================================================
        // LOAD SUPPLIER
        // ==================================================

        if (
            data.suppliers &&
            data.suppliers.length > 0
        ) {

            // ----------------------------------------------
            // GET FIRST SUPPLIER
            // ----------------------------------------------

            const supplier =
                data.suppliers[0];

            // ----------------------------------------------
            // STORE SUPPLIER ID
            // ----------------------------------------------

            supplierIdInput.value =
                supplier.supplier_id;

            // ----------------------------------------------
            // DISPLAY SUPPLIER NAME
            // ----------------------------------------------

            supplierNameInput.value =
                supplier.supplier_name;

        }

        else {

            supplierIdInput.value = "";

            supplierNameInput.value =
                "No supplier found";

        }

        // ==================================================
        // CLEAR OLD ITEMS
        // ==================================================

        itemsTableBody.innerHTML = "";

        // ==================================================
        // CHECK ITEMS
        // ==================================================

        if (
            !data.items ||
            data.items.length === 0
        ) {

            itemsTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="text-align:center;">

                        No items found for this QRF.

                    </td>

                </tr>

            `;

            return;

        }

        // ==================================================
        // LOAD ITEMS
        // ==================================================

        data.items.forEach(
            item => {

                // ==========================================
                // CREATE TABLE ROW
                // ==========================================

                const row =
                    document.createElement(
                        "tr"
                    );

                // ==========================================
                // STORE ORIGINAL QRF DATA
                // ==========================================

                row.dataset.qrfItemId =
                    item.quotation_request_item_id ||
                    "";

                // ==========================================
                // ITEM ROW
                // ==========================================

                row.innerHTML = `

                    <!-- ==================================
                         ITEM NAME
                    =================================== -->

                    <td>

                        <input
                            type="text"
                            class="quotation-item-name"
                            value="${item.material_name || ""}">

                    </td>

                    <!-- ==================================
                         DESCRIPTION
                    =================================== -->

                    <td>

                        <input
                            type="text"
                            class="quotation-item-description"
                            value="${item.description || ""}">

                    </td>

                    <!-- ==================================
                         QUANTITY
                    =================================== -->

                    <td>

                        <div
                            style="
                                display:flex;
                                gap:5px;
                            ">

                            <input
                                type="number"
                                class="quotation-item-quantity"
                                value="${item.quantity || 0}"
                                min="0"
                                step="1"
                                style="width:80px;"
                                oninput="
                                    calculateQuotationRow(this)
                                ">

                            <input
                                type="text"
                                class="quotation-item-uom"
                                value="${item.uom || ""}"
                                placeholder="UOM"
                                style="width:80px;">

                        </div>

                    </td>

                    <!-- ==================================
                         UNIT PRICE
                    =================================== -->

                    <td>

                        <input
                            type="number"
                            class="quotation-item-price"
                            value="0"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            oninput="
                                calculateQuotationRow(this)
                            ">

                    </td>

                    <!-- ==================================
                         TOTAL
                    =================================== -->

                    <td>

                        <span
                            class="quotation-item-total">

                            0.00

                        </span>

                    </td>

                    <!-- ==================================
                         REMOVE
                    =================================== -->

                    <td>

                        <button
                            type="button"
                            class="btn danger"
                            onclick="
                                removeQuotationRow(this)
                            ">

                            Remove

                        </button>

                    </td>

                `;

                // ==========================================
                // ADD ROW TO TABLE
                // ==========================================

                itemsTableBody.appendChild(
                    row
                );

                // ==========================================
                // CALCULATE INITIAL TOTAL
                // ==========================================

                calculateQuotationRow(
                    row.querySelector(
                        ".quotation-item-price"
                    )
                );

            }
        );

    }

    catch (error) {

        // ==================================================
        // LOG ERROR
        // ==================================================

        console.error(
            "QRF details error:",
            error
        );

        // ==================================================
        // CLEAR FORM
        // ==================================================

        supplierIdInput.value = "";

        supplierNameInput.value = "";

        itemsTableBody.innerHTML = "";

        // ==================================================
        // SHOW ERROR
        // ==================================================

        alert(
            "Failed to load QRF details. Please try again."
        );

    }

}

// =====================================================
// REMOVE ROW
// =====================================================

function removeQuotationRow(btn){

    btn.closest("tr").remove();

}





// =====================================================
// CALCULATE AMOUNT
// =====================================================

function calculateQuotationRow(input) {

    const row =
        input.closest("tr");

    const quantity =
        parseFloat(
            row.querySelector(
                ".quotation-item-quantity"
            ).value
        ) || 0;

    const unitPrice =
        parseFloat(
            row.querySelector(
                ".quotation-item-price"
            ).value
        ) || 0;

    const total =
        quantity * unitPrice;

    row.querySelector(
        ".quotation-item-total"
    ).textContent =
        total.toFixed(2);

}




// =====================================================
// SAVE QUOTATION
// =====================================================

// ==========================================================
// SAVE QUOTATION
// ==========================================================

async function saveQuotation() {

    // ======================================================
    // GET HEADER VALUES
    // ======================================================

    const qrfId =
        document.getElementById(
            "quotationQrfSelect"
        ).value;

    const supplierId =
        document.getElementById(
            "quotationSupplierId"
        ).value;

    const deliveryDate =
        document.getElementById(
            "quotationDeliveryDate"
        ).value;

    const paymentTerms =
        document.getElementById(
            "quotationPaymentTerms"
        ).value;

    const warranty =
        document.getElementById(
            "quotationWarranty"
        ).value;

    // ======================================================
    // VALIDATE QRF
    // ======================================================

    if (!qrfId) {

        alert(
            "Please select a QRF."
        );

        return;

    }

    // ======================================================
    // VALIDATE SUPPLIER
    // ======================================================

    if (!supplierId) {

        alert(
            "Please select a supplier."
        );

        return;

    }

    // ======================================================
    // GET ALL QUOTATION ITEM ROWS
    // ======================================================

    const rows =
        document.querySelectorAll(
            "#quotationItemsTableBody tr"
        );

    // ======================================================
    // CHECK IF ITEMS EXIST
    // ======================================================

    if (rows.length === 0) {

        alert(
            "Add at least one item."
        );

        return;

    }

    // ======================================================
    // CREATE ITEMS ARRAY
    // ======================================================

    const items = [];

    // ======================================================
    // READ EACH ITEM
    // ======================================================

    rows.forEach(
        row => {

            // ----------------------------------------------
            // GET INPUTS
            // ----------------------------------------------

            const itemNameInput =
                row.querySelector(
                    ".quotation-item-name"
                );

            const descriptionInput =
                row.querySelector(
                    ".quotation-item-description"
                );

            const quantityInput =
                row.querySelector(
                    ".quotation-item-quantity"
                );

            const uomInput =
                row.querySelector(
                    ".quotation-item-uom"
                );

            const unitPriceInput =
                row.querySelector(
                    ".quotation-item-price"
                );

            // ----------------------------------------------
            // CHECK INPUTS EXIST
            // ----------------------------------------------

            if (
                !itemNameInput ||
                !quantityInput ||
                !unitPriceInput
            ) {

                return;

            }

            // ----------------------------------------------
            // GET VALUES
            // ----------------------------------------------

            const itemName =
                itemNameInput.value.trim();

            const description =
                descriptionInput
                    ? descriptionInput.value.trim()
                    : "";

            const quantity =
                parseFloat(
                    quantityInput.value
                ) || 0;

            const uom =
                uomInput
                    ? uomInput.value.trim()
                    : "";

            const unitPrice =
                parseFloat(
                    unitPriceInput.value
                ) || 0;

            // ----------------------------------------------
            // CALCULATE AMOUNT
            // ----------------------------------------------

            const amount =
                quantity *
                unitPrice;

            // ----------------------------------------------
            // ADD ITEM
            // ----------------------------------------------

            if (itemName) {

                items.push({

                    item_name:
                        itemName,

                    description:
                        description,

                    quantity:
                        quantity,

                    uom:
                        uom,

                    unit_price:
                        unitPrice,

                    amount:
                        amount

                });

            }

        }
    );

    // ======================================================
    // CHECK ITEMS AFTER READING
    // ======================================================

    if (items.length === 0) {

        alert(
            "Add at least one item."
        );

        return;

    }

    // ======================================================
    // VALIDATE QUANTITY AND PRICE
    // ======================================================

    for (
        const item of items
    ) {

        if (
            item.quantity <= 0
        ) {

            alert(
                `Please enter a valid quantity for ${item.item_name}.`
            );

            return;

        }

        if (
            item.unit_price <= 0
        ) {

            alert(
                `Please enter a unit price for ${item.item_name}.`
            );

            return;

        }

    }

    // ======================================================
    // CALCULATE GRAND TOTAL
    // ======================================================

    const totalAmount =
        items.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    item.amount
                );

            },
            0
        );

    // ======================================================
    // PREPARE DATA
    // ======================================================

    const quotationData = {

        qrf_id:
            parseInt(qrfId),

        supplier_id:
            parseInt(supplierId),

        delivery_date:
            deliveryDate || null,

        payment_terms:
            paymentTerms || null,

        warranty:
            warranty || null,

        total_amount:
            totalAmount,

        items:
            items

    };

    // ======================================================
    // DEBUG
    // ======================================================

    console.log(
        "QUOTATION DATA TO SAVE:",
        quotationData
    );
	
    // ======================================================
    // SEND TO FLASK
    // ======================================================

    try {

        const response =
            await fetch(
                "/procurement/api/quotation/save",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            quotationData
                        )

                }
            );

        // ==================================================
        // READ RESPONSE
        // ==================================================

        const result =
            await response.json();

        // ==================================================
        // CHECK RESPONSE
        // ==================================================

        if (
            !response.ok ||
            !result.success
        ) {

            console.error(
                "Save quotation response:",
                result
            );

            alert(
                result.message ||
                "Failed to save quotation."
            );

            return;

        }

        // ==================================================
        // SUCCESS
        // ==================================================

        alert(
            "Quotation saved successfully."
        );

        // ==================================================
        // CLOSE FORM
        // ==================================================

        hideQuotationEntry();

        // ==================================================
        // RELOAD QUOTATIONS
        // ==================================================

        if (
            typeof loadQuotations ===
            "function"
        ) {

            loadQuotations();

        }

    }

    catch (error) {

        console.error(
            "Save quotation error:",
            error
        );

        alert(
            "An error occurred while saving the quotation."
        );

    }

}



// =====================================================
// CALCULATE ITEM TOTAL
// =====================================================

function calculateQuotation(input){

    let row =
    input.closest("tr");


    let qty =
    parseFloat(
        row.querySelector(".qqty").value
    ) || 0;


    let price =
    parseFloat(
        row.querySelector(".qprice").value
    ) || 0;


    row.querySelector(
        ".qamount"
    ).value =
    (qty * price).toFixed(2);


}






