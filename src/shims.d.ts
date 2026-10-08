declare module 'pdfjs-dist' {
  export const GlobalWorkerOptions: { workerSrc: string }
  export function getDocument(source: { data: ArrayBuffer }): {
    promise: Promise<{
      numPages: number
      getPage(pageNumber: number): Promise<{ getTextContent(): Promise<{ items: unknown[] }> }>
    }>
    destroy(): Promise<void>
  }
}

declare module 'pdfjs-dist/build/pdf.worker.mjs?url' {
  const url: string
  export default url
}

declare module 'mammoth/mammoth.browser.js' {
  type MammothResult = { value: string; messages: { message: string }[] }
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>
}
