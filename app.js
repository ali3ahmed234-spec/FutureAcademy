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

// 3. دالة جلب الأسئلة من السيرفر وفلترتها وعرضها بشكل تفاعلي
async function showQuestions(year, major) {
  let container = document.getElementById('questions-container');
  container.innerHTML = "<p>جاري تحميل الأسئلة...</p>";

  try {
    let response = await fetch('http://localhost:3000/api/questions');
    let data = await response.json();
    let questions = data.questions;

    container.innerHTML = "";
    let found = false;

    for (let i = 0; i < questions.length; i++) {
      let q = questions[i];
      if (q.year === year && q.major === major) {
        found = true;

        // التحقق هل السؤال اختيار من متعدد (MCQ) أم مقالي
        let hasOptions = q.options && (q.options.A || q.options.B || q.options.C || q.options.D);
        let optionsHtml = "";

        if (hasOptions) {
          let correctAns = (q.correctAnswer || "").trim().toUpperCase();
          optionsHtml = `<div class="mcq-options" id="options-${q.id}" style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px; text-align: left; direction: ltr;">`;

          ['A', 'B', 'C', 'D'].forEach(letter => {
            if (q.options[letter]) {
              optionsHtml += `
                <button 
                  type="button"
                  class="option-btn"
                  data-letter="${letter}"
                  onclick="checkAnswer(${q.id}, '${letter}', '${correctAns}')"
                  style="width: 100%; text-align: left; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; color: #1e293b; cursor: pointer; font-size: 14px; transition: 0.2s;">
                  <strong>${letter})</strong> ${q.options[letter]}
                </button>
              `;
            }
          });

          optionsHtml += `</div><div id="feedback-${q.id}" style="margin-top: 10px; font-weight: bold;"></div>`;
        }

        container.innerHTML += `
          <div class="question-card" style="text-align: right; margin-bottom: 16px;">
            <strong>المادة: ${q.subject}</strong>
            <p style="margin: 10px 0; font-size: 16px; line-height: 1.6;">${q.question}</p>
            ${optionsHtml}
          </div>
        `;
      }
    }

    if (!found) {
      container.innerHTML = "<p>لا توجد أسئلة متاحة لتخصصك حالياً.</p>";
    }
  } catch (error) {
    container.innerHTML = "<p>تعذر الاتصال بالسيرفر. تأكد من تشغيل (node server.js).</p>";
  }
}

// 4. دالة تصحيح الإجابة عند ضغط الطالب على أحد الاختيارات
function checkAnswer(questionId, selectedLetter, correctLetter) {
  let optionsDiv = document.getElementById(`options-${questionId}`);
  let feedbackDiv = document.getElementById(`feedback-${questionId}`);
  let buttons = optionsDiv.querySelectorAll('.option-btn');

  // تعطيل جميع أزرار هذا السؤال بعد الاختيار حتى لا يغير الطالب إجابته
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.style.cursor = "default";
    let letter = btn.getAttribute('data-letter');

    // تلوين الإجابة الصحيحة بالأخضر دائماً
    if (letter === correctLetter) {
      btn.style.backgroundColor = "#dcfce7";
      btn.style.borderColor = "#16a34a";
      btn.style.color = "#14532d";
      btn.style.fontWeight = "bold";
    }
    // إذا اختار الطالب إجابة خاطئة، نلون اختياره بالأحمر
    else if (letter === selectedLetter && selectedLetter !== correctLetter) {
      btn.style.backgroundColor = "#fee2e2";
      btn.style.borderColor = "#dc2626";
      btn.style.color = "#7f1d1d";
    }
  });

  // إظهار رسالة النتيجة أسفل الاختيارات
  if (!correctLetter) {
    feedbackDiv.innerHTML = `<span style="color: #0284c7;">تم تسجيل اختيارك (${selectedLetter}).</span>`;
  } else if (selectedLetter === correctLetter) {
    feedbackDiv.innerHTML = `<span style="color: #16a34a;">✅ إجابة صحيحة! أحسنت.</span>`;
  } else {
    feedbackDiv.innerHTML = `<span style="color: #dc2626;">❌ إجابة خاطئة! الإجابة الصحيحة هي (${correctLetter}).</span>`;
  }
}