
/*****************************************************************
    QUOTATION REQUEST (QRF) MODULE
    Automatically load items from the selected approved PRS
*****************************************************************/

const qrfUOMs = [
    "pcs", "kg", "g", "mg", "ltr", "ml", "box", "pack",
    "bag", "bottle", "roll", "ream", "sheet", "pair",
    "set", "dozen", "bundle", "meter", "cm", "sqm"
];

const QRF_ITEMS_URL = "/procurement/api/requisition";
const QRF_SAVE_URL = "/procurement/save_qrf";

let qrfLoadRequestNumber = 0;

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById("quotationRequestDate");
    const prsSelect = document.getElementById("quotationRequestPRS");

    if (dateInput && !dateInput.value) {
        const today = new Date();
        dateInput.value = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");
    }

    generateQRF();

    if (prsSelect) {
        // Load items whenever a PRS is selected.
        prsSelect.addEventListener("change", loadQRFItems);

        // Also load items if a PRS is already selected.
        if (prsSelect.value) {
            loadQRFItems();
        }
    } else {
        console.error("QRF: quotationRequestPRS dropdown was not found.");
    }
});

// =====================================================
// GENERATE QRF NUMBER
// =====================================================

function generateQRF() {
    const input = document.getElementById("quotationRequestNumber");

    if (!input || input.value.trim()) {
        return;
    }

    const year = new Date().getFullYear();
    const storageKey = `qrf_counter_${year}`;

    let counter = parseInt(localStorage.getItem(storageKey) || "0", 10);

    if (!Number.isFinite(counter) || counter < 0) {
        counter = 0;
    }

    counter += 1;
    localStorage.setItem(storageKey, String(counter));

    input.value = `QRF/${year}/${String(counter).padStart(4, "0")}`;
}

// =====================================================
// DISPLAY TABLE MESSAGE
// =====================================================

function showQRFItemsMessage(message) {
    const tbody = document.getElementById("quotationRequestItemsBody");

    if (!tbody) {
        console.error("QRF: quotationRequestItemsBody was not found.");
        return;
    }

    tbody.replaceChildren();
    tbody.dataset.loadedFor = "";
    tbody.dataset.itemCount = "0";

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 4;
    cell.textContent = message;

    row.appendChild(cell);
    tbody.appendChild(row);
}

// =====================================================
// LOAD ITEMS FROM SELECTED PRS
// Flask route:
// GET /procurement/api/requisition/<id>/items
// =====================================================

async function loadQRFItems() {
    const prsSelect = document.getElementById("quotationRequestPRS");
    const tbody = document.getElementById("quotationRequestItemsBody");

    if (!prsSelect || !tbody) {
        console.error("QRF: PRS dropdown or items table is missing.");
        return;
    }

    const requisitionId = prsSelect.value;
    const requestNumber = ++qrfLoadRequestNumber;

    tbody.dataset.loadedFor = "";
    tbody.dataset.itemCount = "0";

    if (!requisitionId) {
        showQRFItemsMessage("Select a PRS to load its items.");
        return;
    }

    showQRFItemsMessage("Loading PRS items...");

    const url =
        `${QRF_ITEMS_URL}/${encodeURIComponent(requisitionId)}/items`;

    console.log("QRF: Requesting items from:", url);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            credentials: "same-origin"
        });

        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error("QRF: Expected JSON but received:", {
                url: response.url,
                status: response.status,
                response: responseText.substring(0, 1000)
            });

            throw new Error(
                `The item API returned HTTP ${response.status}, not JSON. ` +
                `Check this URL: ${response.url}`
            );
        }

        if (requestNumber !== qrfLoadRequestNumber) {
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                `Failed to load PRS items. HTTP ${response.status}.`
            );
        }

        if (!Array.isArray(result.items) || result.items.length === 0) {
            showQRFItemsMessage("No items found for this PRS.");
            return;
        }

        tbody.replaceChildren();

        result.items.forEach(function (item) {
            const row = document.createElement("tr");
            row.dataset.itemRow = "true";

            // Material Name
            const materialCell = document.createElement("td");
            materialCell.textContent = item.material_name ?? "";
            row.appendChild(materialCell);

            // Description
            const descriptionCell = document.createElement("td");
            descriptionCell.textContent = item.description ?? "";
            row.appendChild(descriptionCell);

            // Quantity from requisition_items.qty_required
            const quantityCell = document.createElement("td");
            quantityCell.textContent = item.qty_required ?? "";
            row.appendChild(quantityCell);

            // Unit of Measure
            const uomCell = document.createElement("td");
            uomCell.textContent = item.uom ?? "";
            row.appendChild(uomCell);

            tbody.appendChild(row);
        });

        tbody.dataset.loadedFor = String(requisitionId);
        tbody.dataset.itemCount = String(result.items.length);

        console.log(
            `QRF: Loaded ${result.items.length} item(s) for PRS ${requisitionId}.`
        );

    } catch (error) {
        if (requestNumber !== qrfLoadRequestNumber) {
            return;
        }

        console.error("QRF ITEM LOADING ERROR:", error);
        showQRFItemsMessage(error.message);
        alert(error.message);
    }
}

// =====================================================
// ADD / REMOVE ITEMS
// Items must come from the selected PRS.
// =====================================================

function addQRFItem() {
    alert("Select a PRS to load its items automatically.");
}

function removeQRFItem(button) {
    alert("Items copied from the PRS cannot be removed here.");
}

// =====================================================
// SAVE QRF
// Flask copies the items from the selected PRS.
// =====================================================

async function saveQRF() {
    const qrfInput = document.getElementById("quotationRequestNumber");
    const dateInput = document.getElementById("quotationRequestDate");
    const prsInput = document.getElementById("quotationRequestPRS");
    const supplierInput = document.getElementById("quotationRequestSupplier");
    const tbody = document.getElementById("quotationRequestItemsBody");

    if (!qrfInput || !dateInput || !prsInput || !supplierInput || !tbody) {
        alert("A required QRF form field or the items table could not be found.");
        return;
    }

    const qrfNo = qrfInput.value.trim();
    const submissionDate = dateInput.value;
    const requisitionId = prsInput.value;
    const supplierId = supplierInput.value;

    if (!qrfNo || !submissionDate || !requisitionId || !supplierId) {
        alert("Please complete the QRF number, date, PRS and supplier.");
        return;
    }

    const itemCount = Number(tbody.dataset.itemCount || "0");
    const loadedFor = tbody.dataset.loadedFor || "";

    if (
        loadedFor !== String(requisitionId) ||
        itemCount < 1 ||
        tbody.querySelectorAll("tr[data-item-row='true']").length < 1
    ) {
        alert("Please select a PRS and wait for its items to load successfully.");
        return;
    }

    const payload = {
        qrf_no: qrfNo,
        submission_date: submissionDate,
        requisition_id: requisitionId,
        supplier_id: supplierId
    };

    const form = document.getElementById("quotationRequestCreateForm");
    const saveButton = form
        ? form.querySelector('button[onclick="saveQRF()"]') ||
          form.querySelector('button[type="submit"]')
        : null;

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {
        const response = await fetch(QRF_SAVE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error("QRF SAVE: Expected JSON but received:", {
                url: response.url,
                status: response.status,
                response: responseText.substring(0, 1000)
            });

            throw new Error(
                `Saving QRF returned HTTP ${response.status}, not JSON. ` +
                `Check: ${response.url}`
            );
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                `Failed to save QRF. HTTP ${response.status}.`
            );
        }

        alert(
            "QRF CREATED SUCCESSFULLY\n\n" +
            "QRF Number: " + result.qrf_no +
            "\nItems copied: " + result.items_count
        );

        cancelQRFForm();

        if (typeof loadQuotationRequests === "function") {
            loadQuotationRequests();
        }

    } catch (error) {
        console.error("SAVE QRF ERROR:", error);
        alert(error.message || "Server error while saving QRF.");

    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save QRF";
        }
    }
}

// =====================================================
// CANCEL FORM
// =====================================================

function cancelQRFForm() {
    const form = document.getElementById("quotationRequestCreateForm");

    if (form) {
        form.style.display = "none";
    }
}

// =====================================================
// SHOW FORM
// =====================================================

function showQRFForm() {
    const form = document.getElementById("quotationRequestCreateForm");

    if (form) {
        form.style.display = "block";
        generateQRF();

        const prsSelect = document.getElementById("quotationRequestPRS");

        if (prsSelect && prsSelect.value) {
            loadQRFItems();
        }
    }
}
