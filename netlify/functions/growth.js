export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const { messages, result, essay } = await req.json();
    const isFirstTurn = messages.length === 0;
    const isLastTurn = messages.length >= 3;

    const systemPrompt = `당신은 중학교 1학년 학생의 성장을 돕는 AI 선생님입니다.
학생이 그림책 독후 활동을 마치고 결과를 확인했습니다.
아래 원칙에 따라 대화하세요:
- 소크라테스식 질문으로 학생이 스스로 생각을 발전시키도록 유도하세요
- 한 번에 질문은 1개만 하세요
- 비계를 제공할 때는 힌트를 주되 답을 직접 알려주지 마세요
- 중학생이 이해할 수 있는 친근한 말투로 작성하세요
- 2~3문장으로 짧게 작성하세요`;

    const userPrompt = isFirstTurn
      ? `학생의 채점 결과:
- 자기 경험 연계 서술: ${result.scores.reflection}점 (${result.levels.reflection})
- 그림-글 연결 일관성: ${result.scores.coherence}점 (${result.levels.coherence})
- 도형 의미 부여 및 설명 일관성: ${result.scores.symbolism}점 (${result.levels.symbolism})
- 과제 조건 준수: ${result.scores.format}점 (${result.levels.format})
- 에세이 내용: ${essay}
가장 성장이 필요한 부분을 중심으로 학생이 더 깊이 생각할 수 있는 첫 번째 질문을 해주세요.
JSON으로만 응답: {"message": "질문 내용", "isComplete": false}`
      : isLastTurn
      ? `대화 내용을 바탕으로 학생의 성찰을 한 문장으로 정리해주세요.
"나는 오늘 ___" 형식으로 학생 입장에서 작성하세요.
JSON으로만 응답: {"message": "마무리 메시지", "reflection": "나는 오늘 ...", "isComplete": true}`
      : `이전 대화를 바탕으로 비계를 제공하며 한 단계 더 깊은 질문을 해주세요.
JSON으로만 응답: {"message": "질문 내용", "isComplete": false}`;

    const apiMessages = isFirstTurn
      ? [{ role: "user", content: userPrompt }]
      : [...messages, { role: "user", content: userPrompt }];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 200,
        system: systemPrompt,
        messages: apiMessages,
      }),
    });

    const data = await response.json();
    const resultText = data.content[0].text;
    const cleaned = resultText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = { message: resultText, isComplete: false };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};

export const config = { path: "/api/growth" };