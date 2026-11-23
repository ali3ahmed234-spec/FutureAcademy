require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI, Type } = require("@google/genai");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// إعداد استقبال الملفات (صور أو PDF) في الذاكرة المؤقتة
const upload = multer({ storage: multer.memoryStorage() });

// تهيئة Gemini API (يقرأ GEMINI_API_KEY تلقائياً من ملف .env)
const ai = new GoogleGenAI();

// ⚠️ مهم: لو اسم ملفك action.json غير كلمة questions.json هنا إلى action.json
const DATA_FILE = path.join(__dirname, "questions.json");

function loadQuestions() {
  if (!fs.existsSync(DATA_FILE)) {
    return { questions: [] };
  }
  const rawData = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(rawData);
}

function saveQuestions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

app.get("/", (req, res) => {
  res.json({ status: "FutureAcademy AI Backend is running!" });
});

// 1. جلب كل الأسئلة للواجهة الأمامية (Frontend)
app.get("/api/questions", (req, res) => {
  try {
    const data = loadQuestions();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "فشل قراءة ملف الأسئلة" });
  }
});

// 2. استقبال صورة امتحان أو PDF واستخراج الأسئلة وتصنيفها بالذكاء الاصطناعي
app.post("/api/upload-exam", upload.single("examFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "يرجى رفع صورة امتحان أو ملف PDF" });
    }

    const prompt = `
      أنت مساعد أكاديمي ذكي لمنصة FutureAcademy.
      قم باستخراج جميع الأسئلة الموجودة في هذا الملف (صورة امتحان أو PDF) بدقة.
      لكل سؤال، حدد:
      - major: التخصص الأنسب من القائمة فقط ("علوم الحاسب" أو "نظم المعلومات" أو "هندسة البرمجيات" أو "الذكاء الاصطناعي").
      - year: السنة الدراسية الأنسب من القائمة فقط ("السنة الأولى" أو "السنة الثانية" أو "السنة الثالثة" أو "السنة الرابعة").
      - subject: اسم المادة الدراسية (مثل: هياكل البيانات، قواعد البيانات، تعلم الآلة، برمجة الويب...).
      - question: نص السؤال كاملاً وواضحاً.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          inlineData: {
            data: req.file.buffer.toString("base64"),
            mimeType: req.file.mimetype,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              major: { type: Type.STRING },
              year: { type: Type.STRING },
              subject: { type: Type.STRING },
              question: { type: Type.STRING },
            },
            required: ["major", "year", "subject", "question"],
          },
        },
      },
    });

    const extractedQuestions = JSON.parse(response.text);
    const currentData = loadQuestions();
    let nextId = currentData.questions.length > 0 
      ? Math.max(...currentData.questions.map((q) => q.id)) + 1 
      : 1;

    const addedQuestions = extractedQuestions.map((item) => ({
      id: nextId++,
      major: item.major,
      year: item.year,
      subject: item.subject,
      question: item.question,
      sourceType: "ai-extracted",
    }));

    currentData.questions.push(...addedQuestions);
    saveQuestions(currentData);

    res.json({
      message: `تم استخراج وإضافة ${addedQuestions.length} سؤال بنجاح!`,
      addedCount: addedQuestions.length,
      questions: addedQuestions,
    });
  } catch (error) {
    console.error("AI Extraction Error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحليل الملف بالذكاء الاصطناعي" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
