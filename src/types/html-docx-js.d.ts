declare module 'html-docx-js/dist/html-docx' {
    /**
     * Converts HTML content to a DOCX blob
     * @param htmlSource - HTML string to convert
     * @returns Blob containing the DOCX file
     */
    export function asBlob(htmlSource: string): Blob;

    /**
     * Converts HTML content to a DOCX blob with options
     * @param htmlSource - HTML string to convert
     * @param options - Conversion options
     * @returns Blob containing the DOCX file
     */
    export function asBlob(htmlSource: string, options: any): Blob;
}
