import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;
function getAi() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Fallback dataset generators for standard demo files when no API key is set
function generateDynamicFallback(prompt: string): any[] {
  const norm = prompt.toLowerCase();

  if (norm.includes("student") || norm.includes("score") || norm.includes("grade") || norm.includes("class") || norm.includes("attendance")) {
    return [
      { "Name": "Alice Johnson", "Subject": "Computer Science", "Score": 94, "Attendance": "98%", "Grade": "A", "Status": "Pass" },
      { "Name": "Robert Chen", "Subject": "Computer Science", "Score": 88, "Attendance": "92%", "Grade": "B+", "Status": "Pass" },
      { "Name": "Marcus Sterling", "Subject": "Data Structures", "Score": 76, "Attendance": "85%", "Grade": "B", "Status": "Pass" },
      { "Name": "Sofia Rodriguez", "Subject": "Linear Algebra", "Score": 99, "Attendance": "100%", "Grade": "A+", "Status": "Pass" },
      { "Name": "Emily Watson", "Subject": "Linear Algebra", "Score": 58, "Attendance": "78%", "Grade": "D", "Status": "Remedial" },
      { "Name": "Daniel Kim", "Subject": "Data Structures", "Score": 82, "Attendance": "91%", "Grade": "B", "Status": "Pass" }
    ];
  }

  if (norm.includes("sales") || norm.includes("revenue") || norm.includes("deal") || norm.includes("report") || norm.includes("region") || norm.includes("retail")) {
    return [
      { "Date": "2026-05-01", "Region": "North US", "Product": "Enterprise Cloud licenses", "Units": 12, "Revenue": "$24,000", "Representative": "Thomas Mills" },
      { "Date": "2026-05-03", "Region": "West US", "Product": "Premium Security Suite", "Units": 45, "Revenue": "$18,000", "Representative": "Sarah Jenkins" },
      { "Date": "2026-05-05", "Region": "EMEA East", "Product": "Edge Gateway Pro x10", "Units": 8, "Revenue": "$42,500", "Representative": "Elena Petrova" },
      { "Date": "2026-05-08", "Region": "APAC South", "Product": "SaaS Platform Membership", "Units": 250, "Revenue": "$12,500", "Representative": "Yuki Tanaka" },
      { "Date": "2026-05-12", "Region": "South US", "Product": "Premium Security Suite", "Units": 20, "Revenue": "$8,000", "Representative": "George Alvarez" }
    ];
  }

  if (norm.includes("employee") || norm.includes("hr") || norm.includes("position") || norm.includes("staff") || norm.includes("salary") || norm.includes("tracking")) {
    return [
      { "ID": "EMP-0492", "Full Name": "Clarissa Vance", "Department": "Security Operations", "Position": "Lead Incident Analyst", "Salary": "$115,000", "Status": "Active" },
      { "ID": "EMP-1084", "Full Name": "Marcus Finch", "Department": "Core Platform Engineering", "Position": "Senior Devops Architect", "Salary": "$132,000", "Status": "Active" },
      { "ID": "EMP-2351", "Full Name": "Amara Okafor", "Department": "Product Strategy", "Position": "Product Owner", "Salary": "$105,000", "Status": "On Leave" },
      { "ID": "EMP-0839", "Full Name": "Benjamin Vance", "Department": "Data Infrastructure", "Position": "Database Administrator", "Salary": "$98,500", "Status": "Active" },
      { "ID": "EMP-1299", "Full Name": "Taylor Swift", "Department": "Marketing Design", "Position": "Chief Designer", "Salary": "$150,000", "Status": "Active" }
    ];
  }

  if (norm.includes("inventory") || norm.includes("stock") || norm.includes("warehouse") || norm.includes("item") || norm.includes("units") || norm.includes("sku")) {
    return [
      { "SKU": "WR-9238", "Item Name": "Optical Transceiver 100G", "Warehouse": "Bay A-4", "Total Units": 1500, "Unit Cost": "$85.00", "Restock Status": "Apt Stock" },
      { "SKU": "WR-0421", "Item Name": "Fiber Patch Cables (5m)", "Warehouse": "Shelf 12", "Total Units": 350, "Unit Cost": "$12.50", "Restock Status": "Under Stock (Critical)" },
      { "SKU": "WR-8832", "Item Name": "Chassis Cooling Unit v3", "Warehouse": "Bay B-2", "Total Units": 18, "Unit Cost": "$450.00", "Restock Status": "Apt Stock" },
      { "SKU": "WR-1104", "Item Name": "Solid State Storage Module", "Warehouse": "Safe A", "Total Units": 95, "Unit Cost": "$275.00", "Restock Status": "Reorder Triggered" },
      { "SKU": "WR-2391", "Item Name": "Core Router Board v2", "Warehouse": "Bay G-8", "Total Units": 4, "Unit Cost": "$1,200.00", "Restock Status": "Under Stock (Critical)" }
    ];
  }

  if (norm.includes("finance") || norm.includes("expense") || norm.includes("profit") || norm.includes("budget") || norm.includes("transaction")) {
    return [
      { "Account ID": "AC-99238", "Type": "Asset Deployment", "Vendor": "Mainline Cooling Corp", "Amount": "-$12,450.00", "Risk Level": "Low", "Approved By": "Finance VP" },
      { "Account ID": "AC-10255", "Type": "Software Subscription", "Vendor": "Amazon Web Services", "Amount": "-$8,230.15", "Risk Level": "Low", "Approved By": "CTO Hub" },
      { "Account ID": "AC-42110", "Type": "Audit Liability", "Vendor": "Internal Revenue Service", "Amount": "-$35,000.00", "Risk Level": "High", "Approved By": "CEO Direct" },
      { "Account ID": "AC-04512", "Type": "Invoiced Receipt", "Vendor": "Apex Logistics Group", "Amount": "+$52,100.00", "Risk Level": "Low", "Approved By": "Accounts Ops" },
      { "Account ID": "AC-88123", "Type": "Enterprise Hardware purchase", "Vendor": "Cisco Systems", "Amount": "-$18,450.00", "Risk Level": "Medium", "Approved By": "Director Infra" }
    ];
  }

  // Baseline standard generic fallback if it matches none of the standard predefined queries
  return [
    { "Metric Identifier": "MET-101", "Operational Status": "Operational", "Response Code": "200 OK", "Host Address": "10.0.0.1", "Traffic Volume": "450 GB", "Activity Log": "Baseline analysis" },
    { "Metric Identifier": "MET-102", "Operational Status": "Slowing", "Response Code": "504 Gateway", "Host Address": "10.0.0.18", "Traffic Volume": "1,200 GB", "Activity Log": "Database lag detected" },
    { "Metric Identifier": "MET-103", "Operational Status": "Operational", "Response Code": "201 Created", "Host Address": "10.1.2.45", "Traffic Volume": "150 GB", "Activity Log": "Self-healing trigger loaded" },
    { "Metric Identifier": "MET-104", "Operational Status": "Critical Hazard", "Response Code": "403 Denied", "Host Address": "192.168.1.5", "Traffic Volume": "88 GB", "Activity Log": "Security threshold exceeded" }
  ];
}

// API Routes
app.get("/api/status", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = !!(apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "");
  res.json({
    status: "ok",
    hasApiKey: hasKey
  });
});

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Dynamic prompt string field is required." });
  }

  const ai = getAi();
  if (!ai) {
    // Return high quality offline preset matches
    const mockDataset = generateDynamicFallback(prompt);
    return res.json({
      data: mockDataset,
      isDemo: true,
      originalQuery: prompt
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Please generate a structured dataset for: "${prompt}"`,
      config: {
        systemInstruction: `You are a professional Business Intelligence (BI) data generator.
Your absolute goal is to generate clean, highly realistic spreadsheet-like datasets represented ONLY as a flat JSON array of objects.
Rules:
1. Return ONLY a valid JSON array of flat objects (no nested arrays or nested dictionary trees).
2. All records inside the array must feature the exact same keys representing the column header titles.
3. Choose highly realistic names, dates, scores, money figures, or categories matching the user request.
4. Capitalize key names (e.g. "Name", "Score", "Inventory Level", "Revenue") so they look tidy on spreadsheet column header banners.
5. Generate between 5 and 10 highly realistic entries.
6. Absolutely NO conversational output, NO leading/trailing prose, NO markdown markup wrapper like "\`\`\`json". Only return raw valid JSON.`,
        responseMimeType: "application/json"
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Empty content received from intelligence engine.");
    }

    const parsedJson = JSON.parse(textOutput.trim());
    return res.json({
      data: parsedJson,
      isDemo: false,
      originalQuery: prompt
    });
  } catch (err: any) {
    console.error("Gemini dataset synthesis failed:", err);
    // Fallback automatically to high fidelity mock matching
    const mockDataset = generateDynamicFallback(prompt);
    return res.json({
      data: mockDataset,
      isDemo: true,
      originalQuery: prompt,
      fallbackUsed: true,
      errorMsg: err.message || "An issue occurred during live classification call."
    });
  }
});

// Setup Vite Dev Server / Prod Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
