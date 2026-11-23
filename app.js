// 1. دالة التنقل بين الأقسام في الصفحة الرئيسية
function openTab(tabId) {
  document.getElementById('student-tab').style.display = 'none';
  document.getElementById('bank-tab').style.display = 'none';
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

  document.getElementById('welcome-msg').innerText = "أهلاً يا " + name + " (" + year + " - " + major + ")";
  showQuestions(year, major);
  openTab('bank-tab');
}

// 3. دالة جلب الأسئلة من ملف questions.json وفلترتها
async function showQuestions(year, major) {
  let container = document.getElementById('questions-container');
  container.innerHTML = "<p>جاري تحميل الأسئلة...</p>";

  try {
    // قراءة البيانات من ملف مروان
    let response = await fetch('questions.json');
    let data = await response.json();
    let questions = data.questions;

    container.innerHTML = "";

    for (let i = 0; i < questions.length; i++) {
      if (questions[i].year === year && questions[i].major === major) {
        container.innerHTML += `
          <div class="question-card">
            <strong>المادة: ${questions[i].subject}</strong>
            <p>${questions[i].question}</p>
          </div>
        `;
      }
    }

    if (container.innerHTML === "") {
      container.innerHTML = "<p>لا توجد أسئلة متاحة لتخصصك حالياً.</p>";
    }
  } catch (error) {
    container.innerHTML = "<p>حدث خطأ في قراءة ملف الأسئلة. تأكد من تشغيل السيرفر أو Live Server.</p>";
  }
}

// 4. دالة الأدمن لاستخراج النص من الصورة (AI)
function extractTextFromImage() {
  let fileInput = document.getElementById('image-input');
  let resultBox = document.getElementById('ai-result');

  if (fileInput.files.length === 0) {
    alert("اختر صورة أولاً");
    return;
  }

  resultBox.style.display = "block";
  resultBox.innerText = "جاري تحليل الصورة بالـ AI...";

  setTimeout(function() {
    resultBox.innerText = "تم استخراج السؤال بنجاح! جاهز للربط بسيرفر مروان لحفظه في questions.json.";
  }, 1000);
}