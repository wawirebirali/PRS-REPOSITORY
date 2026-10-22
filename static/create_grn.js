/* ============================================================
   GRN MANAGEMENT - COMPLETE JAVASCRIPT
   ============================================================ */


/* ============================================================
   PAGE LOAD
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    console.log("GRN JavaScript loaded successfully.");

    // Hide GRN form when page first opens
    const grnFormBox =
        document.getElementById("grnFormBox");

    if (grnFormBox) {

        grnFormBox.style.display = "none";

    }

    // Attach form validation
    const grnForm =
        document.getElementById("grnForm");

    if (grnForm) {

        grnForm.addEventListener(
            "submit",
            function (event) {

                if (!validateGRNForm()) {

                    event.preventDefault();

                }

            }
        );

    }

});


/* ============================================================
   OPEN GRN FORM
   ============================================================ */

function openGRNForm() {

    console.log("Opening GRN form...");

    const grnFormBox =
        document.getElementById("grnFormBox");


    if (!grnFormBox) {

        console.error(
            "ERROR: grnFormBox was not found."
        );

        return;

    }


    // Show form
    grnFormBox.style.display = "block";


    // Generate GRN number
    generateGRNNumber();


    // Set creation date and time
    setCreationDate();


    // Set received date
    setReceivedDate();


    // Clear PO selection
    const poSelect =
        document.getElementById("po_id");

    if (poSelect) {

        poSelect.value = "";

    }


    // Clear supplier
    const supplierName =
        document.getElementById("supplier_name");

    if (supplierName) {

        supplierName.value = "";

    }


    // Clear supplier ID
    const supplierId =
        document.getElementById("supplier_id");

    if (supplierId) {

        supplierId.value = "";

    }


    // Reset summary
    const selectedPONumber =
        document.getElementById("selectedPONumber");

    if (selectedPONumber) {

        selectedPONumber.textContent = "-";

    }


    const selectedSupplierName =
        document.getElementById("selectedSupplierName");

    if (selectedSupplierName) {

        selectedSupplierName.textContent = "-";

    }


    const selectedGRNNumber =
        document.getElementById("selectedGRNNumber");

    if (selectedGRNNumber) {

        selectedGRNNumber.textContent =
            document.getElementById("grn_no")?.value || "-";

    }


    // Clear items
    const grnEntryBody =
        document.getElementById("grnEntryBody");

    if (grnEntryBody) {

        grnEntryBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="text-align:center;"
                >

                    Select a Purchase Order
                    to load items.

                </td>

            </tr>

        `;

    }

}


/* ============================================================
   CLOSE GRN FORM
   ============================================================ */

function closeGRNForm() {

    console.log("Closing GRN form...");

    const grnFormBox =
        document.getElementById("grnFormBox");


    if (!grnFormBox) {

        console.error(
            "ERROR: grnFormBox was not found."
        );

        return;

    }


    grnFormBox.style.display = "none";

}


/* ============================================================
   GENERATE GRN NUMBER
   FORMAT:
   GRN/2026/0001
   GRN/2026/0002
   GRN/2026/0003
   ============================================================ */

function generateGRNNumber() {

    console.log(
        "================================="
    );

    console.log(
        "Generating GRN Number..."
    );

    console.log(
        "================================="
    );


    // ========================================================
    // GRN NUMBER INPUT
    // ========================================================

    const grnInput =
        document.getElementById(
            "grn_no"
        );


    // ========================================================
    // GRN NUMBER SUMMARY DISPLAY
    // ========================================================

    const selectedGRNNumber =
        document.getElementById(
            "selectedGRNNumber"
        );


    // ========================================================
    // CHECK INPUT
    // ========================================================

    if (!grnInput) {

        console.error(
            "ERROR: #grn_no input was not found."
        );

        return;

    }


    // ========================================================
    // SHOW LOADING
    // ========================================================

    grnInput.value =
        "Generating...";


    if (selectedGRNNumber) {

        selectedGRNNumber.textContent =
            "Generating...";

    }


    // ========================================================
    // CALL FLASK API
    //
    // MUST MATCH PYTHON ROUTE:
    //
    // /api/next_grn_number
    //
    // Blueprint prefix:
    // /procurement
    //
    // FINAL URL:
    // /procurement/api/next_grn_number
    // ========================================================

    fetch(
        "/procurement/api/next_grn_number",
        {
            method: "GET",

            headers: {

                "Accept":
                    "application/json"

            }

        }
    )


    // ========================================================
    // CHECK RESPONSE
    // ========================================================

    .then(
        function(response) {

            console.log(
                "GRN Number API Status:",
                response.status
            );


            if (!response.ok) {

                throw new Error(

                    "GRN Number API failed. HTTP Status: " +
                    response.status

                );

            }


            return response.json();

        }
    )


    // ========================================================
    // PROCESS RESPONSE
    // ========================================================

    .then(
        function(data) {

            console.log(
                "GRN Number API Response:",
                data
            );


            // =================================================
            // SUCCESS
            // =================================================

            if (
                data.success === true &&
                data.grn_no
            ) {

                // ---------------------------------------------
                // PUT GRN NUMBER INTO FORM INPUT
                // ---------------------------------------------

                grnInput.value =
                    data.grn_no;


                // ---------------------------------------------
                // UPDATE SUMMARY
                // ---------------------------------------------

                if (
                    selectedGRNNumber
                ) {

                    selectedGRNNumber.textContent =
                        data.grn_no;

                }


                console.log(
                    "GRN Number Generated Successfully:",
                    data.grn_no
                );

            }


            // =================================================
            // API RETURNED ERROR
            // =================================================

            else {

                console.error(
                    "GRN Number was not generated.",
                    data
                );


                grnInput.value =
                    "";


                if (
                    selectedGRNNumber
                ) {

                    selectedGRNNumber.textContent =
                        "-";

                }

            }

        }
    )


    // ========================================================
    // HANDLE ERROR
    // ========================================================

    .catch(
        function(error) {

            console.error(
                "GRN Number Generation Error:",
                error
            );


            // Clear input

            grnInput.value =
                "";


            // Clear summary

            if (
                selectedGRNNumber
            ) {

                selectedGRNNumber.textContent =
                    "-";

            }


            alert(
                "Unable to generate GRN Number. Please try again."
            );

        }
    );

}

/* ============================================================
   SET CREATION DATE AND TIME
   ============================================================ */

function setCreationDate() {

    const creationDateInput =
        document.getElementById(
            "creation_date"
        );


    if (!creationDateInput) {

        console.error(
            "Creation date input not found."
        );

        return;

    }


    const now =
        new Date();


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


    const dateTime =

        `${year}-${month}-${day}T${hours}:${minutes}`;


    creationDateInput.value =
        dateTime;


    console.log(
        "Creation Date:",
        dateTime
    );

}


/* ============================================================
   SET RECEIVED DATE
   ============================================================ */

function setReceivedDate() {

    const receivedDateInput =
        document.getElementById(
            "grnReceived_date"
        );


    if (!receivedDateInput) {

        console.error(
            "Received date input not found."
        );

        return;

    }


    const now =
        new Date();


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


    const today =

        `${year}-${month}-${day}`;


    receivedDateInput.value =
        today;


    console.log(
        "Received Date:",
        today
    );

}


/* ============================================================
   LOAD PURCHASE ORDER FOR GRN
   ============================================================ */

function loadPOForGRN(poId) {

    console.log(
        "================================="
    );

    console.log(
        "Loading PO for GRN"
    );

    console.log(
        "PO ID:",
        poId
    );

    console.log(
        "================================="
    );


    const supplierNameInput =
        document.getElementById(
            "supplier_name"
        );


    const supplierIdInput =
        document.getElementById(
            "supplier_id"
        );


    const grnEntryBody =
        document.getElementById(
            "grnEntryBody"
        );


    // Clear old supplier
    if (supplierNameInput) {

        supplierNameInput.value = "";

    }


    if (supplierIdInput) {

        supplierIdInput.value = "";

    }


    // No PO selected
    if (!poId) {

        if (grnEntryBody) {

            grnEntryBody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        style="text-align:center;"
                    >

                        Select a Purchase Order
                        to load items.

                    </td>

                </tr>

            `;

        }

        return;

    }


    // Show loading
    if (supplierNameInput) {

        supplierNameInput.value =
            "Loading...";

    }


    if (grnEntryBody) {

        grnEntryBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="text-align:center;"
                >

                    Loading Purchase Order items...

                </td>

            </tr>

        `;

    }


    // Update PO summary
    const poSelect =
        document.getElementById("po_id");


    if (poSelect) {

        const selectedOption =
            poSelect.options[
                poSelect.selectedIndex
            ];


        const poText =
            selectedOption
                ? selectedOption.text
                : "-";


        const selectedPONumber =
            document.getElementById(
                "selectedPONumber"
            );


        if (selectedPONumber) {

            selectedPONumber.textContent =
                poText;

        }

    }


    // API URL
    const apiUrl =
        `/procurement/get_po_items/${poId}`;


    console.log(
        "Calling API:",
        apiUrl
    );


    fetch(apiUrl)

        .then(function(response) {

            console.log(
                "API Response Status:",
                response.status
            );


            if (!response.ok) {

                throw new Error(

                    "Server returned HTTP " +
                    response.status

                );

            }


            return response.json();

        })


        .then(function(data) {

            console.log(
                "FULL PO API RESPONSE:",
                data
            );


            if (
                data.success === false
            ) {

                throw new Error(

                    data.message ||
                    "Failed to load Purchase Order."

                );

            }


            // ==========================================
            // GET PO HEADER
            // ==========================================

            const po =
                data.po ||
                data.purchase_order ||
                data.data ||
                data;


            // ==========================================
            // SUPPLIER NAME
            // ==========================================

            const supplierName =

                po.supplier_name ||
                po.supplier ||
                "";


            if (supplierNameInput) {

                supplierNameInput.value =
                    supplierName;

            }


            // Update supplier summary
            const selectedSupplierName =
                document.getElementById(
                    "selectedSupplierName"
                );


            if (selectedSupplierName) {

                selectedSupplierName.textContent =
                    supplierName || "-";

            }


            // ==========================================
            // SUPPLIER ID
            // ==========================================

            if (supplierIdInput) {

                supplierIdInput.value =

                    po.supplier_id ||
                    "";

            }


            // ==========================================
            // FIND ITEMS
            // ==========================================

            let items = [];


            if (
                Array.isArray(data.items)
            ) {

                items =
                    data.items;

            }

            else if (
                data.data &&
                Array.isArray(
                    data.data.items
                )
            ) {

                items =
                    data.data.items;

            }

            else if (
                data.po &&
                Array.isArray(
                    data.po.items
                )
            ) {

                items =
                    data.po.items;

            }

            else if (
                data.purchase_order &&
                Array.isArray(
                    data.purchase_order.items
                )
            ) {

                items =
                    data.purchase_order.items;

            }


            console.log(
                "PO ITEMS FOUND:",
                items
            );


            // Load items
            loadGRNItems(
                items
            );

        })


        .catch(function(error) {

            console.error(
                "ERROR LOADING PO:",
                error
            );


            if (supplierNameInput) {

                supplierNameInput.value =
                    "";

            }


            if (supplierIdInput) {

                supplierIdInput.value =
                    "";

            }


            if (grnEntryBody) {

                grnEntryBody.innerHTML = `

                    <tr>

                        <td
                            colspan="9"
                            style="
                                color:red;
                                text-align:center;
                            "
                        >

                            <strong>
                                Failed to load Purchase Order items.
                            </strong>

                            <br><br>

                            ${escapeHTML(
                                error.message ||
                                "Unknown error"
                            )}

                        </td>

                    </tr>

                `;

            }

        });

}


/* ============================================================
   LOAD GRN ITEMS
   ============================================================ */

function loadGRNItems(items) {

    const tbody =
        document.getElementById(
            "grnEntryBody"
        );


    console.log(
        "Loading GRN items:",
        items
    );


    if (!tbody) {

        console.error(
            "ERROR: grnEntryBody not found."
        );

        return;

    }


    // Clear table
    tbody.innerHTML = "";


    // Check items
    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="text-align:center;"
                >

                    No items found
                    for this Purchase Order.

                </td>

            </tr>

        `;

        return;

    }


    // ==========================================
    // CREATE EACH ROW
    // ==========================================

    items.forEach(
        function(item, index) {

            console.log(
                "Processing PO item:",
                item
            );


            // ==========================================
            // PO ITEM ID
            // ==========================================

            const poItemId =

                item.po_item_id
                ||
                item.purchase_order_item_id
                ||
                item.id
                ||
                "";


            // ==========================================
            // MATERIAL
            // ==========================================

            const material =

                item.item_name
                ||
                item.material
                ||
                item.material_name
                ||
                item.item
                ||
                "";


            // ==========================================
            // DESCRIPTION
            // ==========================================

            const description =

                item.description
                ||
                item.item_description
                ||
                "";


            // ==========================================
            // ORDERED QUANTITY
            // ==========================================

            const orderedQty =

                parseFloat(

                    item.quantity
                    ??
                    item.ordered_qty
                    ??
                    item.order_quantity
                    ??
                    item.quantity_ordered
                    ??
                    0

                );


            // ==========================================
            // ALREADY RECEIVED
            // This comes from Flask API
            // Example: 5
            // ==========================================

            const alreadyReceived =

                parseFloat(

                    item.already_received
                    ??
                    0

                );


            // ==========================================
            // BALANCE BEFORE CURRENT GRN
            //
            // Example:
            // Ordered = 16
            // Already Received = 5
            //
            // Balance = 16 - 5
            //         = 11
            // ==========================================

            let balanceBefore =

                parseFloat(

                    item.balance
                    ??
                    (
                        orderedQty -
                        alreadyReceived
                    )

                );


            // Prevent negative
            if (
                balanceBefore < 0
            ) {

                balanceBefore = 0;

            }


            // ==========================================
            // CREATE TABLE ROW
            // ==========================================

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <!-- ======================================
                     MATERIAL
                ======================================= -->

                <td>

                    <input
                        type="hidden"
                        name="po_item_id[]"
                        value="${escapeHTML(
                            String(poItemId)
                        )}"
                    >

                    <input
                        type="text"
                        name="material_name[]"
                        value="${escapeHTML(
                            String(material)
                        )}"
                        readonly
                    >

                </td>


                <!-- ======================================
                     DESCRIPTION
                ======================================= -->

                <td>

                    <input
                        type="text"
                        name="description[]"
                        value="${escapeHTML(
                            String(description)
                        )}"
                        readonly
                    >

                </td>


                <!-- ======================================
                     ORDERED QUANTITY
                ======================================= -->

                <td>

                    <input
                        type="number"
                        name="quantity_ordered[]"
                        class="ordered-qty"
                        value="${orderedQty.toFixed(2)}"
                        readonly
                    >

                </td>


                <!-- ======================================
                     ALREADY RECEIVED
                ======================================= -->

                <td>

                    <input
                        type="number"
                        name="already_received[]"
                        class="already-received"
                        value="${alreadyReceived.toFixed(2)}"
                        readonly
                    >

                </td>


                <!-- ======================================
                     BALANCE BEFORE CURRENT GRN
                ======================================= -->

                <td>

                    <input
                        type="number"
                        name="balance_before[]"
                        class="balance-before"
                        value="${balanceBefore.toFixed(2)}"
                        readonly
                    >

                </td>


                <!-- ======================================
                     RECEIVE NOW
                ======================================= -->

                <td>

                    <input
                        type="number"
                        name="quantity_received[]"
                        class="received-qty"
                        min="0"
                        max="${balanceBefore}"
                        value="0"
                        step="0.01"
                        oninput="calculateGRNRow(this.closest('tr'))"
                    >

                </td>


                <!-- ======================================
                     REJECTED NOW
                ======================================= -->

                <td>

                    <input
                        type="number"
                        name="quantity_rejected[]"
                        class="rejected-qty"
                        min="0"
                        max="${balanceBefore}"
                        value="0"
                        step="0.01"
                        oninput="calculateGRNRow(this.closest('tr'))"
                    >

                </td>


                <!-- ======================================
                     REMAINING BALANCE
                ======================================= -->

                <td>

                    <input
                        type="number"
                        name="quantity_balance[]"
                        class="balance-qty"
                        value="${balanceBefore.toFixed(2)}"
                        readonly
                    >

                </td>


                <!-- ======================================
                     REMARKS
                ======================================= -->

                <td>

                    <input
                        type="text"
                        name="remarks[]"
                        class="grn-remark"
                        value="${
                            balanceBefore > 0
                            ? "NOT RECEIVED"
                            : "FULLY RECEIVED"
                        }"
                        readonly
                    >

                </td>

            `;


            // Append row
            tbody.appendChild(
                row
            );

        }
    );


    console.log(
        "Successfully loaded",
        items.length,
        "PO items."
    );

}


/* ============================================================
   CALCULATE GRN ROW
   ============================================================

   Formula:

   Balance Before GRN
       =
   Ordered Qty - Already Received

   Remaining Balance
       =
   Balance Before GRN
   - Receive Now
   - Rejected Qty

   ============================================================ */
function calculateGRNRow(row) {

    // ==========================================
    // BALANCE BEFORE THIS GRN
    //
    // Balance Before should already be calculated
    // by the API/database:
    //
    // Ordered - Already Received
    //
    // Example:
    // Ordered = 16
    // Already Received = 5
    // Balance Before = 11
    // ==========================================

    const balanceBeforeInput =
        row.querySelector(".balance-before");

    const balanceBefore =
        parseFloat(
            balanceBeforeInput?.value
        ) || 0;


    // ==========================================
    // RECEIVE NOW
    //
    // This is the quantity successfully received
    // in the CURRENT GRN only.
    // ==========================================

    const receivedInput =
        row.querySelector(".received-qty");

    let receivedNow =
        parseFloat(
            receivedInput?.value
        ) || 0;


    // ==========================================
    // REJECTED NOW
    //
    // This is the quantity rejected in the
    // CURRENT GRN only.
    //
    // Rejected quantity is NOT added to
    // Already Received.
    // ==========================================

    const rejectedInput =
        row.querySelector(".rejected-qty");

    let rejectedQty =
        parseFloat(
            rejectedInput?.value
        ) || 0;


    // ==========================================
    // PREVENT NEGATIVE RECEIVE QUANTITY
    // ==========================================

    if (receivedNow < 0) {

        receivedNow = 0;

        if (receivedInput) {

            receivedInput.value = 0;

        }

    }


    // ==========================================
    // PREVENT NEGATIVE REJECTED QUANTITY
    // ==========================================

    if (rejectedQty < 0) {

        rejectedQty = 0;

        if (rejectedInput) {

            rejectedInput.value = 0;

        }

    }


    // ==========================================
    // TOTAL PROCESSED IN THIS GRN
    //
    // Example:
    // Receive Now = 5
    // Rejected = 2
    //
    // Total Processed = 7
    //
    // Both quantities consume the available
    // PO balance, but only Receive Now increases
    // Already Received.
    // ==========================================

    let totalProcessed =
        receivedNow +
        rejectedQty;


    // ==========================================
    // CANNOT PROCESS MORE THAN BALANCE
    // ==========================================

    if (
        totalProcessed >
        balanceBefore
    ) {

        alert(
            "Receive Now + Rejected Qty cannot be greater than the available balance of " +
            balanceBefore.toFixed(2)
        );


        // ======================================
        // RESET ONLY THE FIELD BEING EDITED
        // ======================================

        if (
            document.activeElement ===
            rejectedInput
        ) {

            if (rejectedInput) {

                rejectedInput.value = 0;

            }

        }

        else {

            if (receivedInput) {

                receivedInput.value = 0;

            }

        }


        // ======================================
        // GET UPDATED VALUES AFTER RESET
        // ======================================

        receivedNow =
            parseFloat(
                receivedInput?.value
            ) || 0;


        rejectedQty =
            parseFloat(
                rejectedInput?.value
            ) || 0;


        totalProcessed =
            receivedNow +
            rejectedQty;

    }


    // ==========================================
    // CALCULATE REMAINING BALANCE
    //
    // Example:
    //
    // Balance Before = 11
    // Receive Now = 5
    // Rejected = 2
    //
    // Remaining = 11 - 5 - 2
    //           = 4
    // ==========================================

    const remainingBalance =
        Math.max(
            0,
            balanceBefore -
            receivedNow -
            rejectedQty
        );


    // ==========================================
    // UPDATE REMAINING BALANCE
    // ==========================================

    const remainingBalanceInput =
        row.querySelector(
            ".remaining-balance"
        );


    if (
        remainingBalanceInput
    ) {

        remainingBalanceInput.value =
            remainingBalance.toFixed(2);

    }


    // ==========================================
    // UPDATE REMARKS
    // ==========================================

    const remarksInput =
        row.querySelector(
            ".grn-remark"
        );


    if (
        remarksInput
    ) {

        // --------------------------------------
        // NOTHING RECEIVED OR REJECTED
        // --------------------------------------

        if (
            receivedNow === 0 &&
            rejectedQty === 0
        ) {

            remarksInput.value =
                "NOT RECEIVED";

        }


        // --------------------------------------
        // FULLY PROCESSED WITH REJECTION
        //
        // Example:
        // Balance Before = 11
        // Receive Now = 9
        // Rejected = 2
        // Remaining = 0
        // --------------------------------------

        else if (
            remainingBalance === 0 &&
            rejectedQty > 0
        ) {

            remarksInput.value =
                "FULLY PROCESSED - " +
                rejectedQty +
                " REJECTED";

        }


        // --------------------------------------
        // FULLY RECEIVED
        // --------------------------------------

        else if (
            remainingBalance === 0
        ) {

            remarksInput.value =
                "FULLY RECEIVED";

        }


        // --------------------------------------
        // PARTIALLY RECEIVED WITH REJECTION
        // --------------------------------------

        else if (
            rejectedQty > 0
        ) {

            remarksInput.value =
                "PARTIALLY RECEIVED - " +
                rejectedQty +
                " REJECTED";

        }


        // --------------------------------------
        // PARTIALLY RECEIVED
        // --------------------------------------

        else {

            remarksInput.value =
                "PARTIALLY RECEIVED";

        }

    }

}

/* ============================================================
   VALIDATE GRN FORM BEFORE SUBMIT
   ============================================================ */

function validateGRNForm() {

    // ==========================================
    // PO
    // ==========================================

    const poSelect =
        document.getElementById(
            "po_id"
        );


    // ==========================================
    // SUPPLIER
    // ==========================================

    const supplierId =
        document.getElementById(
            "supplier_id"
        );


    // ==========================================
    // GRN NUMBER
    // ==========================================

    const grnNumber =
        document.getElementById(
            "grn_no"
        );


    // ==========================================
    // RECEIVED DATE
    // ==========================================

    const receivedDate =
        document.getElementById(
            "grnReceived_date"
        );


    // ==========================================
    // CHECK PO
    // ==========================================

    if (
        !poSelect ||
        !poSelect.value
    ) {

        alert(
            "Please select a Purchase Order."
        );

        return false;

    }


    // ==========================================
    // CHECK SUPPLIER
    // ==========================================

    if (
        !supplierId ||
        !supplierId.value
    ) {

        alert(
            "Supplier information was not loaded."
        );

        return false;

    }


    // ==========================================
    // CHECK GRN NUMBER
    // ==========================================

    if (
        !grnNumber ||
        !grnNumber.value
    ) {

        alert(
            "GRN Number is missing."
        );

        return false;

    }


    // ==========================================
    // CHECK RECEIVED DATE
    // ==========================================

    if (
        !receivedDate ||
        !receivedDate.value
    ) {

        alert(
            "Please select the Received Date."
        );

        return false;

    }


    // ==========================================
    // GET ITEM ROWS
    // ==========================================

    const rows =
        document.querySelectorAll(
            "#grnEntryBody tr"
        );


    if (
        rows.length === 0
    ) {

        alert(
            "No Purchase Order items found."
        );

        return false;

    }


    // ==========================================
    // CHECK ITEMS
    // ==========================================

    let hasProcessedItem =
        false;


    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i];


        const balanceBeforeInput =
            row.querySelector(
                ".balance-before"
            );


        const receivedInput =
            row.querySelector(
                ".received-qty"
            );


        const rejectedInput =
            row.querySelector(
                ".rejected-qty"
            );


        const balanceInput =
            row.querySelector(
                ".balance-qty"
            );


        // Skip invalid rows
        if (
            !balanceBeforeInput ||
            !receivedInput ||
            !rejectedInput ||
            !balanceInput
        ) {

            continue;

        }


        const balanceBefore =

            parseFloat(
                balanceBeforeInput.value
            )
            ||
            0;


        const receivedNow =

            parseFloat(
                receivedInput.value
            )
            ||
            0;


        const rejectedQty =

            parseFloat(
                rejectedInput.value
            )
            ||
            0;


        const remainingBalance =

            parseFloat(
                balanceInput.value
            )
            ||
            0;


        // ==========================================
        // CHECK NEGATIVE
        // ==========================================

        if (
            receivedNow < 0 ||
            rejectedQty < 0
        ) {

            alert(

                `Invalid quantity on item ${i + 1}.`

            );

            return false;

        }


        // ==========================================
        // CHECK TOTAL PROCESSED
        // ==========================================

        if (
            receivedNow +
            rejectedQty >
            balanceBefore
        ) {

            alert(

                `For item ${i + 1}, Receive Now + Rejected Qty ` +
                `cannot exceed the available balance of ` +
                `${balanceBefore.toFixed(2)}.`

            );


            return false;

        }


        // ==========================================
        // CHECK REMAINING BALANCE
        // ==========================================

        const calculatedBalance =

            balanceBefore -
            receivedNow -
            rejectedQty;


        if (
            Math.abs(
                remainingBalance -
                calculatedBalance
            ) > 0.01
        ) {

            balanceInput.value =

                calculatedBalance.toFixed(2);

        }


        // ==========================================
        // AT LEAST ONE PROCESSED
        // ==========================================

        if (
            receivedNow > 0 ||
            rejectedQty > 0
        ) {

            hasProcessedItem =
                true;

        }

    }


    // ==========================================
    // REQUIRE RECEIVED OR REJECTED
    // ==========================================

    if (
        !hasProcessedItem
    ) {

        alert(

            "Please enter either Receive Now or Rejected Qty for at least one item."

        );

        return false;

    }


    // ==========================================
    // FORM VALID
    // ==========================================

    console.log(
        "GRN form validation successful."
    );


    return true;

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHTML(value) {

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


/* =========================================================
   GRN MANAGEMENT - LOAD APPROVED PURCHASE ORDERS
   Connects JavaScript frontend to Flask backend
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    console.log("GRN JavaScript initialized.");

    loadApprovedPOs();
});


/* =========================================================
   LOAD APPROVED PURCHASE ORDERS FROM FLASK
   ========================================================= */

async function loadApprovedPOs() {
    const poSelect = document.getElementById("po_id");

    if (!poSelect) {
        console.error("PO dropdown #po_id was not found.");
        return;
    }

    poSelect.innerHTML = `
        <option value="">Loading approved Purchase Orders...</option>
    `;

    poSelect.disabled = true;

    try {
        const response = await fetch(
            "/procurement/api/approved_pos",
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Server error: HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success !== true) {
            throw new Error(
                data.message || "Failed to load approved Purchase Orders."
            );
        }

        const pos = Array.isArray(data.data) ? data.data : [];

        poSelect.innerHTML = `
            <option value="">-- Select Approved PO --</option>
        `;

        if (pos.length === 0) {
            poSelect.innerHTML = `
                <option value="">No approved Purchase Orders available</option>
            `;
            console.log("No approved POs were returned by Flask.");
            return;
        }

        pos.forEach(function (po) {
            const option = document.createElement("option");

            option.value = po.purchase_order_id;

            option.textContent =
                `${po.po_number} - ${po.supplier_name || "Unknown Supplier"}`;

            poSelect.appendChild(option);
        });

        console.log(`${pos.length} approved Purchase Orders loaded.`);

    } catch (error) {
        console.error("Error loading approved POs:", error);

        poSelect.innerHTML = `
            <option value="">Failed to load approved POs</option>
        `;

    } finally {
        poSelect.disabled = false;
    }
}


/* =========================================================
   LOAD SELECTED PO DETAILS AND ITEMS
   Uses your existing loadPOForGRN() function
   ========================================================= */

function handlePOSelection() {
    const poSelect = document.getElementById("po_id");

    if (!poSelect) {
        return;
    }

    const poId = poSelect.value;

    if (!poId) {
        return;
    }

    if (typeof loadPOForGRN === "function") {
        loadPOForGRN(poId);
    } else {
        console.error(
            "loadPOForGRN() was not found. Check your JavaScript files."
        );
    }
}