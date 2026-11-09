/**
 * Google Gemini API Service for 10A5 Classroom Emulation & Games
 * Supports Multi-Key Pool with Automatic Failover & Cloud Firestore Sync
 */

export interface GeminiApiKeyItem {
  id: string;
  key: string;
  label: string;
  isActive: boolean;
  status?: 'valid' | 'rate_limited' | 'error' | 'untested';
  statusMessage?: string;
  lastUsedAt?: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

const STORAGE_KEY_API_KEY = 'app_gemini_api_key';
const STORAGE_KEY_MODEL = 'app_gemini_model';
const STORAGE_KEY_KEYS_POOL = 'app_gemini_keys_pool';
const STORAGE_KEY_AUTO_ROTATE = 'app_gemini_auto_rotate';

/**
 * Get all configured Gemini API keys
 */
export const getGeminiKeysPool = (): GeminiApiKeyItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KEYS_POOL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Gemini] Lỗi đọc danh sách API keys:', err);
  }

  // Backwards compatibility with single key
  const legacyKey = localStorage.getItem(STORAGE_KEY_API_KEY)?.trim() || '';
  if (legacyKey) {
    const initialPool: GeminiApiKeyItem[] = [
      {
        id: 'key_default',
        key: legacyKey,
        label: 'Key chính (Mặc định)',
        isActive: true,
        status: 'untested',
      },
    ];
    saveGeminiKeysPool(initialPool);
    return initialPool;
  }

  return [];
};

/**
 * Save Gemini Keys Pool to localStorage & keep active key in legacy slot
 */
export const saveGeminiKeysPool = (keys: GeminiApiKeyItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_KEYS_POOL, JSON.stringify(keys));
    const active = keys.find(k => k.isActive) || keys[0];
    if (active) {
      localStorage.setItem(STORAGE_KEY_API_KEY, active.key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    }
  } catch (err) {
    console.warn('[Gemini] Lỗi lưu danh sách API keys:', err);
  }
};

/**
 * Get active API key
 */
export const getGeminiApiKey = (): string => {
  const pool = getGeminiKeysPool();
  const active = pool.find(k => k.isActive) || pool[0];
  return active ? active.key.trim() : (localStorage.getItem(STORAGE_KEY_API_KEY) || '');
};

/**
 * Set single API key (adds or updates active key in pool)
 */
export const setGeminiApiKey = (key: string): void => {
  const cleanKey = key.trim();
  localStorage.setItem(STORAGE_KEY_API_KEY, cleanKey);
  const pool = getGeminiKeysPool();
  if (pool.length === 0 && cleanKey) {
    saveGeminiKeysPool([
      {
        id: `key_${Date.now()}`,
        key: cleanKey,
        label: 'Key 1 (Mặc định)',
        isActive: true,
        status: 'untested',
      },
    ]);
  } else if (pool.length > 0) {
    let hasActive = false;
    const updated = pool.map(item => {
      if (item.isActive) {
        hasActive = true;
        return { ...item, key: cleanKey };
      }
      return item;
    });
    if (!hasActive && updated.length > 0) {
      updated[0].isActive = true;
      updated[0].key = cleanKey;
    }
    saveGeminiKeysPool(updated);
  }
};

/**
 * Get Auto-rotate setting (default: true)
 */
export const getGeminiAutoRotate = (): boolean => {
  const val = localStorage.getItem(STORAGE_KEY_AUTO_ROTATE);
  return val === null ? true : val === 'true';
};

/**
 * Set Auto-rotate setting
 */
export const setGeminiAutoRotate = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEY_AUTO_ROTATE, String(enabled));
};

export const getGeminiModel = (): string => {
  return localStorage.getItem(STORAGE_KEY_MODEL) || 'gemini-3.0-flash';
};

export const setGeminiModel = (model: string): void => {
  localStorage.setItem(STORAGE_KEY_MODEL, model);
};

/**
 * Call a single key directly
 */
async function executeGeminiRequest(apiKey: string, model: string, prompt: string, systemInstruction?: string): Promise<string> {
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
    const message = errorData?.error?.message || `HTTP ${response.status}`;
    const err: any = new Error(message);
    err.status = response.status;
    err.isRateLimit = response.status === 429 || /quota|exhausted|rate\s*limit/i.test(message);
    throw err;
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
 * Direct call to Gemini REST API with automatic multi-key rotation and failover
 */
export async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  const pool = getGeminiKeysPool();
  if (pool.length === 0) {
    const legacyKey = localStorage.getItem(STORAGE_KEY_API_KEY);
    if (!legacyKey) {
      throw new Error('Chưa cấu hình Gemini API Key. Vui lòng thêm ít nhất 1 API Key trong bảng Cài đặt AI.');
    }
  }

  const model = getGeminiModel();
  const autoRotate = getGeminiAutoRotate();

  // Sort candidate keys: active key first, then other available keys
  const candidateKeys = [...pool].sort((a, b) => {
    if (a.isActive) return -1;
    if (b.isActive) return 1;
    return 0;
  });

  if (candidateKeys.length === 0) {
    throw new Error('Chưa có API Key nào được cài đặt.');
  }

  let lastError: any = null;

  for (let i = 0; i < candidateKeys.length; i++) {
    const currentItem = candidateKeys[i];
    try {
      const text = await executeGeminiRequest(currentItem.key, model, prompt, systemInstruction);

      // Success! Update status of this key
      currentItem.status = 'valid';
      currentItem.statusMessage = 'Hoạt động tốt';
      currentItem.lastUsedAt = new Date().toISOString();
      
      // If we rotated away from the active key, make this newly working key active
      if (!currentItem.isActive && autoRotate) {
        candidateKeys.forEach(k => { k.isActive = (k.id === currentItem.id); });
      }
      saveGeminiKeysPool(candidateKeys);

      return text;
    } catch (err: any) {
      lastError = err;
      if (err.isRateLimit) {
        currentItem.status = 'rate_limited';
        currentItem.statusMessage = 'Quá hạn ngạch (429) - Đã tự động chuyển key khác';
      } else {
        currentItem.status = 'error';
        currentItem.statusMessage = err.message || 'Lỗi kết nối';
      }
      saveGeminiKeysPool(candidateKeys);

      // If autoRotate is disabled or no more keys to try, break
      if (!autoRotate || i === candidateKeys.length - 1) {
        break;
      }
      console.warn(`[Gemini] Key "${currentItem.label}" bị lỗi (${err.message}). Đang tự động chuyển sang Key tiếp theo...`);
    }
  }

  throw lastError || new Error('Không thể kết nối với bất kỳ Gemini API Key nào trong danh sách.');
}

/**
 * Test a specific Gemini API Key
 */
export async function testSpecificGeminiKey(key: string, modelOverride?: string): Promise<{ success: boolean; message: string }> {
  try {
    const model = modelOverride || getGeminiModel();
    const text = await executeGeminiRequest(
      key.trim(),
      model,
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
 * Test Gemini API connection using active key
 */
export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  const activeKey = getGeminiApiKey();
  if (!activeKey) {
    return {
      success: false,
      message: 'Chưa cấu hình API Key nào!',
    };
  }
  return testSpecificGeminiKey(activeKey);
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
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed: CallingGameQuestion[] = JSON.parse(cleaned);
    return parsed;
  } catch {
    return [
      {
        id: 'q1',
        cauHoi: `Câu hỏi ôn tập ${params.monHoc}: ${rawText.slice(0, 150)}...`,
        dapAn: 'Xem đáp án trong sách giáo khoa',
      },
    ];
  }
}

/**
 * AI Tool 3: Smart Universal Data Recognizer & Parser
 * Analyzes arbitrary raw text/file contents (seating chart, roster, infractions)
 * and returns normalized structured JSON ready to import.
 */
export interface SmartDataAnalysisResult {
  detectedType: 'seating' | 'roster' | 'records' | 'grades' | 'unknown';
  confidence: number;
  summary: string;
  payload: any;
  suggestions?: string[];
}

export async function analyzeAndExtractClassDataAI(rawContent: string): Promise<SmartDataAnalysisResult> {
  const systemInstruction = 
    'Bạn là chuyên gia phân tích dữ liệu giáo dục cho hệ thống quản lý lớp học THPT. ' +
    'Nhiệm vụ của bạn là đọc dữ liệu thô (có thể là danh sách học sinh, sơ đồ lớp, biên bản vi phạm, hoặc bảng điểm) ' +
    'và tự động nhận diện loại dữ liệu, trích xuất chuẩn hóa thành JSON.';

  const prompt = `
Hãy phân tích nội dung dữ liệu thô dưới đây:
---
${rawContent.slice(0, 4000)}
---

YÊU CẦU:
Trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc sau (không kèm lời dẫn Markdown bên ngoài):
{
  "detectedType": "seating" | "roster" | "records" | "grades" | "unknown",
  "confidence": 0.95,
  "summary": "Tóm tắt ngắn 1-2 câu về nội dung và số lượng phát hiện được",
  "payload": {
    // Nếu là "roster": mảng [ { "stt": 1, "hoTen": "...", "gioiTinh": "Nam"|"Nu", "to": 1|2|3|4, "chucVu": "..." } ]
    // Nếu là "seating": mảng [ { "deskId": "d_1_1", "seatNumber": 1, "studentName": "...", "row": 1, "col": 1 } ]
    // Nếu là "records": mảng [ { "hoTen": "...", "tenHanhVi": "...", "diemTru": 2, "thoiGian": "...", "tuan": 1, "ghiChu": "..." } ]
    // Nếu là "grades": mảng [ { "hoTen": "...", "monHoc": "...", "diem": 9.0 } ]
  },
  "suggestions": [
    "Gợi ý 1 cho giáo viên...",
    "Gợi ý 2..."
  ]
}
`;

  const rawText = await callGeminiApi(prompt, systemInstruction);

  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed: SmartDataAnalysisResult = JSON.parse(cleaned);
    return parsed;
  } catch (err: any) {
    console.error('Lỗi parse JSON kết quả phân tích AI:', err, rawText);
    return {
      detectedType: 'unknown',
      confidence: 0.3,
      summary: 'Không thể tự động phân tích cấu trúc JSON chuẩn: ' + (err.message || 'Lỗi định dạng'),
      payload: null,
      suggestions: ['Thầy vui lòng kiểm tra lại nội dung dán hoặc chọn loại nhập thủ công.'],
    };
  }
}

/**
 * AI Tool 4: Intelligent Seating Arrangement Optimization
 * Analyzes current student list + seat positions + violations to suggest optimal seat swaps.
 */
export interface SeatingOptimizationResult {
  reasoning: string;
  swaps: {
    studentA: string;
    studentB: string;
    reason: string;
  }[];
  newLayoutSuggestions: string;
}

export async function optimizeSeatingWithAI(params: {
  students: { maHS: string; hoTen: string; to: number; gioiTinh: string }[];
  currentSeats: { deskId: string; seatNumber: number; studentId?: string; studentName?: string; row: number; col: number }[];
  recentViolations: { hoTen: string; tenHanhVi: string; soLan: number }[];
}): Promise<SeatingOptimizationResult> {
  const systemInstruction = 
    'Bạn là chuyên gia tâm lý sư phạm và quản lý lớp học THPT. ' +
    'Nhiệm vụ của bạn là phân tích sơ đồ chỗ ngồi hiện tại kết hợp với lịch sử vi phạm nề nếp ' +
    'để đưa ra phương án đổi chỗ ngồi thông minh nhất (tách các bạn hay nói chuyện, bố trí học sinh kèm cặp nhau, cân bằng nam nữ).';

  const prompt = `
Dữ liệu lớp 10A5 hiện tại:
- Sơ đồ chỗ ngồi hiện tại (${params.currentSeats.length} vị trí):
${params.currentSeats.slice(0, 30).map(s => `  Bàn ${s.row}-${s.col} (Ghế ${s.seatNumber}): ${s.studentName || 'Trống'}`).join('\n')}

- Các học sinh có vi phạm nề nếp gần đây:
${params.recentViolations.length > 0 ? params.recentViolations.map(v => `  - ${v.hoTen}: ${v.tenHanhVi} (${v.soLan} lần)`).join('\n') : '  - Không có vi phạm đáng kể'}

YÊU CẦU:
Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown thừa):
{
  "reasoning": "Nhận xét tổng thể về sơ đồ hiện tại và nguyên tắc sắp xếp đề xuất (2-3 câu)...",
  "swaps": [
    {
      "studentA": "Tên học sinh 1",
      "studentB": "Tên học sinh 2",
      "reason": "Lý do hoán đổi (ví dụ: tách khỏi bạn cùng bàn hay nói chuyện, hỗ trợ học tập...)"
    }
  ],
  "newLayoutSuggestions": "Lời khuyên thêm cho Thầy chủ nhiệm khi quản lý trật tự lớp."
}
`;

  const rawText = await callGeminiApi(prompt, systemInstruction);

  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    return {
      reasoning: 'AI đã phân tích sơ đồ lớp và lịch sử vi phạm: Đề xuất luân chuyển vị trí giữa các tổ để tạo động lực mới.',
      swaps: [],
      newLayoutSuggestions: rawText.slice(0, 300),
    };
  }
}

