let allQuestionsCache = []; // تخزين الأسئلة مؤقتاً لسرعة عرض المواد والأسئلة

// 1. دالة التنقل بين الصفحات الثلاث
function openTab(tabId) {
  let studentTab = document.getElementById('student-tab');
  let selectionTab = document.getElementById('selection-tab');
  let bankTab = document.getElementById('bank-tab');

  if (studentTab) studentTab.style.display = 'none';
  if (selectionTab) selectionTab.style.display = 'none';
  if (bankTab) bankTab.style.display = 'none';

  let target = document.getElementById(tabId);
  if (target) target.style.display = 'block';
}

// 2. الانتقال من صفحة الاسم والـ ID إلى صفحة اختيار السنة والتخصص
async function goToSelectionStep() {
  let name = document.getElementById('st-name').value.trim();
  let id = document.getElementById('st-id').value.trim();

  if (name === "" || id === "") {
    alert("من فضلك اكتب اسمك والرقم الجامعي (ID)");
    return;
  }

  document.getElementById('student-greeting').innerText = `مرحباً يا ${name} (ID: ${id})`;
  openTab('selection-tab');

  // تحميل الأسئلة من ملف questions.json مباشرة (يعمل على GitHub Pages والمحلي)
  try {
    let response = await fetch('questions.json?t=' + new Date().getTime());
    let data = await response.json();
    allQuestionsCache = data.questions || [];
  } catch (error) {
    console.error("تعذر تحميل الأسئلة:", error);
  }
}

// 3. عند اختيار السنة -> إظهار قائمة التخصص وتصفير اللي بعدها
function onYearChange() {
  let majorSelect = document.getElementById('st-major');
  let subjectSelect = document.getElementById('st-subject');
  let enterBtn = document.getElementById('enter-bank-btn');

  majorSelect.value = "";
  majorSelect.style.display = "block";

  subjectSelect.style.display = "none";
  enterBtn.style.display = "none";
}

// 4. عند اختيار التخصص -> جلب المواد المرفوعة فعلياً لهذا التخصص وهذه السنة
async function onMajorChange() {
  let year = document.getElementById('st-year').value;
  let major = document.getElementById('st-major').value;
  let subjectSelect = document.getElementById('st-subject');
  let enterBtn = document.getElementById('enter-bank-btn');

  enterBtn.style.display = "none";
  subjectSelect.style.display = "block";
  subjectSelect.innerHTML = `<option value="" disabled selected>جاري تحميل المواد...</option>`;

  // قراءة أحدث نسخة من ملف questions.json مباشرة
  try {
    let response = await fetch('questions.json?t=' + new Date().getTime());
    let data = await response.json();
    allQuestionsCache = data.questions || [];
  } catch (error) {
    subjectSelect.innerHTML = `<option value="" disabled selected>تعذر تحميل ملف الأسئلة</option>`;
    return;
  }

  // استخراج أسماء المواد بدون تكرار للسنة والتخصص المختارين
  let availableSubjects = [];
  allQuestionsCache.forEach(q => {
    if (q.year === year && q.major === major && q.subject) {
      if (!availableSubjects.includes(q.subject)) {
        availableSubjects.push(q.subject);
      }
    }
  });

  if (availableSubjects.length === 0) {
    subjectSelect.innerHTML = `<option value="" disabled selected>لا توجد مواد مرفوعة لهذا التخصص حالياً</option>`;
  } else {
    let optionsHtml = `<option value="" disabled selected>-- اختر المادة --</option>`;
    availableSubjects.forEach(subj => {
      optionsHtml += `<option value="${subj}">${subj}</option>`;
    });
    subjectSelect.innerHTML = optionsHtml;
  }
}

// 5. عند اختيار المادة -> إظهار زر الدخول
function onSubjectChange() {
  let subject = document.getElementById('st-subject').value;
  let enterBtn = document.getElementById('enter-bank-btn');

  if (subject) {
    enterBtn.style.display = "block";
  }
}

// 6. عند الضغط على دخول -> فتح بنك الأسئلة وعرض أسئلة المادة المختارة فقط
function enterQuestionBank() {
  let name = document.getElementById('st-name').value.trim();
  let year = document.getElementById('st-year').value;
  let major = document.getElementById('st-major').value;
  let subject = document.getElementById('st-subject').value;

  document.getElementById('welcome-msg').innerText = `أهلاً يا ${name} | ${year} - ${major} | مادة: ${subject}`;
  showQuestions(year, major, subject);
  openTab('bank-tab');
}

// 7. عرض الأسئلة المفلترة حسب السنة والتخصص والمادة (بالنظام التفاعلي)
function showQuestions(year, major, subject) {
  let container = document.getElementById('questions-container');
  container.innerHTML = "";
  let found = false;

  for (let i = 0; i < allQuestionsCache.length; i++) {
    let q = allQuestionsCache[i];
    if (q.year === year && q.major === major && q.subject === subject) {
      found = true;

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
    container.innerHTML = "<p>لا توجد أسئلة متاحة لهذه المادة حالياً.</p>";
  }
}

// 8. تصحيح الإجابة عند ضغط الطالب على أحد الاختيارات
function checkAnswer(questionId, selectedLetter, correctLetter) {
  let optionsDiv = document.getElementById(`options-${questionId}`);
  let feedbackDiv = document.getElementById(`feedback-${questionId}`);
  let buttons = optionsDiv.querySelectorAll('.option-btn');

  buttons.forEach(btn => {
    btn.disabled = true;
    btn.style.cursor = "default";
    let letter = btn.getAttribute('data-letter');

    if (letter === correctLetter) {
      btn.style.backgroundColor = "#dcfce7";
      btn.style.borderColor = "#16a34a";
      btn.style.color = "#14532d";
      btn.style.fontWeight = "bold";
    } else if (letter === selectedLetter && selectedLetter !== correctLetter) {
      btn.style.backgroundColor = "#fee2e2";
      btn.style.borderColor = "#dc2626";
      btn.style.color = "#7f1d1d";
    }
  });

  if (!correctLetter) {
    feedbackDiv.innerHTML = `<span style="color: #0284c7;">تم تسجيل اختيارك (${selectedLetter}).</span>`;
  } else if (selectedLetter === correctLetter) {
    feedbackDiv.innerHTML = `<span style="color: #16a34a;">✅ إجابة صحيحة! أحسنت.</span>`;
  } else {
    feedbackDiv.innerHTML = `<span style="color: #dc2626;">❌ إجابة خاطئة! الإجابة الصحيحة هي (${correctLetter}).</span>`;
  }
}