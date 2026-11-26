let allQuestionsCache = [];

// 1. دالة التنقل بين الصفحتين
function openTab(tabId) {
  let selectionTab = document.getElementById('selection-tab');
  let bankTab = document.getElementById('bank-tab');

  if (selectionTab) selectionTab.style.display = 'none';
  if (bankTab) bankTab.style.display = 'none';

  let target = document.getElementById(tabId);
  if (target) target.style.display = 'block';
}

// 2. عند اختيار السنة -> إظهار قائمة التخصص وتصفير اللي بعدها
function onYearChange() {
  let majorSelect = document.getElementById('st-major');
  let subjectSelect = document.getElementById('st-subject');
  let enterBtn = document.getElementById('enter-bank-btn');

  majorSelect.value = "";
  majorSelect.style.display = "block";

  subjectSelect.style.display = "none";
  enterBtn.style.display = "none";
}

// 3. عند اختيار التخصص -> جلب المواد المرفوعة فعلياً لهذا التخصص وهذه السنة
async function onMajorChange() {
  let year = document.getElementById('st-year').value;
  let major = document.getElementById('st-major').value;
  let subjectSelect = document.getElementById('st-subject');
  let enterBtn = document.getElementById('enter-bank-btn');

  enterBtn.style.display = "none";
  subjectSelect.style.display = "block";
  subjectSelect.innerHTML = `<option value="" disabled selected>جاري تحميل المواد...</option>`;

  try {
    let response = await fetch('questions.json?t=' + new Date().getTime());
    let data = await response.json();
    allQuestionsCache = data.questions || [];
  } catch (error) {
    subjectSelect.innerHTML = `<option value="" disabled selected>تعذر تحميل ملف الأسئلة</option>`;
    return;
  }

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

// 4. عند اختيار المادة -> إظهار زر الدخول
function onSubjectChange() {
  let subject = document.getElementById('st-subject').value;
  let enterBtn = document.getElementById('enter-bank-btn');

  if (subject) {
    enterBtn.style.display = "block";
  }
}

// 5. عند الضغط على دخول -> فتح بنك الأسئلة وعرض أسئلة المادة المختارة فقط
function enterQuestionBank() {
  let year = document.getElementById('st-year').value;
  let major = document.getElementById('st-major').value;
  let subject = document.getElementById('st-subject').value;

  document.getElementById('welcome-msg').innerText = `${year} - ${major} | مادة: ${subject}`;
  showQuestions(year, major, subject);
  openTab('bank-tab');
}

// 6. عرض 10 أسئلة عشوائية فقط من أسئلة المادة المختارة
function showQuestions(year, major, subject) {
  let container = document.getElementById('questions-container');
  container.innerHTML = "";

  // 1) تصفية الأسئلة الخاصة بالسنة والتخصص والمادة
  let filteredQuestions = allQuestionsCache.filter(
    q => q.year === year && q.major === major && q.subject === subject
  );

  if (filteredQuestions.length === 0) {
    container.innerHTML = "<p>لا توجد أسئلة متاحة لهذه المادة حالياً.</p>";
    return;
  }

  // 2) خلط ترتيب الأسئلة عشوائياً (Fisher-Yates Shuffle)
  for (let i = filteredQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filteredQuestions[i], filteredQuestions[j]] = [filteredQuestions[j], filteredQuestions[i]];
  }

  // 3) أخذ أول 10 أسئلة فقط (أو أقل لو المادة فيها أقل من 10)
  let selectedQuestions = filteredQuestions.slice(0, 10);

  // 4) عرض الأسئلة العشرة
  selectedQuestions.forEach((q, index) => {
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
        <strong>سؤال ${index + 1} من ${selectedQuestions.length} | المادة: ${q.subject}</strong>
        <p style="margin: 10px 0; font-size: 16px; line-height: 1.6;">${q.question}</p>
        ${optionsHtml}
      </div>
    `;
  });
}

// 7. تصحيح الإجابة عند ضغط الطالب على أحد الاختيارات
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