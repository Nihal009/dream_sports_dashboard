import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateBookingsReport = (bookings) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(0, 55, 117); // Al-Nassr Blue
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(252, 201, 16); // Al-Nassr Yellow
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AL-NASSR FC', 105, 20, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Bookings Report', 105, 30, { align: 'center' });

    // Meta Info
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 50);

    // Table
    const tableColumn = ["ID", "User", "Date", "Time", "Court", "Status", "Amount"];
    const tableRows = [];

    bookings.forEach(booking => {
        const bookingData = [
            booking.id,
            booking.user,
            booking.date,
            booking.time,
            booking.court,
            booking.status,
            `$${booking.amount}`
        ];
        tableRows.push(bookingData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        theme: 'grid',
        headStyles: {
            fillColor: [0, 55, 117], // Al-Nassr Blue
            textColor: [252, 201, 16], // Al-Nassr Yellow
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Al-Nassr Admin Portal - Confidential', 105, 290, { align: 'center' });
    }

    doc.save('bookings_report.pdf');
};

export const generateIncomeReport = (data, period) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(0, 55, 117);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(252, 201, 16);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AL-NASSR FC', 105, 20, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Income Report - ${period.toUpperCase()}`, 105, 30, { align: 'center' });

    // Content
    // This would be similar to bookings but for income data
    // For now we just focus on bookings as requested primarily
};
