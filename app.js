// مصفوفة بسيطة لتخزين الأسئلة
let questions = [
  { subject: "برمجة", year: "1", major: "CS", text: "ما هو الفرق بين المتغير والثابت؟" },
  { subject: "قواعد بيانات", year: "2", major: "IS", text: "اشرح مفهوم الـ Primary Key." }
];

// 1. دالة التنقل بين الصفحات
function openTab(tabId) {
  document.getElementById('student-tab').style.display = 'none';
  document.getElementById('bank-tab').style.display = 'none';
  document.getElementById('admin-tab').style.display = 'none';

  document.getElementById(tabId).style.display = 'block';
}

// 2. دالة تسجيل الطالب وعرض أسئلته
function registerStudent() {
  let name = document.getElementById('st-name').value;
  let year = document.getElementById('st-year').value;
  let major = document.getElementById('st-major').value;

  if (name === "") {
    alert("من فضلك اكتب اسمك");
    return;
  }

  document.getElementById('welcome-msg').innerText = "أهلاً يا " + name + " (فرقة " + year + " - " + major + ")";
  showQuestions(year, major);
  openTab('bank-tab');
}

// 3. دالة فلترة وعرض الأسئلة حسب السنة والتخصص
function showQuestions(year, major) {
  let container = document.getElementById('questions-container');
  container.innerHTML = "";

  for (let i = 0; i < questions.length; i++) {
    if (questions[i].year === year && questions[i].major === major) {
      container.innerHTML += `
        <div class="question-card">
          <strong>المادة: ${questions[i].subject}</strong>
          <p>${questions[i].text}</p>
        </div>
      `;
    }
  }

  if (container.innerHTML === "") {
    container.innerHTML = "<p>لا توجد أسئلة متاحة لتخصصك حالياً.</p>";
  }
}

// 4. دالة الأدمن لاستخراج النص من الصورة (AI)
function extractTextFromImage() {
  let fileInput = document.getElementById('image-input');
  if (fileInput.files.length === 0) {
    alert("اختر صورة أولاً");
    return;
  }

  document.getElementById('ai-result').innerText = "جاري تحليل الصورة بالـ AI...";

  setTimeout(function() {
    questions.push({
      subject: "هياكل بيانات",
      year: "1",
      major: "CS",
      text: "سؤال مستخرج من الصورة: عرف الـ Array واذكر مميزاته."
    });
    document.getElementById('ai-result').innerText = "تم استخراج السؤال وتصنيفه (سنة 1 - CS) وإضافته للبنك!";
  }, 1000);
}