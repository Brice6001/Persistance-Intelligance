import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  CheckCircle, 
  Play, 
  RefreshCw, 
  Trash2, 
  Filter, 
  ExternalLink,
  PlusCircle,
  Clock,
  Zap,
  Cpu,
  Bookmark,
  Sparkles,
  Download,
  Terminal,
  FileText,
  Copy,
  Info,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DashboardHistoryEntry } from "./types";
import { PRESET_PROMPTS } from "./presets";

// Rich initial demo datasets to populate the table dynamically on first-load
const INITIAL_BI_RECORDS: DashboardHistoryEntry[] = [
  {
    id: "sample-grade-book",
    prompt: "Generate a student performance dashboard with student names, computer science scores, attendance percentages, final letter grades, and remedial pass/fail status.",
    headers: ["Student Name", "Course Subject", "Exam Score", "Attendance Rate", "Assigned Grade", "Course Status"],
    dataset: [
      { "Student Name": "Alice Johnson", "Course Subject": "Computer Science v5.0", "Exam Score": "94 %", "Attendance Rate": "98%", "Assigned Grade": "A", "Course Status": "Pass" },
      { "Student Name": "Robert Chen", "Course Subject": "Computer Science v5.0", "Exam Score": "88 %", "Attendance Rate": "92%", "Assigned Grade": "B+", "Course Status": "Pass" },
      { "Student Name": "Marcus Sterling", "Course Subject": "Data Structures", "Exam Score": "76 %", "Attendance Rate": "85%", "Assigned Grade": "B", "Course Status": "Pass" },
      { "Student Name": "Sofia Rodriguez", "Course Subject": "Database Analytics", "Exam Score": "99 %", "Attendance Rate": "100%", "Assigned Grade": "A+", "Course Status": "Pass" },
      { "Student Name": "Emily Watson", "Course Subject": "Data Structures", "Exam Score": "58 %", "Attendance Rate": "78%", "Assigned Grade": "D", "Course Status": "Action Required" },
      { "Student Name": "Daniel Kim", "Course Subject": "Database Analytics", "Exam Score": "82 %", "Attendance Rate": "91%", "Assigned Grade": "B", "Course Status": "Pass" }
    ],
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    isDemo: false
  },
  {
    id: "sample-sales-ledger",
    prompt: "Generate a quarterly sales report consisting of transaction date, region, product title, product units sold, gross revenue, and client key accounts representative.",
    headers: ["Transaction Date", "Sales Region", "Product Title", "Units Sold", "Gross Revenue", "Lead Accounts Rep"],
    dataset: [
      { "Transaction Date": "2026-05-01", "Sales Region": "North American hub", "Product Title": "Enterprise Cloud licensing (yearly)", "Units Sold": 12, "Gross Revenue": "$144,000", "Lead Accounts Rep": "Thomas Mills" },
      { "Transaction Date": "2026-05-03", "Sales Region": "West US Operations", "Product Title": "Premium Cyber-Security Core", "Units Sold": 45, "Gross Revenue": "$18,000", "Lead Accounts Rep": "Sarah Jenkins" },
      { "Transaction Date": "2026-05-05", "Sales Region": "EMEA Regional Office", "Product Title": "IntelliSentry Gateways Pro v10", "Units Sold": 8, "Gross Revenue": "$42,500", "Lead Accounts Rep": "Elena Petrova" },
      { "Transaction Date": "2026-05-08", "Sales Region": "APAC Tokyo Hub", "Product Title": "SaaS Integration Consultancy", "Units Sold": 250, "Gross Revenue": "$12,500", "Lead Accounts Rep": "Yuki Tanaka" },
      { "Transaction Date": "2026-05-12", "Sales Region": "South US Zone B", "Product Title": "Premium Cyber-Security Core", "Units Sold": 20, "Gross Revenue": "$8,000", "Lead Accounts Rep": "George Alvarez" }
    ],
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
    isDemo: false
  }
];

export default function App() {
  // Primary States
  const [inputText, setInputText] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  
  // Dynamic datasets database
  const [history, setHistory] = useState<DashboardHistoryEntry[]>(() => {
    const saved = localStorage.getItem("pi_dashboard_ledger");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Local history initialization failed:", e);
      }
    }
    return INITIAL_BI_RECORDS;
  });

  const [activeItem, setActiveItem] = useState<DashboardHistoryEntry | null>(() => {
    return history.length > 0 ? history[0] : null;
  });

  // UI Navigation / Playground Tab selector
  const [activeTab, setActiveTab] = useState<"dashboard" | "vanillaplayground" | "documentation">("dashboard");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Vanilla asset codes caches for playground copy-paste utility
  const [vanillaAssets, setVanillaAssets] = useState({
    html: "",
    css: "",
    js: ""
  });

  // Sync cache records on change
  useEffect(() => {
    localStorage.setItem("pi_dashboard_ledger", JSON.stringify(history));
  }, [history]);

  // Fetch API key capability status on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setHasApiKey(!!data.hasApiKey);
        } else {
          setHasApiKey(false);
        }
      } catch (err) {
        console.error("Server connection diagnostics stalled:", err);
        setHasApiKey(false);
      }
    };
    checkApiKey();

    // Fetch vanilla code files to render in playground viewer
    const loadVanillaSources = async () => {
      try {
        const hRes = await fetch("/vanilla/index.html");
        const cRes = await fetch("/vanilla/style.css");
        const jRes = await fetch("/vanilla/script.js");
        
        const htmlText = hRes.ok ? await hRes.text() : "<!-- index.html missing or loading error -->";
        const cssText = cRes.ok ? await cRes.text() : "/* style.css missing or loading error */";
        const jsText = jRes.ok ? await jRes.text() : "// script.js missing or loading error";

        setVanillaAssets({
          html: htmlText,
          css: cssText,
          js: jsText
        });
      } catch (err) {
        console.error("Fidelity sources pre-fetching stalled:", err);
      }
    };
    loadVanillaSources();
  }, []);

  // Quick Preset Loader Event Handler
  const handlePresetSelect = (id: string) => {
    setSelectedPresetId(id);
    const matched = PRESET_PROMPTS.find(p => p.id === id);
    if (matched) {
      setInputText(matched.prompt);
    } else {
      setInputText("");
    }
  };

  // Run dynamic dataset generation pipeline
  const handleSynthesizeDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    setIsLoading(true);

    try {
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query })
      });

      if (!resp.ok) {
        throw new Error(`Synthesis process status error: ${resp.status}`);
      }

      const outcome = await resp.json();
      
      let rowsList: any[] = [];
      if (outcome.data && Array.isArray(outcome.data)) {
        rowsList = outcome.data;
      } else if (typeof outcome.data === "object" && outcome.data !== null) {
        // If single object returned instead, convert to array securely
        rowsList = [outcome.data];
      } else {
        throw new Error("Generative engine returned empty data schema list.");
      }

      // Automatically construct header list columns from first keys
      const detectedHeaders = rowsList.length > 0 ? Object.keys(rowsList[0]) : ["Status"];

      const newEntry: DashboardHistoryEntry = {
        id: "bi-" + Math.random().toString(36).substring(2, 9),
        prompt: query,
        headers: detectedHeaders,
        dataset: rowsList,
        timestamp: new Date().toISOString(),
        isDemo: outcome.isDemo ?? !hasApiKey
      };

      setHistory(prev => [newEntry, ...prev]);
      setActiveItem(newEntry);
    } catch (err: any) {
      console.error("Synthesis transaction failed:", err);
      alert(`Synthesis Error: ${err.message || "Unknown schema processing failure."}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle CSV Excel downsampling & download trigger
  const handleExportCSV = (entry: DashboardHistoryEntry) => {
    if (!entry || !entry.dataset || entry.dataset.length === 0) return;

    const headers = entry.headers;
    let csvRows = [];

    // Header encoding
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

    // Body rows encoding
    entry.dataset.forEach(row => {
      const cells = headers.map(header => {
        const val = row[header];
        const textVal = val === undefined || val === null ? "" : String(val);
        return `"${textVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(cells.join(","));
    });

    const csvDataString = csvRows.join("\n");
    const blob = new Blob([csvDataString], { type: "text/csv;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);

    const aAnchor = document.createElement("a");
    aAnchor.href = blobUrl;
    aAnchor.setAttribute("download", `persistent_bi_ledger_${entry.id}.csv`);
    document.body.appendChild(aAnchor);
    aAnchor.click();
    document.body.removeChild(aAnchor);
    URL.revokeObjectURL(blobUrl);
  };

  // Copy Code utility helper for playground copy button
  const handleCopyCode = (codeText: string, label: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm("Reset active dashboard ledger history? All custom generated records will be wiped.")) {
      setHistory(INITIAL_BI_RECORDS);
      setActiveItem(INITIAL_BI_RECORDS[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-slate-200">
      
      {/* Dynamic Header Frame Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="bg-slate-950 text-white p-2.5 rounded-xl shadow-md border border-slate-800">
              <Database className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  Persistent Intelligence Dashboard
                </h1>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono py-0.5 px-2 rounded-md font-bold border border-slate-200 shadow-xs">
                  v3.2 Production Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Self-building data tables synthesizer powered by Google Gemini API
              </p>
            </div>
          </div>

          {/* Navigation Tabs selectors */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/85">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "dashboard"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Live Workspace
            </button>
            <button
              onClick={() => setActiveTab("vanillaplayground")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "vanillaplayground"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Vanilla Source Exporter
            </button>
            <button
              onClick={() => setActiveTab("documentation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "documentation"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              Setup Guide
            </button>
          </div>
        </div>
      </header>

      {/* Main Framework body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic Warning Alert on load-up status */}
        {hasApiKey === false && (
          <div className="mb-6 bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start md:items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Vessel Offline: Regex Offline Emulator System Active.</span> Live dataset generations will map prompts against local structure definitions. Configure a valid <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded border border-amber-200 text-amber-800">GEMINI_API_KEY</strong> inside the platform secrets manager to query raw AI models natively.
              </div>
            </div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-amber-700 bg-amber-100/50 border border-amber-200 px-2 py-0.5 rounded-md font-bold self-end md:self-auto">
              Offline Match Active
            </span>
          </div>
        )}

        {/* Tab Switch View Rendered */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Main BI spreadsheet workspace dashboard view */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Board Dividing column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Prompt Generator Box Console */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative">
                    <div className="absolute top-4 right-4 text-[10px] font-mono font-semibold bg-slate-50 text-slate-500 border border-slate-250 py-1 px-2.5 rounded-lg flex items-center gap-1">
                      <Zap className={`w-3 h-3 ${hasApiKey ? "text-emerald-500 animate-pulse" : "text-amber-500"}`} />
                      {hasApiKey ? "Gemini Engine LIVE" : "Regex Mock Mode"}
                    </div>

                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-slate-700" />
                      Dynamic BI Synthesizer Terminal
                    </h2>

                    {/* Presets lists choices */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                          Choose Industry Dataset Template:
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Standard matrices</span>
                      </label>
                      <select
                        value={selectedPresetId}
                        onChange={(e) => handlePresetSelect(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition font-medium"
                      >
                        <option value="">-- Apply a predefined template --</option>
                        {PRESET_PROMPTS.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.category}] - {p.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Entry text box */}
                    <form onSubmit={handleSynthesizeDataset} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                          Specify Prompt Structure Criteria:
                        </label>
                        <textarea
                          rows={6}
                          value={inputText}
                          onChange={(e) => {
                            setInputText(e.target.value);
                            setSelectedPresetId("");
                          }}
                          placeholder="Type or customize your spreadsheet criteria. e.g., 'Generate sales metric logs with item sold, units, warehouse location, zone classification, and purchase cost'"
                          className="w-full text-xs font-mono p-3 bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 transition leading-relaxed shadow-inner"
                        ></textarea>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isLoading || !inputText.trim()}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 ${
                            !inputText.trim()
                              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                              : isLoading
                                ? "bg-slate-700 text-white cursor-wait animate-pulse"
                                : "bg-slate-900 hover:bg-black active:scale-98 shadow-md"
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Generating Dynamic Structured Table...
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Synthesize Dynamic BI Dataset JSON
                            </>
                          )}
                        </button>
                        
                        {inputText && (
                          <button
                            type="button"
                            onClick={() => {
                              setInputText("");
                              setSelectedPresetId("");
                            }}
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-3 rounded-xl text-xs font-bold transition border border-slate-200"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Sidebar Historical Lists queues */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Persistent Operations History Logs
                      </h2>
                      <button
                        onClick={handleClearHistory}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline font-bold transition"
                      >
                        Reset Ledger
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                      Generated reports automatically persist to browser <code className="bg-slate-100 px-1 py-0.5 border rounded">localStorage</code>. Click any item below to restage its spreadsheet database:
                    </p>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setActiveItem(item)}
                          className={`p-3 rounded-xl border transition text-left cursor-pointer flex flex-col justify-between ${
                            activeItem?.id === item.id
                              ? "bg-slate-50 border-slate-900/60 shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Status: Persistent Cache</span>
                            <span className="bg-slate-100 border text-slate-700 px-1.5 py-0.5 rounded font-bold">
                              {item.dataset.length} columns x {item.headers.length} rows
                            </span>
                          </div>
                          <p className="text-xs font-bold truncate text-slate-800 mt-1">
                            {item.prompt}
                          </p>
                          <div className="flex items-center justify-between mt-2.5 text-[9px] text-slate-400 font-mono">
                            <span>Loaded: {new Date(item.timestamp).toLocaleTimeString()}</span>
                            {item.isDemo && <span className="text-yellow-700 bg-yellow-50 px-1 rounded">Offline Run</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Visual Dynamic Spreadsheet Matrix Table and Export actions */}
                <div className="lg:col-span-7">
                  {activeItem ? (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden h-full flex flex-col justify-between">
                      
                      {/* Control panel of spreadsheet */}
                      <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-900"></span>
                            Visualized Spreadsheet Matrix
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Active table headers matched &amp; extracted dynamically from live JSON fields
                          </p>
                        </div>

                        {/* Export CSV actions */}
                        <button
                          onClick={() => handleExportCSV(activeItem)}
                          className="bg-white ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 text-xs py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border-b border-slate-200"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                          Export Table Data as CSV
                        </button>
                      </div>

                      {/* Info bar outlining processed prompt criteria */}
                      <div className="p-4 bg-slate-950 text-slate-130 text-[11px] font-mono border-b border-slate-800 flex items-start gap-2.5">
                        <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-slate-300">
                          <span className="font-bold text-slate-400 uppercase text-[9px] block">Input Criteria Logged:</span>
                          &ldquo;{activeItem.prompt}&rdquo;
                        </div>
                      </div>

                      {/* Main Dynamic table representation scroll shell */}
                      <div className="flex-1 overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                          <thead className="bg-[#f1f5f9] text-[10px] text-slate-500 uppercase font-mono border-b border-slate-200">
                            <tr>
                              {activeItem.headers.map((hdr, idx) => (
                                <th key={idx} className="py-3 px-4 font-bold border-b border-slate-200 select-none">
                                  {hdr}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {activeItem.dataset.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-slate-50/50 transition">
                                {activeItem.headers.map((headerKey, cellIdx) => {
                                  const cellVal = row[headerKey];
                                  
                                  // Formatting helper widgets
                                  if (cellVal === true || cellVal === "Pass") {
                                    return (
                                      <td key={cellIdx} className="py-3.5 px-4 align-middle font-medium">
                                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                                          Pass
                                        </span>
                                      </td>
                                    );
                                  }
                                  if (cellVal === false || cellVal === "Action Required" || cellVal === "Remedial") {
                                    return (
                                      <td key={cellIdx} className="py-3.5 px-4 align-middle font-medium">
                                        <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded">
                                          Action Required
                                        </span>
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={cellIdx} className="py-3.5 px-4 align-middle font-semibold text-slate-800">
                                      {cellVal !== undefined && cellVal !== null ? String(cellVal) : "-"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Stats details matrices footer */}
                      <div className="bg-slate-50 border-t border-slate-200 p-4 font-mono text-[10px] text-slate-400 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Report compiled: {new Date(activeItem.timestamp).toLocaleDateString()} {new Date(activeItem.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <span className="bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded font-bold font-mono">
                          Dimensions: {activeItem.headers.length} Columns x {activeItem.dataset.length} Records
                        </span>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 border-dashed rounded-2xl h-full flex flex-col items-center justify-center p-8 text-center min-h-[460px]">
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-full text-slate-400 mb-4 animate-pulse">
                        <Database className="w-10 h-10" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Spreadsheet Empty</h3>
                      <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
                        No active synthesized datasets found. Use the Terminal to write a criteria and build a new layout automatically or restore defaults.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: Vanilla Code Playground and copy-to-clipboard tab */}
          {activeTab === "vanillaplayground" && (
            <motion.div
              key="vanillaplayground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-indigo-400" />
                      Vanilla JavaScript Code Export Center &amp; Playground
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Download or inspect the exact modular pure vanilla source assets conforming perfectly to the raw guidelines requested in the prompt.
                    </p>
                  </div>
                  <div className="text-xs font-mono bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                    📂 Files saved under: <span className="text-indigo-300 font-bold">/vanilla/*</span>
                  </div>
                </div>

                {/* Grid showing file codes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  
                  {/* index.html column */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden flex flex-col justify-between max-h-[500px]">
                    <div className="p-3 bg-slate-900 text-xs text-slate-300 font-mono font-bold flex items-center justify-between border-b border-slate-850">
                      <span>index.html (5.2 KB)</span>
                      <button
                        onClick={() => handleCopyCode(vanillaAssets.html, "html")}
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition"
                      >
                        {copiedCode === "html" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode === "html" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="p-4 text-[10px] text-slate-300 font-mono overflow-auto flex-1 leading-normal whitespace-pre">
                      <code>{vanillaAssets.html}</code>
                    </pre>
                  </div>

                  {/* script.js column */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden flex flex-col justify-between max-h-[500px]">
                    <div className="p-3 bg-slate-900 text-xs text-slate-300 font-mono font-bold flex items-center justify-between border-b border-slate-850">
                      <span>script.js (11.4 KB)</span>
                      <button
                        onClick={() => handleCopyCode(vanillaAssets.js, "js")}
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition"
                      >
                        {copiedCode === "js" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode === "js" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="p-4 text-[10px] text-slate-300 font-mono overflow-auto flex-1 leading-normal whitespace-pre">
                      <code>{vanillaAssets.js}</code>
                    </pre>
                  </div>

                  {/* style.css column */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden flex flex-col justify-between max-h-[500px]">
                    <div className="p-3 bg-slate-900 text-xs text-slate-300 font-mono font-bold flex items-center justify-between border-b border-slate-850">
                      <span>style.css (1.1 KB)</span>
                      <button
                        onClick={() => handleCopyCode(vanillaAssets.css, "css")}
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition"
                      >
                        {copiedCode === "css" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode === "css" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="p-4 text-[10px] text-slate-300 font-mono overflow-auto flex-1 leading-normal whitespace-pre">
                      <code>{vanillaAssets.css}</code>
                    </pre>
                  </div>

                </div>

                {/* Instructions on local execution */}
                <div className="mt-6 bg-slate-850 border border-slate-850 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                  <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-400" />
                    Getting Started Locally using Vanilla standalone sources
                  </h3>
                  <p className="mb-2">
                    These three raw assets compiled above constitute the vanilla implementation required by the TCREI framework.
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                    <li>Create an empty folder, save files as <code className="text-indigo-300 font-mono font-bold">index.html</code>, <code class="text-indigo-300 font-mono font-bold">style.css</code>, and <code class="text-indigo-300 font-mono font-bold">script.js</code> directly.</li>
                    <li>Fire up index.html with any browser! If you have no server proxy, paste your Gemini Key into the top configuration input box to authorize requests safely.</li>
                    <li>Both mock generators and CSV parsing functions are included natively in <code className="text-slate-300 font-mono">script.js</code>.</li>
                  </ul>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: Advanced documentation / Obtaining steps tab */}
          {activeTab === "documentation" && (
            <motion.div
              key="documentation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-white border text-left border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-xs leading-relaxed"
            >
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Obtaining, Connecting &amp; Securing Your Gemini API Credentials
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-600">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                    Step-by-Step AI Studio Obtainment
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                    <li>Go to the Google AI Studio developer portal: <a href="https://aistudio.google.com" target="_blank" className="text-indigo-600 hover:underline font-bold">aistudio.google.com</a>.</li>
                    <li>Login with your developer Google Account.</li>
                    <li>Click on the <strong className="font-bold text-slate-800">Get API Key</strong> button within the left column navigation dashboard.</li>
                    <li>Select an existing Google Cloud Platform project or instantiate a new sandbox environment.</li>
                    <li>Click <strong className="font-bold text-slate-800">Create API Key</strong> to produce a unique key string starting with <code className="font-mono bg-slate-100 p-0.5 rounded text-red-600">AIzaSy...</code>.</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                    Connecting Credentials securely (Enterprise standard)
                  </h3>
                  <p>
                    For our Live Container sandbox (which avoids API key leak to client browsers), we proxy requests via a backend NodeJS server that references your system variables.
                  </p>
                  <ul className="list-disc list-inside space-y-3 leading-dashed">
                    <li>Open your AI Studio workspace <strong>Settings &gt; Secrets</strong> pane.</li>
                    <li>Create or update the variable named <code className="bg-slate-100 font-bold font-mono px-1 border rounded">GEMINI_API_KEY</code>.</li>
                    <li>Paste your copied credentials string.</li>
                    <li>Save! The application server will instantly re-orient to utilize live RESTful synthesization instead of regex offline fallbacks!</li>
                  </ul>
                </div>
              </div>

              {/* Suggestions for improvements */}
              <div className="bg-slate-50 border rounded-xl p-5 mt-6">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Architectural Highlights &amp; Edge Case Preventative Design</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div className="bg-white border rounded-lg p-3.5 shadow-xs">
                    <h4 className="font-bold text-slate-800 mb-1">Dynamic Adaptability</h4>
                    Auto-analyzes returned array matrices keys to inject HTML headers. This protects against system crashes if Gemini returns customized structures or unaligned keys.
                  </div>
                  <div className="bg-white border rounded-lg p-3.5 shadow-xs">
                    <h4 className="font-bold text-slate-800 mb-1">Spreadsheet Encoding</h4>
                    Converts string fields securely on CSV formulation, escaping quote marks to prevent row misalignment inside programs like Microsoft Excel or Google Sheets.
                  </div>
                  <div className="bg-white border rounded-lg p-3.5 shadow-xs">
                    <h4 className="font-bold text-slate-850 mb-1">Self-Healing JSON</h4>
                    Enforces strict <code className="font-mono bg-slate-150 rounded text-red-600">responseMimeType: "application/json"</code> on live server hooks, preventing leading markdown text noise entirely.
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
        
      </main>

      {/* Footer credits layout */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center text-xs text-slate-400">
        <p>Persistent Intelligence Dashboard &bull; Standard TCREI Compliant Development Workspace Mode</p>
      </footer>

    </div>
  );
}
