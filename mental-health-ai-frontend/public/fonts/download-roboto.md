# Hướng dẫn thêm font Roboto cho PDF

## Cách 1: Download font từ Google Fonts
1. Truy cập: https://fonts.google.com/specimen/Roboto
2. Download font Roboto  
3. Convert file TTF thành format jsPDF tại: https://peckcoding.github.io/font-to-jspdf-vfs/
4. Copy code vào file `RobotoFont.ts`

## Cách 2: Sử dụng font có sẵn (Tạm thời)
- jsPDF hỗ trợ các font: helvetica, times, courier
- Font 'times' có hỗ trợ Unicode tốt hơn
- Tuy nhiên vẫn có thể lỗi với một số ký tự tiếng Việt

## Cách 3: Sử dụng thư viện khác (Khuyến nghị)
- Dùng `pdfmake` - hỗ trợ custom fonts tốt hơn
- Dùng `@react-pdf/renderer` - modern React solution
- Dùng `html2canvas` + `jsPDF` để render HTML thành PDF

## Giải pháp tạm thời đang áp dụng:
- Sử dụng font 'times' của jsPDF
- Một số ký tự tiếng Việt có thể hiển thị không đúng
- Cần add custom Roboto font để hiển thị hoàn hảo
