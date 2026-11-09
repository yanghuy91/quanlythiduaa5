/**
 * Google Gemini API Service for 10A5 Classroom Emulation & Games
 */

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

const STORAGE_KEY_API_KEY = 'app_gemini_api_key';
const STORAGE_KEY_MODEL = 'app_gemini_model';

export const getGeminiApiKey = (): string => {
  return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
};

export const setGeminiApiKey = (key: string): void => {
  localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
};

export const getGeminiModel = (): string => {
  return localStorage.getItem(STORAGE_KEY_MODEL) || 'gemini-2.5-flash';
};

export const setGeminiModel = (model: string): void => {
  localStorage.setItem(STORAGE_KEY_MODEL, model);
};

/**
 * Direct call to Gemini REST API (Client-side safe for Teacher local configuration)
 */
async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng nhập API Key trong bảng Cài đặt Giáo viên.');
  }

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [
        {
          text: systemInstruction,
        },
      ],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Lỗi kết nối Gemini API (HTTP ${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Không nhận được phản hồi văn bản từ Gemini.');
  }

  return text;
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const text = await callGeminiApi(
      'Xin chào! Hãy phản hồi ngắn gọn: "Kết nối Gemini API thành công!" bằng tiếng Việt.'
    );
    return {
      success: true,
      message: text.trim(),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Lỗi không xác định khi kết nối Gemini API.',
    };
  }
}

/**
 * AI Tool 1: Analyze weekly emulation & generate report + parent messages
 */
export async function generateEmulationReportAI(params: {
  tuanHoc: number;
  topStudents: { hoTen: string; to: number; diem: number }[];
  warningStudents: { hoTen: string; to: number; diem: number; loi: string[] }[];
  commonViolations: { tenHanhVi: string; soLan: number }[];
  tongDiemLop: number;
}): Promise<string> {
  const systemInstruction = 
    'Bạn là trợ lý Giáo viên Chủ nhiệm chuyên nghiệp cho lớp 10A5 - Trường THPT Số 2 Đức Phổ. ' +
    'Phong cách viết khách quan, sư phạm, khích lệ học sinh, không phê phán nặng nề, nhấn mạnh tiến bộ và biện pháp khắc phục.';

  const prompt = `
Dưới đây là số liệu thi đua nề nếp của lớp 10A5 trong Tuần ${params.tuanHoc}:
- Danh sách học sinh tiêu biểu xuất sắc (Top điểm cao):
${params.topStudents.map((s, i) => `  ${i + 1}. ${s.hoTen} (Tổ ${s.to}) - ${s.diem} điểm`).join('\n')}

- Danh sách học sinh cần lưu ý / nhắc nhở chấn chỉnh:
${params.warningStudents.length > 0 ? params.warningStudents.map((s, i) => `  ${i + 1}. ${s.hoTen} (Tổ ${s.to}) - ${s.diem} điểm - Vi phạm: ${s.loi.join(', ')}`).join('\n') : '  Không có (Cả lớp đều đạt chuẩn tốt)'}

- Các lỗi vi phạm phổ biến nhất trong tuần:
${params.commonViolations.length > 0 ? params.commonViolations.map((v, i) => `  ${i + 1}. ${v.tenHanhVi} (${v.soLan} lượt)`).join('\n') : '  Không có lỗi đáng kể'}

Hãy soạn thảo:
1. [BÁO CÁO SINH HOẠT LỚP]: Tóm tắt 3-4 câu đánh giá chung nề nếp tuần, khen ngợi và rút kinh nghiệm.
2. [MẪU TIN NHẮN GỬI PHỤ HUYNH]:
   - 1 mẫu khen ngợi học sinh nề nếp tốt.
   - 1 mẫu nhắc nhở nhẹ nhàng phụ huynh học sinh có vi phạm để gia đình cùng phối hợp.
3. [KẾ HOẠCH HÀNH ĐỘNG TUẦN TỚI]: 3 biện pháp thiết thực cho Ban cán sự và Tổ trưởng thực hiện.
`;

  return await callGeminiApi(prompt, systemInstruction);
}

/**
 * AI Tool 2: Generate Quiz / Challenge Questions for 10 Calling Games
 */
export interface CallingGameQuestion {
  id: string;
  cauHoi: string;
  luaChon?: string[];
  dapAn: string;
  giaiThich?: string;
}

export async function generateCallingGameQuestionsAI(params: {
  monHoc: string;
  chuDe: string;
  soLuong?: number;
}): Promise<CallingGameQuestion[]> {
  const count = params.soLuong || 5;
  const systemInstruction = 
    'Bạn là giáo viên THPT chuyên môn giỏi. Hãy tạo câu hỏi trắc nghiệm hoặc vấn đáp nhanh, thú vị, phù hợp học sinh lớp 10. ' +
    'Định dạng trả về BẮT BUỘC là mảng JSON hợp lệ, không có markdown formatting thừa ngoài code block JSON.';

  const prompt = `
Tạo ${count} câu hỏi khởi động / kiểm tra bài cũ nhanh cho học sinh Lớp 10:
- Môn học: ${params.monHoc}
- Chủ đề: ${params.chuDe}

Định dạng JSON yêu cầu:
[
  {
    "id": "q1",
    "cauHoi": "Nội dung câu hỏi ngắn gọn...",
    "luaChon": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "dapAn": "Đáp án đúng (ví dụ: A hoặc lời giải)",
    "giaiThich": "Giải thích ngắn 1 câu"
  }
]
`;

  const rawText = await callGeminiApi(prompt, systemInstruction);
  
  try {
    // Clean code fences if present
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed: CallingGameQuestion[] = JSON.parse(cleaned);
    return parsed;
  } catch {
    // Fallback if not pure JSON
    return [
      {
        id: 'q1',
        cauHoi: `Câu hỏi ôn tập ${params.monHoc}: ${rawText.slice(0, 150)}...`,
        dapAn: 'Xem đáp án trong sách giáo khoa',
      },
    ];
  }
}
