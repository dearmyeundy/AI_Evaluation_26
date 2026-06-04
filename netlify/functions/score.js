import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        result: "./result.html",
      },
    },
  },
  plugins: [
    {
      name: "api-server",
      configureServer(server) {
        server.middlewares.use("/api/score", async (req, res) => {
          if (req.method === "OPTIONS") {
            res.writeHead(200, {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            });
            res.end();
            return;
          }

          if (req.method !== "POST") {
            res.writeHead(405);
            res.end("Method not allowed");
            return;
          }

          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", async () => {
            try {
              const { essay, shapes } = JSON.parse(body);

              const shapeSummary = shapes
                ? `사용한 도형: 원(○) ${shapes.circle || 0}개, 삼각형(△) ${shapes.triangle || 0}개, 사각형(□) ${shapes.rect || 0}개, 선 ${shapes.line || 0}개`
                : "도형 정보 없음";

              const prompt = `
당신은 중학교 1학년 담임 선생님입니다.
학생이 그림책 『너는 어떤 씨앗이니?』를 읽고 작성한 독후 에세이를 아래 루브릭에 따라 채점해주세요.

[학생 제출 정보]
- ${shapeSummary}
- 에세이 내용: ${essay}

[루브릭 채점 기준]

① 성찰의 깊이 (최대 8점)
- 능숙(8점): 잠재력(씨앗)과 미래(꽃)를 구체적인 경험과 연결하여 깊이 있게 성찰함
- 전략(6점): 잠재력과 성장의 모습을 명확히 제시하며 자기 삶과 연계하려 노력함
- 적응(4점): 일반적인 수준의 다짐이나 기대를 서술하며 자기 경험과의 연결이 다소 부족함
- 탐색(2점): 책의 내용을 단순 요약하거나 자기 성찰적 태도가 거의 드러나지 않음

② 의미 정합성 (최대 6점)
- 능숙(6점): 선택한 도형의 특성과 텍스트 설명이 완벽하게 일치하며 논리적 설득력이 높음
- 전략(4.5점): 그림과 글의 관계가 적절하며 상징하고자 하는 바가 잘 전달됨
- 적응(3점): 그림과 글이 연결은 되나 도형 선택 이유 설명이 다소 모호함
- 탐색(1.5점): 그림과 글이 따로 놀거나 이미지 설명이 현저히 부족함

③ 추상적 상징성 (최대 4점)
- 능숙(4점): 제한된 도형을 창의적으로 배열하여 내면을 상징적 기호로 형상화함
- 전략(3점): 단순 나열을 넘어 도형의 크기, 위치, 구성으로 의미를 표현함
- 적응(2점): 도형으로 사물이나 상황을 단순 묘사하는 수준에 머무름
- 탐색(1점): 도형을 무의미하게 배치하거나 상징적 의도를 찾기 어려움

④ 표현 및 형식 (최대 2점)
- 능숙(2점): 도형 제한, 채색 금지, 5문장 가이드를 모두 완벽하게 준수함
- 전략(1.5점): 규칙을 대부분 준수하였으나 문장 수나 가이드 구성이 일부 미흡함
- 적응(1점): 규칙 중 한 가지를 위반함
- 탐색(0.5점): 규칙을 전반적으로 무시하거나 과제를 미완성함

아래 JSON 형식으로만 응답하세요. JSON 외 텍스트는 절대 포함하지 마세요.

{
  "scores": {
    "reflection": 숫자,
    "coherence": 숫자,
    "symbolism": 숫자,
    "format": 숫자
  },
  "levels": {
    "reflection": "능숙 또는 전략 또는 적응 또는 탐색",
    "coherence": "능숙 또는 전략 또는 적응 또는 탐색",
    "symbolism": "능숙 또는 전략 또는 적응 또는 탐색",
    "format": "능숙 또는 전략 또는 적응 또는 탐색"
  },
  "keywords": ["#키워드1", "#키워드2", "#키워드3"],
  "feedback": "학생에게 전달할 2~3문장의 따뜻하고 성장 지향적인 피드백"
}`;

              const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": process.env.ANTHROPIC_API_KEY,
                  "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                  model: "claude-sonnet-4-20250514",
                  max_tokens: 1000,
                  messages: [{ role: "user", content: prompt }],
                }),
              });

              const data = await response.json();
              const resultText = data.content[0].text;
              const result = JSON.parse(resultText);

              res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              });
              res.end(JSON.stringify(result));
            } catch (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        });
      },
    },
  ],
});