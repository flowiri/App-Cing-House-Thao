import { GoogleGenAI } from '@google/genai';
import { Product } from '../types';

export type ParsedOrderImageItem = {
  name: string;
  quantity: number;
  size?: string;
  note?: string;
};

export type ParsedOrderImage = {
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  requestedTime?: string;
  channel?: string;
  items: ParsedOrderImageItem[];
  notes?: string;
};

type DataUrlParts = {
  mimeType: string;
  base64: string;
};

function getGeminiApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
}

function dataUrlToParts(dataUrl: string): DataUrlParts {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) throw new Error('Ảnh không đúng định dạng data URL.');
  return {
    mimeType: match[1],
    base64: match[2]
  };
}

function parseJsonResponse(text: string): ParsedOrderImage {
  const cleaned = text
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();
  const parsed = JSON.parse(cleaned) as Partial<ParsedOrderImage>;

  return {
    customerName: parsed.customerName || '',
    customerPhone: parsed.customerPhone || '',
    deliveryAddress: parsed.deliveryAddress || '',
    requestedTime: parsed.requestedTime || '',
    channel: parsed.channel || '',
    items: Array.isArray(parsed.items)
      ? parsed.items
          .map(item => ({
            name: String(item.name || '').trim(),
            quantity: Math.max(1, Number(item.quantity) || 1),
            size: item.size ? String(item.size).trim() : '',
            note: item.note ? String(item.note).trim() : ''
          }))
          .filter(item => item.name)
      : [],
    notes: parsed.notes || ''
  };
}

export async function parseOrderImage(dataUrl: string, products: Product[]): Promise<ParsedOrderImage> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Thiếu VITE_GEMINI_API_KEY trong file .env.local để dùng tính năng tự nhập từ ảnh.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const image = dataUrlToParts(dataUrl);
  const productNames = products
    .slice(0, 400)
    .map(product => `${product.name} (${product.sku})`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64
        }
      },
      {
        text: `Bạn là trợ lý nhập đơn cho quán F&B Cing House.
Đọc ảnh screenshot chat/order/menu và trích xuất dữ liệu đơn hàng.

Danh sách sản phẩm trong catalog để đối chiếu:
${productNames || 'Không có catalog'}

Yêu cầu trả về DUY NHẤT JSON hợp lệ, không markdown:
{
  "customerName": "tên khách nếu thấy, ví dụ tên header chat",
  "customerPhone": "số điện thoại nếu thấy",
  "deliveryAddress": "địa chỉ giao hàng nếu thấy",
  "requestedTime": "thời gian giao/nhận nếu thấy",
  "channel": "Facebook | Instagram | Zalo | Khác",
  "items": [
    { "name": "tên món", "quantity": 1, "size": "L nếu thấy", "note": "ít đường/không topping/ghi chú riêng nếu có" }
  ],
  "notes": "các ghi chú còn lại cần đưa vào đơn"
}

Quy tắc:
- Nếu ảnh có bảng món và cột số lượng, hãy lấy tất cả dòng món kèm số lượng.
- Không lấy dòng tổng cộng làm món.
- Nếu khách nói tất cả size L, gắn size L cho các món.
- Nếu không chắc tên món, vẫn trả về tên đọc được gần nhất.
- Không bịa số điện thoại, địa chỉ, món hoặc số lượng.`
      }
    ],
    config: {
      responseMimeType: 'application/json'
    }
  });

  return parseJsonResponse(response.text || '{}');
}
