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
  document.getElementById("scoreReflection").textContent = `${scores.reflection}점`;
  document.getElementById("scoreCoherence").textContent = `${scores.coherence}점`;
  document.getElementById("scoreSymbolism").textContent = `${scores.symbolism}점`;
  document.getElementById("scoreFormat").textContent = `${scores.format}점`;

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