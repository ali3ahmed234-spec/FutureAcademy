const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// تأكد إن اسم الملف هنا مطابق لاسم الملف اللي عملته (questions.json أو action.json)
const DATA_FILE = path.join(__dirname, "questions.json");

function loadQuestions() {
  if (!fs.existsSync(DATA_FILE)) {
    return { questions: [] };
  }
  const rawData = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(rawData);
}

app.get("/", (req, res) => {
  res.json({ status: "FutureAcademy Node.js Backend is running!" });
});

app.get("/api/questions", (req, res) => {
  try {
    const data = loadQuestions();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "فشل قراءة ملف الأسئلة" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});