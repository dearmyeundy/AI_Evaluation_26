import Chart from "chart.js/auto";

// sessionStorage에서 결과 불러오기
const raw = sessionStorage.getItem("scoreResult");

if (!raw) {
  document.querySelector(".container").innerHTML = `
    <div style="text-align:center; padding:60px 20px;">
      <div style="font-size:48px;">😢</div>
      <h2 style="margin:16px 0 8px; color:#166534;">결과를 찾을 수 없어요</h2>
      <p style="color:#6b7280; margin-bottom:24px;">먼저 과제를 제출해주세요.</p>
      <button onclick="location.href='/'" 
        style="padding:12px 32px; background:#22c55e; color:#fff; 
        border:none; border-radius:50px; font-size:1rem; cursor:pointer;">
        과제 작성하러 가기
      </button>
    </div>
  `;
} else {
  const result = JSON.parse(raw);
  const { scores, levels, keywords, feedback } = result;

  // 총점
  const total = scores.reflection + scores.coherence + scores.symbolism + scores.format;
  document.getElementById("totalScore").innerHTML =
    `${total} <span>/ 20점</span>`;

  // 항목별 점수
  document.getElementById("scoreReflection").textContent = `${scores.reflection} / 8점`;
document.getElementById("scoreCoherence").textContent = `${scores.coherence} / 6점`;
document.getElementById("scoreSymbolism").textContent = `${scores.symbolism} / 4점`;
document.getElementById("scoreFormat").textContent = `${scores.format} / 2점`;

  // 수준
  document.getElementById("levelReflection").textContent = levels.reflection;
  document.getElementById("levelCoherence").textContent = levels.coherence;
  document.getElementById("levelSymbolism").textContent = levels.symbolism;
  document.getElementById("levelFormat").textContent = levels.format;

  // 키워드
  const keywordsArea = document.getElementById("keywordsArea");
  keywords.forEach((kw) => {
    const tag = document.createElement("span");
    tag.className = "keyword-tag";
    tag.textContent = kw;
    keywordsArea.appendChild(tag);
  });

  // 피드백
  document.getElementById("feedbackBox").textContent = feedback;

  // 레이더 차트
  const ctx = document.getElementById("radarChart").getContext("2d");
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["자기 경험 연계 서술", "그림-글 연결 일관", "도형 의미 부여 및 설명 일관성", "과제 조건 준수"],
      datasets: [
        {
          label: "내 점수",
          data: [
            (scores.reflection / 8) * 100,
            (scores.coherence / 6) * 100,
            (scores.symbolism / 4) * 100,
            (scores.format / 2) * 100,
          ],
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          borderColor: "#22c55e",
          borderWidth: 2,
          pointBackgroundColor: "#16a34a",
          pointRadius: 4,
        },
      ],
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            font: { size: 10 },
          },
          pointLabels: {
            font: { size: 12, family: "Noto Sans KR" },
          },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

// 성장 질문 + 비계 대화
const chatHistory = [];
let turnCount = 0;
const MAX_TURNS = 2;

async function callGrowthAPI(messages) {
  const scoreResult = JSON.parse(sessionStorage.getItem("scoreResult"));
  const response = await fetch("/api/growth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, result: scoreResult, essay: sessionStorage.getItem("essayText") }),
  });
  const data = await response.json();
  return data;
}

function addChatBubble(type, text) {
  const chatMessages = document.getElementById("chatMessages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${type}`;
  bubble.innerHTML = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 초기 질문 로드
async function loadInitialQuestion() {
  try {
    console.log("성장 질문 API 호출 시작");
    const data = await callGrowthAPI([]);
    console.log("성장 질문 API 응답:", data);
    document.getElementById("growthLoading").classList.add("hidden");
    document.getElementById("growthChat").classList.remove("hidden");
    addChatBubble("ai", data.message);
    chatHistory.push({ role: "assistant", content: data.message });
  } catch (err) {
    console.error("성장 질문 오류:", err);
    document.getElementById("growthLoading").classList.add("hidden");
  }
}

// 답변 전송
document.getElementById("chatSendBtn").addEventListener("click", async () => {
  const input = document.getElementById("chatInput");
  const answer = input.value.trim();
  if (!answer) return;

  addChatBubble("student", answer);
  chatHistory.push({ role: "user", content: answer });
  input.value = "";
  turnCount++;

  const sendBtn = document.getElementById("chatSendBtn");
  sendBtn.disabled = true;
  sendBtn.textContent = "💭 생각하는 중...";

  try {
    const data = await callGrowthAPI(chatHistory);

    if (turnCount >= MAX_TURNS || data.isComplete) {
      // 최종 성찰 한 줄 표시
      document.getElementById("chatMessages").parentElement.classList.add("hidden");
      document.getElementById("chatInput").parentElement.classList.add("hidden");
      document.getElementById("finalReflection").classList.remove("hidden");
      document.getElementById("reflectionText").textContent = data.reflection || data.message;

      // 교사 페이지용 저장
      const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
      if (submissions.length > 0) {
        submissions[submissions.length - 1].reflection = data.reflection || data.message;
        localStorage.setItem("submissions", JSON.stringify(submissions));
      }
    } else {
      addChatBubble("ai", data.message);
      chatHistory.push({ role: "assistant", content: data.message });
      sendBtn.disabled = false;
      sendBtn.textContent = "💬 답변 보내기";
    }
  } catch (err) {
    sendBtn.disabled = false;
    sendBtn.textContent = "💬 답변 보내기";
  }
});

// 결과 페이지 로드 시 질문 시작
if (raw) {
  loadInitialQuestion();
}