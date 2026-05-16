// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');

// Sử dụng font jsPDF custom build từ repo uy tín chuyên hỗ trợ UTF-8 (Roboto)
const url = 'https://raw.githubusercontent.com/davidjbradshaw/React-Markdown-PDF/master/fonts/Roboto-Regular.js';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Biến đổi JS dạng global của thư viện thành Module chuẩn cho TS/React
        const tsContent = `import { jsPDF } from 'jspdf';
        
export const addRobotoFont = (doc: jsPDF) => {
    ${data.replace('var font = ', 'const font = ').replace('jsPDF.API.events.push', '// jsPDF.API.events.push')}
    doc.addFileToVFS('Roboto-Regular.ttf', font);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto', 'normal');
};
`;
        fs.writeFileSync('src/utils/robotoFont.ts', tsContent);
        console.log('Downloaded and converted valid VFS font successfully.');
    });
}).on('error', (err) => {
    console.error('Error:', err);
});
