import { Editor } from '@tiptap/react';
// @ts-ignore
import htmlDocx from 'html-docx-js-typescript';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to trigger download
const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportToHtml = (content: string, title: string) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f8f9fa; }
    img { max-width: 100%; height: auto; }
</style>
</head>
<body>
    <h1>${title}</h1>
    ${content}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadFile(blob, `${title.replace(/\s+/g, '_')}.html`);
};

export const exportToTxt = (editor: Editor, title: string) => {
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain' });
    downloadFile(blob, `${title.replace(/\s+/g, '_')}.txt`);
};

// Basic HTML to Markdown converter
const htmlToMarkdown = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let markdown = '';

    const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            // Escape markdown characters if needed, for now just simplistic
            return node.textContent || '';
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();

            let content = '';
            el.childNodes.forEach(child => {
                content += processNode(child);
            });

            switch (tagName) {
                case 'h1': return `# ${content}\n\n`;
                case 'h2': return `## ${content}\n\n`;
                case 'h3': return `### ${content}\n\n`;
                case 'p': return `${content}\n\n`;
                case 'strong':
                case 'b': return `**${content}**`;
                case 'em':
                case 'i': return `*${content}*`;
                case 'u': return `_${content}_`; // Markdown doesn't really have underline, use italics or nothing
                case 'ul':
                    // Handle nested LI
                    return `${content}\n`;
                case 'ol':
                    return `${content}\n`;
                case 'li':
                    const parent = el.parentElement?.tagName.toLowerCase();
                    const prefix = parent === 'ol' ? '1. ' : '- ';
                    return `${prefix}${content}\n`;
                case 'blockquote': return `> ${content}\n\n`;
                case 'code': return `\`${content}\``;
                case 'pre':
                    // Check if code block
                    const codeChild = el.querySelector('code');
                    const codeContent = codeChild ? codeChild.textContent : content;
                    return `\`\`\`\n${codeContent}\n\`\`\`\n\n`;
                case 'a': return `[${content}](${el.getAttribute('href')})`;
                case 'img': return `![${el.getAttribute('alt') || 'image'}](${el.getAttribute('src')})`;
                case 'br': return '\n';
                case 'div': return `${content}\n`;
                // Tables are hard, skipping simple implementation for now or just text
                default: return content;
            }
        }
        return '';
    };

    doc.body.childNodes.forEach(node => {
        markdown += processNode(node);
    });

    return markdown.trim();
};

export const exportToMarkdown = (editor: Editor, title: string) => {
    const html = editor.getHTML();
    const markdown = `# ${title}\n\n${htmlToMarkdown(html)}`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    downloadFile(blob, `${title.replace(/\s+/g, '_')}.md`);
};

export const exportToDocx = async (content: string, title: string) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
        </head>
        <body>
            <h1>${title}</h1>
            ${content}
        </body>
        </html>
    `;

    // html-docx-js-typescript expects a string html
    const converted = await htmlDocx.asBlob(htmlContent);
    downloadFile(converted as Blob, `${title.replace(/\s+/g, '_')}.docx`);
};

export const exportToPdf = async (element: HTMLElement, title: string) => {
    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Improve quality
            useCORS: true, // Handle images
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height] // One long page for now to avoid tough pagination logic
        });

        // standard A4 ratio is ~1.414. If we want A4 pagination, it's complex.
        // For simplicity, let's just dump the image or resize to fit A4 width.

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
        console.error("PDF Export failed", error);
        alert("Failed to export PDF. Please check console.");
    }
};
