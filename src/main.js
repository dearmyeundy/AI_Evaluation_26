const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

let shapes = [];
let selectedShape = null;
let isDragging = false;
let isResizing = false;
let isRotating = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let activeShapeType = null;

// 선 그리기 상태
let isDrawingLine = false;
let lineStartX = 0;
let lineStartY = 0;

const SIZE = 60;

function addShape(type) {
  if (type === "line") return;
  const shape = {
    id: Date.now(),
    type,
    x: 150 + Math.random() * 200,
    y: 120 + Math.random() * 150,
    size: SIZE,
    rotation: 0,
  };
  shapes.push(shape);
  selectedShape = shape;
  drawAll();
}

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  shapes.forEach((s) => drawShape(s));
}

function drawShape(s) {
  ctx.save();
  const isSelected = selectedShape && selectedShape.id === s.id;

  if (s.type === "line") {
    ctx.strokeStyle = isSelected ? "#3b82f6" : "#1a1a1a";
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // 도형 중심 기준 회전
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rotation || 0);

  ctx.strokeStyle = isSelected ? "#3b82f6" : "#1a1a1a";
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.beginPath();

  if (s.type === "circle") {
    ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
  } else if (s.type === "triangle") {
    ctx.moveTo(0, -s.size / 2);
    ctx.lineTo(s.size / 2, s.size / 2);
    ctx.lineTo(-s.size / 2, s.size / 2);
    ctx.closePath();
  } else if (s.type === "rect") {
    ctx.rect(-s.size / 2, -s.size / 2, s.size, s.size);
  }

  ctx.stroke();

  // 선택 시 핸들 표시
  if (isSelected) {
    const half = s.size / 2;

    // 크기 조절 핸들 (오른쪽 아래, 파란색)
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(half, half, 7, 0, Math.PI * 2);
    ctx.fill();

    // 회전 핸들 (위쪽, 초록색)
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(0, -half - 20, 7, 0, Math.PI * 2);
    ctx.fill();

    // 회전 핸들 연결선
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.lineTo(0, -half - 20);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function findShape(x, y) {
  return [...shapes].reverse().find((s) => {
    if (s.type === "line") {
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return false;
      const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / (len * len)));
      const cx = s.x1 + t * dx;
      const cy = s.y1 + t * dy;
      return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < 12;
    }
    // 회전 역변환 적용해서 실제 클릭 위치 정확히 계산
    const cos = Math.cos(-(s.rotation || 0));
    const sin = Math.sin(-(s.rotation || 0));
    const dx = x - s.x;
    const dy = y - s.y;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    const half = s.size / 2;
    // 각 도형 모양에 맞는 히트박스
    if (s.type === "circle") {
      return Math.sqrt(localX ** 2 + localY ** 2) < half;
    } else if (s.type === "triangle" || s.type === "rect") {
      return Math.abs(localX) < half && Math.abs(localY) < half;
    }
    return false;
  });
}

// 로컬 좌표로 변환 (회전 역변환)
function toLocalPos(shape, x, y) {
  const dx = x - shape.x;
  const dy = y - shape.y;
  const cos = Math.cos(-(shape.rotation || 0));
  const sin = Math.sin(-(shape.rotation || 0));
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
}

function isOnResizeHandle(shape, x, y) {
  if (!shape || shape.type === "line") return false;
  const local = toLocalPos(shape, x, y);
  const half = shape.size / 2;
  return Math.sqrt((local.x - half) ** 2 + (local.y - half) ** 2) < 12;
}

function isOnRotateHandle(shape, x, y) {
  if (!shape || shape.type === "line") return false;
  const local = toLocalPos(shape, x, y);
  const half = shape.size / 2;
  return Math.sqrt(local.x ** 2 + (local.y + half + 20) ** 2) < 12;
}

canvas.addEventListener("mousedown", (e) => {
  const pos = getCanvasPos(e);

  if (activeShapeType === "line") {
    isDrawingLine = true;
    lineStartX = pos.x;
    lineStartY = pos.y;
    return;
  }

  if (selectedShape && isOnRotateHandle(selectedShape, pos.x, pos.y)) {
    isRotating = true;
    return;
  }

  if (selectedShape && isOnResizeHandle(selectedShape, pos.x, pos.y)) {
    isResizing = true;
    return;
  }

  const found = findShape(pos.x, pos.y);
  if (found) {
    selectedShape = found;
    isDragging = true;
    if (found.type === "line") {
      dragOffsetX = pos.x - found.x1;
      dragOffsetY = pos.y - found.y1;
    } else {
      dragOffsetX = pos.x - found.x;
      dragOffsetY = pos.y - found.y;
    }
    drawAll();
  } else {
    selectedShape = null;
    drawAll();
  }
});

canvas.addEventListener("mousemove", (e) => {
  const pos = getCanvasPos(e);

  if (isDrawingLine) {
    drawAll();
    ctx.save();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineStartY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (isRotating && selectedShape) {
    const angle = Math.atan2(pos.y - selectedShape.y, pos.x - selectedShape.x);
    selectedShape.rotation = angle + Math.PI / 2;
    drawAll();
    return;
  }

  if (isResizing && selectedShape) {
    const dx = pos.x - selectedShape.x;
    const dy = pos.y - selectedShape.y;
    selectedShape.size = Math.max(20, Math.sqrt(dx * dx + dy * dy) * 2);
    drawAll();
    return;
  }

  if (isDragging && selectedShape) {
    if (selectedShape.type === "line") {
      const dx = pos.x - dragOffsetX - selectedShape.x1;
      const dy = pos.y - dragOffsetY - selectedShape.y1;
      selectedShape.x1 += dx;
      selectedShape.y1 += dy;
      selectedShape.x2 += dx;
      selectedShape.y2 += dy;
      dragOffsetX = pos.x - selectedShape.x1;
      dragOffsetY = pos.y - selectedShape.y1;
    } else {
      selectedShape.x = pos.x - dragOffsetX;
      selectedShape.y = pos.y - dragOffsetY;
    }
    drawAll();
  }

  // 커서 모양 변경
  if (selectedShape && selectedShape.type !== "line") {
    if (isOnRotateHandle(selectedShape, pos.x, pos.y)) {
      canvas.style.cursor = "grab";
    } else if (isOnResizeHandle(selectedShape, pos.x, pos.y)) {
      canvas.style.cursor = "nwse-resize";
    } else {
      canvas.style.cursor = "move";
    }
  } else {
    canvas.style.cursor = activeShapeType === "line" ? "crosshair" : "default";
  }
});

canvas.addEventListener("mouseup", (e) => {
  const pos = getCanvasPos(e);

  if (isDrawingLine) {
    isDrawingLine = false;
    const len = Math.sqrt((pos.x - lineStartX) ** 2 + (pos.y - lineStartY) ** 2);
    if (len > 10) {
      shapes.push({
        id: Date.now(),
        type: "line",
        x1: lineStartX,
        y1: lineStartY,
        x2: pos.x,
        y2: pos.y,
      });
      selectedShape = shapes[shapes.length - 1];
      drawAll();
    }
    return;
  }

  isDragging = false;
  isResizing = false;
  isRotating = false;
});

// 도형 버튼
document.querySelectorAll(".shape-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".shape-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeShapeType = btn.dataset.shape;
    if (activeShapeType !== "line") {
      addShape(activeShapeType);
      activeShapeType = null;
      btn.classList.remove("active");
    }
  });
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  if (selectedShape) {
    shapes = shapes.filter((s) => s.id !== selectedShape.id);
    selectedShape = null;
    drawAll();
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  shapes = [];
  selectedShape = null;
  activeShapeType = null;
  document.querySelectorAll(".shape-btn").forEach((b) => b.classList.remove("active"));
  drawAll();
});

// 문장 수 카운트
const essayInput = document.getElementById("essayInput");
const sentenceCount = document.getElementById("sentenceCount");

essayInput.addEventListener("input", () => {
  const text = essayInput.value.trim();
  const count = text
    ? text.split(/[.!?。]+/).filter((s) => s.trim().length > 0).length
    : 0;
  sentenceCount.textContent = count;
});

// 제출
const submitBtn = document.getElementById("submitBtn");
const loadingMsg = document.getElementById("loadingMsg");
const errorMsg = document.getElementById("errorMsg");

submitBtn.addEventListener("click", async () => {
  const essay = essayInput.value.trim();
  const name = document.getElementById("studentName").value.trim();

  if (!name) {
    errorMsg.textContent = "❗ 이름을 입력해주세요.";
    errorMsg.classList.remove("hidden");
    return;
  }

  if (!essay) {
    errorMsg.textContent = "❗ 에세이를 작성해주세요.";
    errorMsg.classList.remove("hidden");
    return;
  }

  if (essay.split(/[.!?。]+/).filter((s) => s.trim().length > 0).length < 3) {
    errorMsg.textContent = "❗ 최소 3문장 이상 작성해주세요.";
    errorMsg.classList.remove("hidden");
    return;
  }

  const shapeSummary = {
    circle: shapes.filter((s) => s.type === "circle").length,
    triangle: shapes.filter((s) => s.type === "triangle").length,
    rect: shapes.filter((s) => s.type === "rect").length,
    line: shapes.filter((s) => s.type === "line").length,
  };

  submitBtn.disabled = true;
  loadingMsg.classList.remove("hidden");
  errorMsg.classList.add("hidden");

  try {
    const response = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essay, shapes: shapeSummary }),
    });

    if (!response.ok) throw new Error("서버 오류가 발생했습니다.");

    const result = await response.json();

    // 캔버스 이미지 저장
// 선택 상태 해제 후 깔끔하게 캡처
selectedShape = null;
drawAll();
const canvasImage = canvas.toDataURL("image/png");

// sessionStorage에 저장 (결과 페이지용)
sessionStorage.setItem("scoreResult", JSON.stringify(result));
sessionStorage.setItem("essayText", essay);
sessionStorage.setItem("studentName", name);

// 승인 상태 초기화
const submissionId = Date.now().toString();
sessionStorage.setItem("submissionId", submissionId);

    // localStorage에 저장 (교사 페이지용)
const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
submissions.push({
  id: submissionId,
  name,
  essay,
  result,
  canvasImage,
  approved: false,
  submittedAt: new Date().toLocaleString("ko-KR"),
});

    localStorage.setItem("submissions", JSON.stringify(submissions));

    window.location.href = "/waiting.html";
  } catch (err) {
    errorMsg.textContent = "❗ " + err.message;
    errorMsg.classList.remove("hidden");
    submitBtn.disabled = false;
    loadingMsg.classList.add("hidden");
  }
  // 그림 저장하기
document.getElementById("saveCanvasBtn").addEventListener("click", () => {
  sessionStorage.setItem("savedShapes", JSON.stringify(shapes));
  const msg = document.getElementById("saveCanvasMsg");
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), 2000);
});

// 페이지 로드 시 저장된 그림 복원
const savedShapes = sessionStorage.getItem("savedShapes");
if (savedShapes) {
  shapes = JSON.parse(savedShapes);
  drawAll();
}
});

// 힌트 기능
const hintBtn = document.getElementById("hintBtn");
const hintBubble = document.getElementById("hintBubble");
const hintContent = document.getElementById("hintContent");
const hintClose = document.getElementById("hintClose");

hintBtn.addEventListener("click", async () => {
  const essay = document.getElementById("essayInput").value.trim();
  const shapeSummary = {
    circle: shapes.filter((s) => s.type === "circle").length,
    triangle: shapes.filter((s) => s.type === "triangle").length,
    rect: shapes.filter((s) => s.type === "rect").length,
    line: shapes.filter((s) => s.type === "line").length,
  };

  // 말풍선 표시 + 로딩
  hintBubble.classList.remove("hidden");
  hintContent.innerHTML = `
    <div class="hint-loading">
      <span class="spinner"></span> 힌트를 생각하는 중...
    </div>
  `;

  try {
    const response = await fetch("/api/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essay, shapes: shapeSummary }),
    });

    const data = await response.json();
    hintContent.innerHTML = `<p>${data.hint}</p>`;
  } catch (err) {
    hintContent.innerHTML = `<p style="color:#dc2626;">힌트를 불러오지 못했어요 😢</p>`;
  }
});

hintClose.addEventListener("click", () => {
  hintBubble.classList.add("hidden");
});