/**
 * File: script.js
 * Project: Persistent Intelligence Dashboard
 * Description: Dynamic BI structured JSON synthesizer using vanilla ES6+ & local storage.
 */

// Global constant array of industry preset prompts definitions
const PRESETS = {
    student: "Generate a student performance dashboard with student names, computer science scores, attendance percentages, final letter grades, and remedial pass/fail status.",
    sales: "Generate a quarterly sales report consisting of transaction date, region, product title, product units sold, gross revenue, and client key accounts representative.",
    employee: "Generate an HR employee tracking dataset with unique employee ID codes, full employee names, departments, position responsibilities, USD salary, and current status.",
    inventory: "Generate an inventory list containing SKU codes, technical item descriptor names, physical warehouse zones, shelf count units, single unit cost, and restock trigger status.",
    finance: "Generate a financial transaction ledger highlighting account ID, deployment type, vendor name, amount in USD, transaction flag risk level, and executive approver code."
};

// Local cache structures for offline demo testing mode
const MOCK_DATASETS = {
    student: [
        { "Name": "Alice Johnson", "Subject": "Computer Science", "Score": 94, "Attendance": "98%", "Grade": "A", "Status": "Pass" },
        { "Name": "Robert Chen", "Subject": "Computer Science", "Score": 88, "Attendance": "92%", "Grade": "B+", "Status": "Pass" },
        { "Name": "Marcus Sterling", "Subject": "Data Structures", "Score": 76, "Attendance": "85%", "Grade": "B", "Status": "Pass" },
        { "Name": "Sofia Rodriguez", "Subject": "Linear Algebra", "Score": 99, "Attendance": "100%", "Grade": "A+", "Status": "Pass" },
        { "Name": "Emily Watson", "Subject": "Linear Algebra", "Score": 58, "Attendance": "78%", "Grade": "D", "Status": "Remedial" },
        { "Name": "Daniel Kim", "Subject": "Data Structures", "Score": 82, "Attendance": "91%", "Grade": "B", "Status": "Pass" }
    ],
    sales: [
        { "Date": "2026-05-01", "Region": "North US", "Product": "Enterprise Cloud licenses", "Units": 12, "Revenue": "$24,000", "Representative": "Thomas Mills" },
        { "Date": "2026-05-03", "Region": "West US", "Product": "Premium Security Suite", "Units": 45, "Revenue": "$18,000", "Representative": "Sarah Jenkins" },
        { "Date": "2026-05-05", "Region": "EMEA East", "Product": "Edge Gateway Pro x10", "Units": 8, "Revenue": "$42,500", "Representative": "Elena Petrova" },
        { "Date": "2026-05-08", "Region": "APAC South", "Product": "SaaS Platform Membership", "Units": 250, "Revenue": "$12,500", "Representative": "Yuki Tanaka" },
        { "Date": "2026-05-12", "Region": "South US", "Product": "Premium Security Suite", "Units": 20, "Revenue": "$8,000", "Representative": "George Alvarez" }
    ],
    employee: [
        { "ID": "EMP-0492", "Full Name": "Clarissa Vance", "Department": "Security Operations", "Position": "Lead Incident Analyst", "Salary": "$115,000", "Status": "Active" },
        { "ID": "EMP-1084", "Full Name": "Marcus Finch", "Department": "Core Platform Engineering", "Position": "Senior Devops Architect", "Salary": "$132,000", "Status": "Active" },
        { "ID": "EMP-2351", "Full Name": "Amara Okafor", "Department": "Product Strategy", "Position": "Product Owner", "Salary": "$105,000", "Status": "On Leave" },
        { "ID": "EMP-0839", "Full Name": "Benjamin Vance", "Department": "Data Infrastructure", "Position": "Database Administrator", "Salary": "$98,500", "Status": "Active" }
    ],
    inventory: [
        { "SKU": "WR-9238", "Item Name": "Optical Transceiver 100G", "Warehouse": "Bay A-4", "Total Units": 1500, "Unit Cost": "$85.00", "Restock Status": "Apt Stock" },
        { "SKU": "WR-0421", "Item Name": "Fiber Patch Cables (5m)", "Warehouse": "Shelf 12", "Total Units": 350, "Unit Cost": "$12.50", "Restock Status": "Low Stock" },
        { "SKU": "WR-8832", "Item Name": "Chassis Cooling Unit v3", "Warehouse": "Bay B-2", "Total Units": 18, "Unit Cost": "$450.00", "Restock Status": "Apt Stock" }
    ],
    finance: [
        { "Account ID": "AC-99238", "Type": "Asset Deployment", "Vendor": "Mainline Cooling Corp", "Amount": "-$12,450.00", "Approved By": "Finance VP" },
        { "Account ID": "AC-10255", "Type": "Software Subscription", "Vendor": "Amazon Web Services", "Amount": "-$8,230.15", "Approved By": "CTO Hub" },
        { "Account ID": "AC-42110", "Type": "Audit Liability", "Vendor": "Internal Revenue Service", "Amount": "-$35,000.00", "Approved By": "CEO Direct" }
    ],
    generic: [
        { "Metric": "Processor Temp", "Value": "42°C", "State": "Stable", "Rack ID": "Rack-C" },
        { "Metric": "Power Utilization", "Value": "4.8 kW", "State": "Optimal", "Rack ID": "Rack-B" },
        { "Metric": "Network Lag", "Value": "14ms", "State": "Stable", "Rack ID": "Rack-A" }
    ]
};

// State Variables
let currentDataset = null;
let promptHistory = [];
let geminiApiKey = "";

// DOM Elements Reference pointers
const elements = {
    apiKeyInput: document.getElementById("apiKeyInput"),
    saveKeyBtn: document.getElementById("saveKeyBtn"),
    presetSelect: document.getElementById("presetSelect"),
    promptInput: document.getElementById("promptInput"),
    generateBtn: document.getElementById("generateBtn"),
    btnText: document.getElementById("btnText"),
    playIcon: document.getElementById("playIcon"),
    spinnerIcon: document.getElementById("spinnerIcon"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    dashboardTable: document.getElementById("dashboardTable"),
    tablePlaceholder: document.getElementById("tablePlaceholder"),
    colCountText: document.getElementById("colCountText"),
    rowCountText: document.getElementById("rowCountText"),
    clearLogsBtn: document.getElementById("clearLogsBtn"),
    logsContainer: document.getElementById("logsContainer"),
    errorBanner: document.getElementById("errorBanner"),
    errorText: document.getElementById("errorText")
};

// -------------------------------------------------------------
// Initialize App state and read persistent parameters on load
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    // 1. Retrieve saved API Key
    geminiApiKey = localStorage.getItem("pi_gemini_api_key") || "";
    if (geminiApiKey) {
        elements.apiKeyInput.value = geminiApiKey;
    }

    // 2. Retrieve history queues
    const savedLogs = localStorage.getItem("pi_prompt_history");
    if (savedLogs) {
        try {
            promptHistory = JSON.parse(savedLogs);
            renderHistoryLogs();
        } catch (e) {
            console.error("Failed to parse persistent prompt history:", e);
        }
    }

    // 3. Retrieve active dataset cache
    const savedDataset = localStorage.getItem("pi_active_dataset");
    if (savedDataset) {
        try {
            currentDataset = JSON.parse(savedDataset);
            renderDynamicTable(currentDataset);
        } catch (e) {
            console.error("Failed to parse persistent active dataset:", e);
        }
    }

    // Setup event hook listeners
    setupEventListeners();
});

// Configure trigger scopes
function setupEventListeners() {
    // Save API key
    elements.saveKeyBtn.addEventListener("click", () => {
        geminiApiKey = elements.apiKeyInput.value.trim();
        localStorage.setItem("pi_gemini_api_key", geminiApiKey);
        showNotification("Security key cached successfully.");
    });

    // Loaded Preset Trigger changes
    elements.presetSelect.addEventListener("change", (e) => {
        const option = e.target.value;
        if (PRESETS[option]) {
            elements.promptInput.value = PRESETS[option];
        } else {
            elements.promptInput.value = "";
        }
    });

    // Run Generator Synthesis Button
    elements.generateBtn.addEventListener("click", triggerGenerationWorkflow);

    // Export Dynamic Sheet Matrix to CSV downloder
    elements.exportCsvBtn.addEventListener("click", triggerCSVDownload);

    // Clear logs tracking
    elements.clearLogsBtn.addEventListener("click", () => {
        if (confirm("Delete compiled operations dashboard history log?")) {
            promptHistory = [];
            localStorage.setItem("pi_prompt_history", JSON.stringify([]));
            renderHistoryLogs();
        }
    });
}

// -------------------------------------------------------------
// CORE GENERATION WORKFLOW
// -------------------------------------------------------------
async function triggerGenerationWorkflow() {
    const promptValue = elements.promptInput.value.trim();
    if (!promptValue) {
        showError("Please enter or load a prompt query instruction statement first.");
        return;
    }

    // Show loading spinner dynamics
    elements.generateBtn.disabled = true;
    elements.playIcon.classList.add("hidden");
    elements.spinnerIcon.classList.remove("hidden");
    elements.btnText.innerText = "Processing structured schema synthesis...";
    elements.errorBanner.classList.add("hidden");

    try {
        let parsedData = null;

        if (geminiApiKey) {
            // Live actual direct API connection
            parsedData = await fetchDatasetFromGemini(promptValue);
        } else {
            // Demo Fallback rule resolver
            parsedData = triggerOfflineMatching(promptValue);
            showNotification("API Key missing. Loading matching offline demo dataset.");
        }

        if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
            throw new Error("Parsed intelligence payload is empty or not in required row array schema.");
        }

        // Cache parameters into Persistent Storage
        currentDataset = parsedData;
        localStorage.setItem("pi_active_dataset", JSON.stringify(currentDataset));

        // Sync history logs cache
        const newLog = {
            id: "log-" + Math.random().toString(36).substring(2, 7),
            prompt: promptValue,
            timestamp: new Date().toLocaleTimeString(),
            rowsCount: parsedData.length
        };
        promptHistory.unshift(newLog);
        localStorage.setItem("pi_prompt_history", JSON.stringify(promptHistory));

        // Render targets
        renderDynamicTable(currentDataset);
        renderHistoryLogs();

    } catch (err) {
        console.error("Dataset compilation aborted:", err);
        showError(err.message || "Unknown error occurred compiling dataset.");
    } finally {
        // Toggle loading indicator states
        elements.generateBtn.disabled = false;
        elements.playIcon.classList.remove("hidden");
        elements.spinnerIcon.classList.add("hidden");
        elements.btnText.innerText = "Synthesize Dataset JSON";
    }
}

// -------------------------------------------------------------
// SECURE DIRECT CLIENT CONNECTIVITY (IF IN STANDALONE RAW RUN)
// -------------------------------------------------------------
async function fetchDatasetFromGemini(promptQuery) {
    // Construct Gemini content URL query matching standard stable endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    // Prompt instructions with explicit directive parameters forcing flat JSON lists
    const promptPayload = {
        contents: [
            {
                parts: [
                    {
                        text: `USER REQUEST SCHEMA: "${promptQuery}"`
                    }
                ]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json"
        },
        systemInstruction: {
            parts: [
                {
                    text: `You are a professional Business Intelligence (BI) data generator.
Your absolute goal is to generate clean, highly realistic spreadsheet-like datasets represented ONLY as a flat JSON array of objects.
Rules:
1. Return ONLY a valid JSON array of flat objects (no nested arrays or nested dictionary trees).
2. All records inside the array must feature the exact same keys representing the column header titles.
3. Choose highly realistic names, dates, scores, money figures, or categories matching the user request.
4. Capitalize key names so they look tidy on spreadsheet column header banners.
5. Generate between 5 and 10 highly realistic entries.
6. Absolutely NO conversational output, NO leading/trailing prose, NO markdown markup wrapper like "\`\`\`json". Only return raw valid JSON.`
                }
            ]
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(promptPayload)
    });

    if (!response.ok) {
        const errDetails = await response.json().catch(() => ({}));
        const message = errDetails?.error?.message || `API HTTP status rejection code: ${response.status}`;
        throw new Error(message);
    }

    const payload = await response.json();
    const responseText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
        throw new Error("No textual candidates retrieved from Google generative models.");
    }

    // Defensive json parser
    try {
        return JSON.parse(responseText.trim());
    } catch (e) {
        throw new Error(`AI generated invalid JSON structure: ${e.message}. Content returned: ` + responseText.slice(0, 100));
    }
}

// -------------------------------------------------------------
// DYNAMIC COMPONENT RENDERING DIRECTIVES
// -------------------------------------------------------------
function renderDynamicTable(data) {
    if (!data || data.length === 0) {
        return;
    }

    // Clear placeholder
    elements.dashboardTable.innerHTML = "";

    // 1. Extract Headers dynamically from the first raw matrix object keys
    const headers = Object.keys(data[0]);

    // Update statistics counter display state
    elements.colCountText.innerText = headers.length;
    elements.rowCountText.innerText = data.length;

    // 2. Create Header elements row
    const thead = document.createElement("thead");
    thead.className = "bg-slate-100 uppercase tracking-wider text-[10px] text-slate-500 font-mono border-b border-slate-200";
    
    const headerRow = document.createElement("tr");
    headers.forEach(key => {
        const th = document.createElement("th");
        th.className = "py-3 px-4 font-bold border-b border-slate-200 text-left";
        th.innerText = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    elements.dashboardTable.appendChild(thead);

    // 3. Populate Rows and Cells dynamically
    const tbody = document.createElement("tbody");
    tbody.className = "divide-y divide-slate-200";

    data.forEach(record => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50/50 transition";
        
        headers.forEach(headerKey => {
            const td = document.createElement("td");
            td.className = "py-3 px-4 align-middle font-medium leading-relaxed max-w-sm truncate";
            
            // Format monetary or boolean labels elegantly
            const val = record[headerKey];
            if (val === true || val === "Pass") {
                td.innerHTML = `<span class="bg-emerald-55 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-100">Pass</span>`;
            } else if (val === false || val === "Remedial") {
                td.innerHTML = `<span class="bg-red-55 text-red-700 bg-red-50 px-2 py-0.5 rounded font-bold text-[10px] border border-red-100">Action Required</span>`;
            } else if (typeof val === "number" && val > 90 && (headerKey.toLowerCase().includes("score") || headerKey.toLowerCase().includes("attendance"))) {
                td.innerHTML = `<span class="font-bold text-slate-900">${val} % 🔥</span>`;
            } else {
                td.innerText = (val !== undefined && val !== null) ? val : "-";
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    elements.dashboardTable.appendChild(tbody);

    // Enable export spreadsheet button
    elements.exportCsvBtn.removeAttribute("disabled");
}

function renderHistoryLogs() {
    elements.logsContainer.innerHTML = "";
    
    if (promptHistory.length === 0) {
        elements.logsContainer.innerHTML = `<p class="text-slate-400 italic text-center py-4">No logged queries yet</p>`;
        return;
    }

    promptHistory.forEach(historyLog => {
        const div = document.createElement("div");
        div.className = "bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex flex-col hover:bg-slate-100 cursor-pointer transition";
        div.innerHTML = `
            <div class="flex items-center justify-between font-mono text-[9px] text-slate-400">
                <span>Timestamp: ${historyLog.timestamp}</span>
                <span class="bg-slate-200 text-slate-700 px-1.5 rounded font-bold">${historyLog.rowsCount} records</span>
            </div>
            <p class="mt-1 font-medium truncate text-slate-800">${historyLog.prompt}</p>
        `;
        // Load on click
        div.addEventListener("click", () => {
            elements.promptInput.value = historyLog.prompt;
            showNotification("Prompt reloaded into terminal input.");
        });
        elements.logsContainer.appendChild(div);
    });
}

// -------------------------------------------------------------
// CSV CONVERSION FIELD TRANSFORMATION ENDPOINT
// -------------------------------------------------------------
function triggerCSVDownload() {
    if (!currentDataset || currentDataset.length === 0) return;

    // 1. Compile Header column rows
    const keys = Object.keys(currentDataset[0]);
    let csvContent = "";
    
    // Header Row CSV encoding
    csvContent += keys.map(k => `"${k.replace(/"/g, '""')}"`).join(",") + "\n";

    // Data rows CSV encoding
    currentDataset.forEach(row => {
        const rowString = keys.map(k => {
            let cellVal = row[k];
            if (cellVal === undefined || cellVal === null) cellVal = "";
            let cellStr = String(cellVal).replace(/"/g, '""');
            return `"${cellStr}"`;
        }).join(",");
        csvContent += rowString + "\n";
    });

    // 2. Generate custom download container element trigger anchor
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.setAttribute("download", `persistent_intelligence_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Clean-up context
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Spreadsheet file downloaded successfully.");
}

// -------------------------------------------------------------
// ERROR AND NOTIFICATION HELPERS
// -------------------------------------------------------------
function showError(msg) {
    elements.errorText.innerText = msg;
    elements.errorBanner.classList.remove("hidden");
    elements.errorBanner.scrollIntoView({ behavior: 'smooth' });
}

function showNotification(msg) {
    const notifyDiv = document.createElement("div");
    notifyDiv.className = "fixed bottom-5 right-5 bg-slate-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xl z-50 animate-bounce duration-500";
    notifyDiv.innerText = msg;
    document.body.appendChild(notifyDiv);
    setTimeout(() => {
        notifyDiv.remove();
    }, 2500);
}

// -------------------------------------------------------------
// OFFLINE MATCHING REGEX
// -------------------------------------------------------------
function triggerOfflineMatching(promptText) {
    const text = promptText.toLowerCase();
    
    if (text.includes("student") || text.includes("score") || text.includes("grade") || text.includes("class")) {
        return MOCK_DATASETS.student;
    }
    if (text.includes("sales") || text.includes("revenue") || text.includes("deal") || text.includes("report")) {
        return MOCK_DATASETS.sales;
    }
    if (text.includes("employee") || text.includes("hr") || text.includes("staff") || text.includes("salary")) {
        return MOCK_DATASETS.employee;
    }
    if (text.includes("inventory") || text.includes("stock") || text.includes("warehouse")) {
        return MOCK_DATASETS.inventory;
    }
    if (text.includes("finance") || text.includes("expense") || text.includes("profit") || text.includes("ledger")) {
        return MOCK_DATASETS.finance;
    }
    
    return MOCK_DATASETS.generic;
}
