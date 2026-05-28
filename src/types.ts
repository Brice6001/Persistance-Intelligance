export interface DashboardHistoryEntry {
  id: string;
  prompt: string;
  dataset: any[]; // Flat list of objects representing the dynamically generated rows
  headers: string[]; // List of dynamic column keys extracted
  timestamp: string;
  isDemo: boolean;
}

export interface PresetPrompt {
  id: string;
  title: string;
  prompt: string;
  category: "Sales" | "Education" | "HR" | "Inventory" | "Finance";
}
