// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');

const url = 'https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf';

https.get(url, (res) => {
    const data = [];
    res.on('data', (chunk) => data.push(chunk));
    res.on('end', () => {
        const buffer = Buffer.concat(data);
        const base64 = buffer.toString('base64');
        const tsContent = `import { jsPDF } from 'jspdf';\n\nexport const addRobotoFont = (doc: jsPDF) => {\n    const font = '${base64}';\n    doc.addFileToVFS('Roboto-Regular.ttf', font);\n    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');\n};\n`;
        fs.writeFileSync('src/utils/robotoFont.ts', tsContent);
        console.log('Font downloaded and TS file created successfully.');
    });
}).on('error', (err) => {
    console.error('Error downloading font:', err);
});
