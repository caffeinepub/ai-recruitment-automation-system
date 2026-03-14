// Dynamically loads the SheetJS (xlsx) library from CDN
// This avoids needing it as a package dependency

type XLSXLib = {
  read: (
    data: ArrayBuffer,
    opts: { type: string },
  ) => {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  };
  utils: {
    sheet_to_json: <T>(
      sheet: unknown,
      opts?: { defval?: unknown; raw?: boolean },
    ) => T[];
  };
};

let xlsxPromise: Promise<XLSXLib> | null = null;

export function loadXLSX(): Promise<XLSXLib> {
  if (xlsxPromise) return xlsxPromise;

  xlsxPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as unknown as Record<string, unknown>).XLSX) {
      resolve((window as unknown as Record<string, unknown>).XLSX as XLSXLib);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    script.onload = () => {
      const xlsx = (window as unknown as Record<string, unknown>)
        .XLSX as XLSXLib;
      if (xlsx) {
        resolve(xlsx);
      } else {
        reject(new Error("XLSX failed to load"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load xlsx from CDN"));
    document.head.appendChild(script);
  });

  return xlsxPromise;
}
