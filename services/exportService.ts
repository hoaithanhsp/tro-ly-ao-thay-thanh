import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { Message, Role } from '../types';

/**
 * Xuất lịch sử chat ra file Word (.docx)
 */
export async function exportChatToWord(messages: Message[]): Promise<void> {
    // Tạo nội dung từ messages
    const children: Paragraph[] = [];

    // Tiêu đề
    children.push(
        new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: "Lịch Sử Hỗ Trợ Học Tập", bold: true, size: 48 })
            ],
            spacing: { after: 400 }
        })
    );

    // Thông tin
    children.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({
                    text: `Xuất lúc: ${new Date().toLocaleString('vi-VN')}`,
                    italics: true,
                    color: "666666"
                })
            ],
            spacing: { after: 400 }
        })
    );

    // Đường kẻ phân cách
    children.push(
        new Paragraph({
            border: { bottom: { color: "999999", size: 1, style: "single", space: 1 } },
            spacing: { after: 300 }
        })
    );

    // Các tin nhắn
    for (const msg of messages) {
        const isUser = msg.role === Role.USER;
        const sender = isUser ? "📝 Học sinh" : "👨‍🏫 Thầy Thanh";
        const time = msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        // Tên người gửi
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${sender} `,
                        bold: true,
                        color: isUser ? "2563EB" : "16A34A"
                    }),
                    new TextRun({
                        text: `(${time})`,
                        size: 18,
                        color: "999999"
                    })
                ],
                spacing: { before: 200 }
            })
        );

        // Nội dung tin nhắn (xử lý từng dòng)
        const lines = msg.text.split('\n');
        for (const line of lines) {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: line || ' ' })],
                    indent: { left: 360 }
                })
            );
        }

        // Nếu có ảnh, ghi chú
        if (msg.image) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "[Có ảnh đính kèm - không thể xuất]",
                            italics: true,
                            color: "999999"
                        })
                    ],
                    indent: { left: 360 }
                })
            );
        }
    }

    // Footer
    children.push(
        new Paragraph({
            border: { top: { color: "999999", size: 1, style: "single", space: 1 } },
            spacing: { before: 400 }
        })
    );

    children.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({
                    text: "Trợ Lý Ảo Thầy Trần Hoài Thanh - THPT Khúc Thừa Dụ",
                    italics: true,
                    color: "666666"
                })
            ]
        })
    );

    // Tạo document
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: "Arial", size: 24 }
                }
            }
        },
        sections: [{
            properties: {
                page: {
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                }
            },
            children
        }]
    });

    // Export và download
    const buffer = await Packer.toBlob(doc);
    const url = URL.createObjectURL(buffer);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tro-ly-ao-${new Date().toISOString().slice(0, 10)}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
