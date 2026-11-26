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

const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI();

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

// دالة ذكية بتجرب أكتر من موديل لو واحد منهم عليه ضغط 503
async function generateWithFallback(contents, config) {
  const modelsToTry = [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash"
  ];

  let lastError;
  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      });
      console.log(`Success with model: ${modelName}`);
      return response;
    } catch (err) {
      console.warn(`Model ${modelName} failed (${err.status || err.message})`);
      lastError = err;
      if (err.status === 503 || err.status === 429 || err.status === 404) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

app.get("/", (req, res) => {
  res.json({ status: "FutureAcademy AI Backend is running!" });
});

app.get("/api/questions", (req, res) => {
  try {
    const data = loadQuestions();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "فشل قراءة ملف الأسئلة" });
  }
});

app.post("/api/upload-exam", upload.single("examFile"), async (req, res) => {
  try {
    const adminPass = req.body.password;
    if (!adminPass || adminPass !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "كلمة مرور الأدمن غير صحيحة! غير مصرح لك بالرفع." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "يرجى رفع صورة امتحان أو ملف PDF" });
    }

    // استقبال السنة والتخصص المختارين من صفحة الأدمن
    const selectedYear = req.body.year;
    const selectedMajor = req.body.major;

    const prompt = `
      أنت مساعد أكاديمي ذكي لمنصة FutureAcademy.
      قم باستخراج جميع الأسئلة الموجودة في هذا الملف بدقة.
      لكل سؤال، استخرج:
      - major: اجعلها "${selectedMajor || "علوم الحاسب"}" (التخصصات المتاحة فقط: "علوم الحاسب" أو "نظم المعلومات" أو "إدارة" أو "إدارة إنجليزي").
      - year: اجعلها "${selectedYear || "السنة الأولى"}" (السنوات المتاحة فقط: "السنة الأولى" أو "السنة الثانية" أو "السنة الثالثة" أو "السنة الرابعة").
      - subject: اسم المادة الدراسية (مثل: هياكل البيانات، قواعد البيانات، مبادئ الإدارة، المحاسبة...).
      - question: نص السؤال فقط (بدون كتابة الاختيارات a, b, c, d بداخله، وبدون رقم السؤال).
      - options: كائن يحتوي على الاختيارات الأربعة (A, B, C, D) إن وجدت (بدون كتابة الحرف a) أو b) داخل نص الاختيار نفسه). إذا كان السؤال مقالياً، اجعلها نصوصاً فارغة "".
      - correctAnswer: حرف الإجابة الصحيحة فقط ("A" أو "B" أو "C" أو "D") بناءً على معرفتك الأكاديمية أو العلامات الموجودة في الورقة. إذا كان السؤال مقالياً اجعله "".
    `;

    const contents = [
      {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      },
      prompt,
    ];

    const config = {
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
            options: {
              type: Type.OBJECT,
              properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
              },
              required: ["A", "B", "C", "D"],
            },
            correctAnswer: { type: Type.STRING },
          },
          required: ["major", "year", "subject", "question", "options", "correctAnswer"],
        },
      },
    };

    const response = await generateWithFallback(contents, config);

    const extractedQuestions = JSON.parse(response.text);
    const currentData = loadQuestions();
    let nextId = currentData.questions.length > 0
      ? Math.max(...currentData.questions.map((q) => q.id)) + 1
      : 1;

    const addedQuestions = extractedQuestions.map((item) => ({
      id: nextId++,
      major: selectedMajor || item.major,
      year: selectedYear || item.year,
      subject: item.subject,
      question: item.question,
      options: item.options,
      correctAnswer: item.correctAnswer,
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
    res.status(500).json({
      error: `فشل التحليل (${error.status || "Error"}): ${error.message || "حاول مرة أخرى"}`
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});