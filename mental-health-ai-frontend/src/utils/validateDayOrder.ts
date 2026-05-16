/**
 * Utility để validate và sửa thứ tự ngày trong lộ trình (Ngày 1, Ngày 2, etc)
 */

export function validateAndCorrectDayOrder(text: string): string {
    const lines = text.split('\n');
    const dayItems: Array<{ firstDay: number; originalLine: string }> = [];
    const otherLines: string[] = [];

    // Regex để tìm dòng "- Ngày X-Y:" hoặc "- Ngày X:"
    const dayPattern = /^-?\s*Ngày\s+(\d+(?:-\d+)?)\s*:/i;

    for (const line of lines) {
        const match = line.match(dayPattern);
        if (match) {
            const dayRange = match[1];
            // Lấy số ngày đầu tiên để dùng cho sắp xếp
            const firstDay = parseInt(dayRange.split('-')[0], 10);
            dayItems.push({ firstDay, originalLine: line });
        } else {
            otherLines.push(line);
        }
    }

    // Nếu không có dòng ngày hoặc có ít hơn 3 dòng, return nguyên bản
    if (dayItems.length < 3) {
        return text;
    }

    // Kiểm tra nếu đơn hàng bị lộn
    const dayNumbers = dayItems.map(d => d.firstDay);
    const expectedOrder = [...dayNumbers].sort((a, b) => a - b);

    // So sánh thứ tự
    const isSorted = dayNumbers.every((val, idx) => val === expectedOrder[idx]);

    if (isSorted) {
        // Thứ tự đúng rồi
        return text;
    }

    // Sắp xếp lại
    dayItems.sort((a, b) => a.firstDay - b.firstDay);
    const sortedLines = dayItems.map(item => item.originalLine);

    // Ghép lại với các dòng khác
    const resultLines = [...sortedLines, ...otherLines];
    return resultLines.join('\n');
}
