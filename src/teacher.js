const TEACHER_PASSWORD = "teacher1234";

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const studentList = document.getElementById("studentList");
const emptyState = document.getElementById("emptyState");
const defaultState = document.getElementById("defaultState");
const detailPanel = document.getElementById("detailPanel");

let currentIndex = null;

function getSubmissions() {
  const data = localStorage.getItem("submissions");
  return data ? JSON.parse(data) : [];
}

// 로그인
loginBtn.addEventListener("click", () => {
  if (passwordInput.value === TEACHER_PASSWORD) {
    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    renderStudentList();
  } else {
    loginError.classList.remove("hidden");
    passwordInput.value = "";
  }
});

passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

// 학생 목록 렌더링
function renderStudentList() {
  const submissions = getSubmissions();

  if (submissions.length === 0) {
    emptyState.classList.remove("hidden");
    studentList.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");
  studentList.innerHTML = submissions
    .slice()
    .reverse()
    .map((s, i) => {
      const realIndex = submissions.length - 1 - i;
      const total = s.result.scores.reflection + s.result.scores.coherence +
                    s.result.scores.symbolism + s.result.scores.format;
      return `
        <div class="student-card" id="card-${realIndex}" onclick="openDetail(${realIndex})">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; background:#dcfce7; border-radius:50%;
                        display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">
              🧑‍🎓
            </div>
            <div>
              <div class="student-name">${s.name}</div>
              <div class="student-meta">${s.submittedAt}</div>
            </div>
          </div>
          <div class="student-score">${total}<span>/ 20</span></div>
        </div>
      `;
    })
    .join("");
}

// 상세 패널 열기
window.openDetail = function (index) {
  currentIndex = index;
  const submissions = getSubmissions();
  const s = submissions[index];
  if (!s) return;

  // 카드 활성화
  document.querySelectorAll(".student-card").forEach((c) => c.classList.remove("active"));
  const card = document.getElementById(`card-${index}`);
  if (card) card.classList.add("active");

  // 헤더
  const total = s.result.scores.reflection + s.result.scores.coherence +
                s.result.scores.symbolism + s.result.scores.format;
  document.getElementById("detailStudentName").textContent = s.name + " 학생";
  document.getElementById("detailSubmittedAt").textContent = s.submittedAt;
  document.getElementById("detailTotal").textContent = total;

  // 루브릭 바
  const rubricItems = [
    { label: "① 자기 경험 연계 서술", score: s.result.scores.reflection, max: 8, level: s.result.levels.reflection },
    { label: "② 그림-글 연결 일관성", score: s.result.scores.coherence, max: 6, level: s.result.levels.coherence },
    { label: "③ 도형 의미 부여 및 설명 일관성", score: s.result.scores.symbolism, max: 4, level: s.result.levels.symbolism },
    { label: "④ 과제 조건 준수", score: s.result.scores.format, max: 2, level: s.result.levels.format },
  ];

  document.getElementById("rubricBars").innerHTML = rubricItems
    .map((item) => `
      <div class="rubric-bar-item">
        <div class="rubric-bar-label">
          <span>${item.label} <strong>${item.score}/${item.max}점</strong></span>
          <span class="level-badge level-${item.level}">${item.level}</span>
        </div>
        <div class="rubric-bar-track">
          <div class="rubric-bar-fill" style="width:${(item.score / item.max) * 100}%"></div>
        </div>
      </div>
    `)
    .join("");

  // 그림
  const modalCanvas = document.getElementById("modalCanvas");
  if (s.canvasImage) {
    modalCanvas.src = s.canvasImage;
    modalCanvas.style.display = "block";
  } else {
    modalCanvas.style.display = "none";
  }

  // 에세이
  document.getElementById("modalEssay").textContent = s.essay;

  // 키워드
  document.getElementById("modalKeywords").innerHTML = s.result.keywords
    .map((kw) => `<span class="keyword-tag">${kw}</span>`)
    .join("");

  // 피드백
  document.getElementById("modalFeedback").value = s.teacherFeedback || s.result.feedback;

  // 패널 표시
  defaultState.classList.add("hidden");
  detailPanel.classList.remove("hidden");
};

// 저장
document.getElementById("saveFeedbackBtn").addEventListener("click", () => {
  if (currentIndex === null) return;
  const submissions = getSubmissions();
  submissions[currentIndex].teacherFeedback = document.getElementById("modalFeedback").value;
  localStorage.setItem("submissions", JSON.stringify(submissions));
  const btn = document.getElementById("saveFeedbackBtn");
  btn.textContent = "✅ 저장됨";
  setTimeout(() => { btn.textContent = "💾 저장"; }, 2000);
});

// 추출
document.getElementById("exportBtn").addEventListener("click", () => {
  if (currentIndex === null) return;
  const submissions = getSubmissions();
  const s = submissions[currentIndex];
  const feedback = document.getElementById("modalFeedback").value;
  const total = s.result.scores.reflection + s.result.scores.coherence +
                s.result.scores.symbolism + s.result.scores.format;

  const content = `
[${s.name} 학생 평가 결과]
제출일시: ${s.submittedAt}
총점: ${total}/20점

[항목별 점수]
① 자기 경험 연계 서술: ${s.result.scores.reflection}점 (${s.result.levels.reflection})
② 그림-글 연결 일관성: ${s.result.scores.coherence}점 (${s.result.levels.coherence})
③ 도형 의미 부여 및 설명 일관성: ${s.result.scores.symbolism}점 (${s.result.levels.symbolism})
④ 과제 조건 준수: ${s.result.scores.format}점 (${s.result.levels.format})

[핵심 키워드]
${s.result.keywords.join(", ")}

[에세이 원문]
${s.essay}

[교사 피드백]
${feedback}
  `.trim();

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${s.name}_평가결과.txt`;
  a.click();
  URL.revokeObjectURL(url);
});