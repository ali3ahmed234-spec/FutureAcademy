// 1. دالة التنقل بين الأقسام في الصفحة الرئيسية
function openTab(tabId) {
  let studentTab = document.getElementById('student-tab');
  let bankTab = document.getElementById('bank-tab');

  if (studentTab && bankTab) {
    studentTab.style.display = 'none';
    bankTab.style.display = 'none';
    document.getElementById(tabId).style.display = 'block';
  }
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

// 3. دالة جلب الأسئلة من السيرفر وفلترتها
async function showQuestions(year, major) {
  let container = document.getElementById('questions-container');
  container.innerHTML = "<p>جاري تحميل الأسئلة...</p>";

  try {
    let response = await fetch('http://localhost:3000/api/questions');
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
    container.innerHTML = "<p>تعذر الاتصال بالسيرفر. تأكد من تشغيل (node server.js).</p>";
  }
}

// 4. دالة الأدمن لإرسال الصورة أو الـ PDF للسيرفر واستخراج الأسئلة بالـ AI
async function extractTextFromImage() {
  let fileInput = document.getElementById('image-input');
  let resultBox = document.getElementById('ai-result');

  if (fileInput.files.length === 0) {
    alert("اختر صورة أو ملف PDF أولاً");
    return;
  }

  resultBox.style.display = "block";
  resultBox.innerText = "جاري تحليل الملف بالذكاء الاصطناعي...";

  let formData = new FormData();
  formData.append("examFile", fileInput.files[0]);

  try {
    let response = await fetch("http://localhost:3000/api/upload-exam", {
      method: "POST",
      body: formData
    });

    let data = await response.json();

    if (response.ok) {
      let html = `<strong>${data.message}</strong><hr>`;
      for (let i = 0; i < data.questions.length; i++) {
        let q = data.questions[i];
        html += `<p><b>[${q.major} - ${q.year} - ${q.subject}]:</b> ${q.question}</p>`;
      }
      resultBox.innerHTML = html;
    } else {
      resultBox.innerText = "خطأ: " + (data.error || "حدثت مشكلة أثناء التحليل");
    }
  } catch (error) {
    resultBox.innerText = "تعذر الاتصال بالسيرفر. تأكد من تشغيل (node server.js).";
  }
}