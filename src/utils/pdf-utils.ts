import * as pdfjsLib from "pdfjs-dist";

// Define strict types for PDF.js text content
interface TextItem {
    str: string;
    dir: string;
    transform: number[]; // [scaleX, skewY, skewX, scaleY, tx, ty]
    width: number;
    height: number;
    fontName: string;
    hasEOL: boolean;
}

interface TextContent {
    items: TextItem[];
    styles: Record<string, any>;
}

export async function parsePdfToHtml(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullHtml = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // Cast to unknown first if strict typing fails, but we defined the interface above
        const textContent = (await page.getTextContent()) as unknown as TextContent;
        const items = textContent.items.filter(item => item.str.trim().length > 0);

        if (items.length === 0) continue;

        // Group items by line (using Y-coordinate with tolerance)
        const lines: { y: number; items: TextItem[] }[] = [];
        const yTolerance = 5; // pixels

        for (const item of items) {
            // PDF coordinate system: Y starts at bottom.
            // transform[5] is ty (translate Y)
            const y = item.transform[5];

            let line = lines.find(l => Math.abs(l.y - y) < yTolerance);
            if (!line) {
                line = { y, items: [] };
                lines.push(line);
            }
            line.items.push(item);
        }

        // Sort lines top to bottom (higher Y is higher on page)
        lines.sort((a, b) => b.y - a.y);

        // Sort items within lines (left to right)
        lines.forEach(line => {
            line.items.sort((a, b) => a.transform[4] - b.transform[4]);
        });

        // Calculate MODE text height (most common font size) to avoid skew from headings
        // Prefer transform[3] (scaleY) as height is often 0 in pdfjs-dist
        const heights = items.map(item => item.transform[3] || item.height || item.transform[0] || 12);
        const heightCounts: Record<number, number> = {};

        heights.forEach(h => {
            const key = Math.round(h * 100) / 100;
            heightCounts[key] = (heightCounts[key] || 0) + 1;
        });

        let modeHeight = 0;
        let maxCount = 0;

        for (const [h, count] of Object.entries(heightCounts)) {
            if (count > maxCount) {
                maxCount = count;
                modeHeight = parseFloat(h);
            }
        }
        if (modeHeight === 0) modeHeight = 12;

        console.log("PDF Parsing Page", i, "Mode Height:", modeHeight);

        let pageHtml = "";
        let currentBlockType = "p";
        let currentBlockContent: string[] = [];
        let lastLineY = lines.length > 0 ? lines[0].y : 0;

        for (const line of lines) {
            const lineText = line.items.map(item => item.str).join(" ");
            const lineHeight = line.items[0].transform[3] || line.items[0].height || modeHeight;

            const gap = lastLineY - line.y; // Positive value

            // Heuristics
            // Heading: significantly larger than body text (1.25x)
            const isHeading = lineHeight > modeHeight * 1.25;
            // Paragraph: gap larger than 1.5x font size (standard leading is ~1.2)
            const isNewParagraph = gap > (modeHeight * 1.5);

            if (isHeading) {
                if (currentBlockContent.length > 0) {
                    pageHtml += `<${currentBlockType}>${currentBlockContent.join(" ")}</${currentBlockType}>`;
                    currentBlockContent = [];
                }

                const tag = lineHeight > modeHeight * 1.6 ? "h2" : "h3";
                pageHtml += `<${tag}>${lineText}</${tag}>`;
                currentBlockType = "p";
            } else {
                if (isNewParagraph && currentBlockContent.length > 0) {
                    pageHtml += `<${currentBlockType}>${currentBlockContent.join(" ")}</${currentBlockType}>`;
                    currentBlockContent = [];
                }
                currentBlockContent.push(lineText);
            }

            lastLineY = line.y;
        }

        // Close any remaining block
        if (currentBlockContent.length > 0) {
            pageHtml += `<${currentBlockType}>${currentBlockContent.join(" ")}</${currentBlockType}>`;
        }

        fullHtml += pageHtml;
    }

    return fullHtml;
}
