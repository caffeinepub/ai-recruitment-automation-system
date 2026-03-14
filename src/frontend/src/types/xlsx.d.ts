declare module "xlsx" {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  }

  export interface WorkSheet {
    [key: string]: CellObject | string | number | undefined;
  }

  export interface CellObject {
    v?: string | number | boolean;
    t?: string;
    f?: string;
    r?: string;
    h?: string;
    w?: string;
  }

  export interface Sheet2JSONOpts {
    defval?: unknown;
    raw?: boolean;
    header?: number | string[];
    range?: unknown;
    blankrows?: boolean;
  }

  export interface ReadOpts {
    type?: "array" | "buffer" | "binary" | "base64" | "string";
  }

  export const utils: {
    sheet_to_json<T>(sheet: WorkSheet, opts?: Sheet2JSONOpts): T[];
    aoa_to_sheet(data: unknown[][]): WorkSheet;
    book_new(): WorkBook;
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name?: string): void;
  };

  export function read(data: ArrayBuffer | string, opts?: ReadOpts): WorkBook;
  export function writeFile(wb: WorkBook, filename: string): void;
}
