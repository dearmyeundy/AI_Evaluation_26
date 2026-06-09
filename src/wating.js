const submissionId = sessionStorage.getItem("submissionId");

function checkApproval() {
  const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
  const submission = submissions.find((s) => s.id === submissionId);

  if (submission && submission.approved) {
    document.getElementById("waitingStatus").classList.add("hidden");
    document.getElementById("resultReady").classList.remove("hidden");
    clearInterval(pollInterval);
  }
}

// 3초마다 승인 여부 확인
const pollInterval = setInterval(checkApproval, 3000);
checkApproval(); // 즉시 한 번 확인