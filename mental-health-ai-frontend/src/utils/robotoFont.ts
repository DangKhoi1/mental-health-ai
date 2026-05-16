import { jsPDF } from 'jspdf';

export const addRobotoFont = (doc: jsPDF) => {
    try {
        doc.setFont('times', 'normal');
    } catch {
        doc.setFont('helvetica', 'normal');
    }
};
