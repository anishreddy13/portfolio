declare module "pdfjs-dist/build/pdf.min.js" {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export function getDocument(source: { data: ArrayBuffer }): {
    promise: Promise<PDFDocumentProxy>;
  };

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFPageProxy {
    getTextContent(): Promise<{
      items: Array<{ str?: string }>;
    }>;
  }
}

declare module "pdfjs-dist/build/pdf" {
  export * from "pdfjs-dist/build/pdf.min.js";
}
