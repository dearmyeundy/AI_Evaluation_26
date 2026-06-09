export default async (req) => {
  if (req.method === "OPTIONS" || req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const { essay, shapes } = await req.json();
    const shapeSummary = shapes
      ? `원 ${shapes.circle}개, 삼각형 ${shapes.triangle}개, 사각형 ${shapes.rect}개, 선 ${shapes.line}개`
      : "도형 없음";

    const prompt = `당신은 중학교 1학년 학생의 글쓰기를 도와주는 친절한 AI 선생님입니다.
학생이 그림책 『너는 어떤 씨앗이니?』를 읽고 독후 에세이를 작성 중입니다.

[현재 작성 중인 에세이]
${essay || "(아직 작성하지 않았습니다)"}

[사용한 도형]
${shapeSummary}

아래 규칙에 따라 힌트를 작성해주세요:
- 학생이 더 깊이 생각할 수 있도록 소크라테스식 질문 1개를 포함하세요
- 에세이가 비어있으면 시작을 도와주는 힌트를 주세요
- 에세이가 있으면 현재 내용을 발전시킬 수 있는 구체적인 방향을 제안하세요
- 2~3문장으로 짧고 친근하게 작성하세요
- 중학생이 이해할 수 있는 쉬운 말로 작성하세요

JSON 형식으로만 응답하세요:
{"hint": "힌트 내용"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const resultText = data.content[0].text;
    const cleaned = resultText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    return new Response(JSON.stringify(result), {
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

export const config = { path: "/api/hint" };