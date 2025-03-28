/**
 * Tiện ích xử lý in ấn và xuất PDF
 */

// Hàm xử lý in tài liệu
export const handlePrint = (title: string, content: string) => {
  // Tạo cửa sổ in mới
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Không thể mở cửa sổ in');
    return;
  }

  // Viết nội dung HTML vào cửa sổ in
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || 'Điều lệ bầu cử'}</title>
      <meta charset="utf-8">
      <style>
        @page {
          size: A4;
          margin: 1cm;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #1a56db;
          text-align: center;
          margin-bottom: 20px;
        }
        h2 {
          color: #2563eb;
          margin-top: 20px;
        }
        h3 {
          color: #3b82f6;
        }
        p, li {
          line-height: 1.5;
        }
        .print-header {
          text-align: right;
          margin-bottom: 20px;
        }
        .print-footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-header no-print">
        <button onclick="window.print();" style="padding: 8px 16px; background: #1a56db; color: white; border: none; border-radius: 4px; cursor: pointer;">In tài liệu</button>
      </div>
      <h1>${title || 'Điều lệ bầu cử'}</h1>
      <div>${content}</div>
      <div class="print-footer">
        Tài liệu được in từ hệ thống bầu cử - ${new Date().toLocaleDateString('vi-VN')}
      </div>
      <script>
        // Tự động mở hộp thoại in sau khi trang đã tải xong
        window.onload = function() {
          // Đợi một chút để đảm bảo trang đã render xong
          setTimeout(function() {
            // Tự động in nếu người dùng không nhấn nút
            // window.print();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
};

// Hàm tải xuống PDF - sử dụng phương pháp khác không phụ thuộc vào thư viện bên ngoài
export const handleDownloadPDF = (title: string, content: string) => {
  // Tạo một iframe ẩn để tạo PDF
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const contentDocument = iframe.contentDocument;
  if (!contentDocument) {
    console.error('Không thể tạo iframe document');
    return;
  }

  // Chuẩn bị tên file an toàn
  const safeFileName = title?.replace(/[^a-zA-Z0-9]/g, '_') || 'dieu_le_bau_cu';

  // Viết nội dung HTML vào iframe
  contentDocument.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || 'Điều lệ bầu cử'}</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #1a56db;
          text-align: center;
          margin-bottom: 20px;
        }
        h2 {
          color: #2563eb;
          margin-top: 20px;
        }
        h3 {
          color: #3b82f6;
        }
        p, li {
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div id="content">
        <h1>${title || 'Điều lệ bầu cử'}</h1>
        <div>${content}</div>
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
          Tài liệu được tạo từ hệ thống bầu cử - ${new Date().toLocaleDateString('vi-VN')}
        </div>
      </div>
    </body>
    </html>
  `);

  contentDocument.close();

  // Sử dụng window.print() để tạo PDF
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();

      // Xóa iframe sau khi hoàn thành
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } catch (error) {
      console.error('Lỗi khi tạo PDF:', error);
      document.body.removeChild(iframe);
    }
  }, 500);
};
