
// =========================
// SAVE PAYMENT
// =========================
// =========================
// SAVE PAYMENT
// =========================
async function savePayment() {

    // ==========================================
    // GET VALUES
    // ==========================================

    const invoiceId =
        document.getElementById("cp_invoice").value;

    const paymentMethod =
        document.getElementById("cp_method").value;

    const invoiceTotal =
        parseFloat(
            document.getElementById("cp_amount").value
        ) || 0;

    const previousPaid =
        parseFloat(
            document.getElementById("cp_previous_paid").value
        ) || 0;

    const amountPaid =
        parseFloat(
            document.getElementById("cp_amountpaid").value
        ) || 0;

    const paymentDate =
        document.getElementById("cp_date").value;

    const remarks =
        document.getElementById("cp_remarks").value;


    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!invoiceId) {
        alert("Please select an invoice.");
        return;
    }

    if (!paymentMethod) {
        alert("Please select a payment method.");
        return;
    }

    if (invoiceTotal <= 0) {
        alert("Invalid invoice amount.");
        return;
    }

    if (amountPaid <= 0) {
        alert("Please enter a valid amount paid.");
        return;
    }

    if (!paymentDate) {
        alert("Payment date is required.");
        return;
    }


    // ==========================================
    // CURRENT OUTSTANDING BALANCE
    // ==========================================

    const currentBalance =
        Math.max(
            invoiceTotal - previousPaid,
            0
        );


    // ==========================================
    // IMPORTANT:
    // IF CURRENT BALANCE IS 0,
    // NO PAYMENT IS ALLOWED
    // ==========================================

    if (currentBalance === 0) {

        alert(
            "PAYMENT NOT ALLOWED\n\n" +
            "This invoice has already been fully paid.\n\n" +
            "Invoice Total: " +
            invoiceTotal.toFixed(2) +
            "\nPreviously Paid: " +
            previousPaid.toFixed(2) +
            "\nCurrent Balance: 0.00"
        );

        return;
    }


    // ==========================================
    // PREVENT OVERPAYMENT
    // ==========================================

    if (amountPaid > currentBalance) {

        alert(
            "PAYMENT NOT ALLOWED\n\n" +
            "The payment amount cannot exceed the current invoice balance.\n\n" +
            "Current Balance: " +
            currentBalance.toFixed(2) +
            "\nAmount Entered: " +
            amountPaid.toFixed(2)
        );

        return;
    }


    // ==========================================
    // CALCULATE NEW BALANCE
    // ==========================================

    let newBalance =
        currentBalance - amountPaid;

    // Never allow negative balance
    newBalance = Math.max(newBalance, 0);


    // ==========================================
    // UPDATE DISPLAYED BALANCE
    // ==========================================

    document.getElementById("cp_balance").value =
        newBalance.toFixed(2);


    // ==========================================
    // PREPARE DATA
    // ==========================================

    const data = {

        invoice_id: invoiceId,

        payment_method: paymentMethod,

        amount: invoiceTotal.toFixed(2),

        amount_paid: amountPaid.toFixed(2),

        balance: newBalance.toFixed(2),

        payment_date: paymentDate,

        remarks: remarks
    };


    console.log("PAYMENT DATA:", data);

    console.log(
        "CURRENT BALANCE:",
        currentBalance
    );

    console.log(
        "NEW BALANCE:",
        newBalance
    );


    // ==========================================
    // SEND TO FLASK
    // ==========================================

    try {

        const response = await fetch(
            "/finance/create_payment",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        // ==========================================
        // READ RESPONSE
        // ==========================================

        const text =
            await response.text();

        console.log(
            "CREATE PAYMENT HTTP STATUS:",
            response.status
        );

        console.log(
            "CREATE PAYMENT RESPONSE:",
            text
        );


        let result;

        try {

            result =
                JSON.parse(text);

        } catch (jsonError) {

            console.error(
                "Server did not return JSON:",
                text
            );

            alert(
                "Server error while creating payment.\n\n" +
                "HTTP Status: " +
                response.status +
                "\n\n" +
                "Check the Flask terminal for the real error."
            );

            return;
        }


        // ==========================================
        // SERVER ERROR
        // ==========================================

        if (!response.ok) {

            alert(
                result.message ||
                result.error ||
                `Failed to create payment. HTTP ${response.status}`
            );

            return;
        }


        // ==========================================
        // SUCCESS
        // ==========================================

        if (result.success) {

            alert(
                "Payment Created Successfully!\n\n" +
                "Payment No: " +
                (result.payment_no || "N/A") +
                "\nAmount Paid: " +
                amountPaid.toFixed(2) +
                "\nRemaining Balance: " +
                newBalance.toFixed(2)
            );


            // Clear form
            document.getElementById(
                "cp_amountpaid"
            ).value = "";

            document.getElementById(
                "cp_balance"
            ).value = "";

            document.getElementById(
                "cp_invoice"
            ).value = "";

            document.getElementById(
                "cp_supplier"
            ).value = "";

            document.getElementById(
                "cp_amount"
            ).value = "";

            document.getElementById(
                "cp_previous_paid"
            ).value = "0";

            if (
                document.getElementById(
                    "cp_outstanding"
                )
            ) {
                document.getElementById(
                    "cp_outstanding"
                ).value = "0.00";
            }


            // Generate next payment number
            loadPaymentNo();


            // Redirect
            window.location.href =
                "/finance/dashboard";

        } else {

            alert(
                result.message ||
                "Failed to create payment."
            );
        }


    } catch (error) {

        console.error(
            "SAVE PAYMENT ERROR:",
            error
        );

        alert(
            "Unable to connect to the payment server.\n\n" +
            error.message
        );
    }
}

// =========================
// PAYMENT TABLE SEARCH
// =========================
function searchPayments() {
    let input = document.getElementById("paymentSearch").value.toLowerCase();
    let rows = document.querySelectorAll("#paymentTable tbody tr");

    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
    });
}


// =========================
// UI CONTROLS
// =========================
document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // SET CURRENT DATE
    // ==========================================

    setPaymentCurrentDate();

});


function setPaymentCurrentDate() {

    const dateField = document.getElementById("cp_date");

    if (!dateField) {
        console.warn("Created Date field #cp_date was not found.");
        return;
    }

    const today = new Date();

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const currentDate = `${yyyy}-${mm}-${dd}`;

    dateField.value = currentDate;
}


// ==========================================
// SHOW CREATE PAYMENT FORM
// ==========================================

function showCreatePaymentForm() {

    const form = document.getElementById("createPaymentForm");

    if (!form) {
        console.error("Create Payment form not found.");
        return;
    }

    // Show form
    form.style.display = "block";

    // ALWAYS set today's date when opening the form
    setPaymentCurrentDate();

    console.log("Create Payment form opened.");
}

function hideCreatePaymentForm() {
    document.getElementById("createPaymentForm").style.display = "none";
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
    loadPaymentNo();
    loadInvoices();
});




// =========================
// BALANCE CALCULATION
// =========================
// ============================================================
// CALCULATE PAYMENT BALANCE
// ============================================================
function calculateBalance() {

    const invoiceTotal =
        parseFloat(document.getElementById("cp_amount").value) || 0;

    const previousPaid =
        parseFloat(document.getElementById("cp_previous_paid").value) || 0;

    let amountPaid =
        parseFloat(document.getElementById("cp_amountpaid").value) || 0;

    // Calculate outstanding amount before this payment
    const outstanding =
        Math.max(invoiceTotal - previousPaid, 0);

    // If payment is greater than outstanding balance
    if (amountPaid > outstanding) {

        alert(
            "Payment amount cannot be greater than the outstanding balance.\n\n" +
            "Outstanding Balance: " + outstanding.toFixed(2)
        );

        // Automatically reduce payment to maximum allowed
        amountPaid = outstanding;

        document.getElementById("cp_amountpaid").value =
            outstanding.toFixed(2);
    }

    // Calculate balance after payment
    let balance =
        outstanding - amountPaid;

    // NEVER allow negative balance
    balance = Math.max(balance, 0);

    // Display outstanding before payment
    document.getElementById("cp_outstanding").value =
        outstanding.toFixed(2);

    // Display final balance
    document.getElementById("cp_balance").value =
        balance.toFixed(2);
}




// =========================
// WHEN INVOICE CHANGES
// =========================
// =========================
// WHEN INVOICE CHANGES
// =========================
async function onInvoiceChange() {

    const invoiceSelect =
        document.getElementById("cp_invoice");

    const invoiceId = invoiceSelect.value;


    // ==========================================
    // NO INVOICE SELECTED
    // ==========================================

    if (!invoiceId) {

        document.getElementById("cp_supplier").value = "";
        document.getElementById("cp_amount").value = "";
        document.getElementById("cp_prs").value = "";
        document.getElementById("cp_po").value = "";

        if (document.getElementById("cp_previous_paid")) {
            document.getElementById("cp_previous_paid").value = "0.00";
        }

        if (document.getElementById("cp_outstanding")) {
            document.getElementById("cp_outstanding").value = "0.00";
        }

        if (document.getElementById("cp_balance")) {
            document.getElementById("cp_balance").value = "0.00";
        }

        if (document.getElementById("cp_amountpaid")) {
            document.getElementById("cp_amountpaid").value = "";
        }

        return;
    }


    // ==========================================
    // LOAD INVOICE INFORMATION
    // ==========================================

    try {

        const response = await fetch(
            `/finance/api/invoice/${invoiceId}`,
            {
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const text = await response.text();

        console.log(
            "INVOICE API STATUS:",
            response.status
        );

        console.log(
            "INVOICE API RESPONSE:",
            text
        );


        // ==========================================
        // PARSE RESPONSE
        // ==========================================

        let data;

        try {

            data = JSON.parse(text);

        } catch (error) {

            console.error(
                "Invoice API returned non-JSON:",
                text
            );

            alert(
                "Invoice API returned an invalid response.\n\n" +
                "HTTP Status: " +
                response.status
            );

            invoiceSelect.value = "";

            return;
        }


        // ==========================================
        // API ERROR
        // ==========================================

        if (!response.ok) {

            alert(
                data.message ||
                data.error ||
                "Failed to load invoice."
            );

            invoiceSelect.value = "";

            return;
        }


        if (data.success === false) {

            alert(
                data.message ||
                "Invoice not found."
            );

            invoiceSelect.value = "";

            return;
        }


        // ==========================================
        // GET INVOICE TOTAL
        // ==========================================

        const invoiceTotal =
            parseFloat(data.total_amount) || 0;


        const previousPaid =
            parseFloat(data.previous_paid) || 0;


        // ==========================================
        // GET CURRENT BALANCE
        // ==========================================

        let currentBalance;

        if (
            data.balance !== undefined &&
            data.balance !== null
        ) {

            currentBalance =
                parseFloat(data.balance) || 0;

        } else if (
            data.outstanding_balance !== undefined &&
            data.outstanding_balance !== null
        ) {

            currentBalance =
                parseFloat(data.outstanding_balance) || 0;

        } else {

            currentBalance =
                invoiceTotal - previousPaid;
        }


        // Never allow negative balance
        currentBalance =
            Math.max(currentBalance, 0);


        // ==========================================
        // CHECK IF INVOICE IS ALREADY PAID
        // ==========================================

        if (currentBalance <= 0) {

            alert(
                "INVOICE ALREADY PAID\n\n" +
                "Invoice: " +
                (data.invoice_number || invoiceId) +
                "\n\n" +
                "This invoice has no outstanding balance.\n" +
                "No payment can be created for this invoice."
            );


            // IMPORTANT:
            // Do NOT load invoice details

            invoiceSelect.value = "";


            // Clear form fields

            document.getElementById(
                "cp_supplier"
            ).value = "";

            document.getElementById(
                "cp_amount"
            ).value = "";

            document.getElementById(
                "cp_prs"
            ).value = "";

            document.getElementById(
                "cp_po"
            ).value = "";


            if (
                document.getElementById(
                    "cp_previous_paid"
                )
            ) {
                document.getElementById(
                    "cp_previous_paid"
                ).value = "0.00";
            }


            if (
                document.getElementById(
                    "cp_outstanding"
                )
            ) {
                document.getElementById(
                    "cp_outstanding"
                ).value = "0.00";
            }


            if (
                document.getElementById(
                    "cp_amountpaid"
                )
            ) {
                document.getElementById(
                    "cp_amountpaid"
                ).value = "";
            }


            if (
                document.getElementById(
                    "cp_balance"
                )
            ) {
                document.getElementById(
                    "cp_balance"
                ).value = "0.00";
            }


            return;
        }


        // ==========================================
        // ONLY NOW LOAD THE INVOICE
        // ==========================================

        document.getElementById(
            "cp_supplier"
        ).value =
            data.supplier_name || "-";


        document.getElementById(
            "cp_amount"
        ).value =
            invoiceTotal.toFixed(2);


        document.getElementById(
            "cp_prs"
        ).value =
            data.prs_no || "-";


        document.getElementById(
            "cp_po"
        ).value =
            data.po_number || "-";


        if (
            document.getElementById(
                "cp_previous_paid"
            )
        ) {

            document.getElementById(
                "cp_previous_paid"
            ).value =
                previousPaid.toFixed(2);
        }


        if (
            document.getElementById(
                "cp_outstanding"
            )
        ) {

            document.getElementById(
                "cp_outstanding"
            ).value =
                currentBalance.toFixed(2);
        }


        if (
            document.getElementById(
                "cp_balance"
            )
        ) {

            document.getElementById(
                "cp_balance"
            ).value =
                currentBalance.toFixed(2);
        }


        // ==========================================
        // CALCULATE PAYMENT BALANCE
        // ==========================================

        calculateBalance();


    } catch (error) {

        console.error(
            "Invoice load error:",
            error
        );

        alert(
            "Unable to load invoice information."
        );

        invoiceSelect.value = "";
    }
}



// ============================================================
// LOAD NEXT PAYMENT NUMBER
// ============================================================
async function loadPaymentNo() {

    try {

        const response = await fetch("/finance/next_payment_no", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        const text = await response.text();

        console.log("NEXT PAYMENT NO STATUS:", response.status);
        console.log("NEXT PAYMENT NO RESPONSE:", text);

        let data;

        try {
            data = JSON.parse(text);
        } catch (error) {

            console.error(
                "Next payment number returned invalid JSON:",
                text
            );

            document.getElementById("cp_payment_no").value = "";

            return;
        }

        if (!response.ok || !data.success) {

            console.error(
                "Payment No Error:",
                data.message || data.error
            );

            document.getElementById("cp_payment_no").value = "";

            return;
        }

        // ====================================================
        // SET PAYMENT NUMBER
        // ====================================================
        document.getElementById("cp_payment_no").value =
            data.payment_no || "";

        console.log(
            "NEXT PAYMENT NUMBER:",
            data.payment_no
        );

    } catch (error) {

        console.error(
            "Payment No Error:",
            error
        );

        const field = document.getElementById("cp_payment_no");

        if (field) {
            field.value = "";
        }
    }
}



// ============================================================
// LOAD NEXT PAYMENT NUMBER
// ============================================================
async function loadPaymentNo() {

    const paymentNoField = document.getElementById("cp_payment_no");

    if (!paymentNoField) {
        console.error("ERROR: cp_payment_no field does not exist.");
        return;
    }

    try {

        const response = await fetch("/finance/next_payment_no", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        const text = await response.text();

        console.log("Payment No HTTP Status:", response.status);
        console.log("Payment No Response:", text);

        let data;

        try {
            data = JSON.parse(text);
        } catch (error) {

            console.error(
                "Payment No API did not return JSON:",
                text
            );

            paymentNoField.value = "";
            return;
        }

        if (!response.ok) {

            console.error(
                "Payment No API Error:",
                data.message || data.error
            );

            paymentNoField.value = "";
            return;
        }

        if (!data.payment_no) {

            console.error(
                "payment_no is missing from API response:",
                data
            );

            paymentNoField.value = "";
            return;
        }

        // ============================================
        // PUT PAYMENT NUMBER INTO THE FORM
        // ============================================
        paymentNoField.value = data.payment_no;

        console.log(
            "Payment Number Loaded:",
            data.payment_no
        );

    } catch (error) {

        console.error(
            "Payment No Error:",
            error
        );

        paymentNoField.value = "";
    }
}