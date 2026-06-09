const submissionId = sessionStorage.getItem("submissionId");

async function checkApproval() {
  try {
    const response = await fetch("/api/submissions");
    const submissions = await response.json();
    const submission = submissions.find((s) => s.id === submissionId);

    if (submission && submission.approved) {
      // 승인된 피드백을 sessionStorage에 저장
      sessionStorage.setItem("scoreResult", JSON.stringify(submission.result));
      sessionStorage.setItem("essayText", submission.essay);
      if (submission.teacherFeedback) {
        const result = JSON.parse(sessionStorage.getItem("scoreResult"));
        result.feedback = submission.teacherFeedback;
        sessionStorage.setItem("scoreResult", JSON.stringify(result));
      }

      document.getElementById("waitingStatus").classList.add("hidden");
      document.getElementById("resultReady").classList.remove("hidden");
      clearInterval(pollInterval);
    }
  } catch (err) {
    console.error("승인 확인 오류:", err);
  }
}

const pollInterval = setInterval(checkApproval, 3000);
checkApproval();