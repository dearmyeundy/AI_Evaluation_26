import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { essay, shapes, name, canvasImage, submissionId } = await req.json();

    const shapeSummary = shapes
      ? `사용한 도형: 원(○) ${shapes.circle || 0}개, 삼각형(△) ${shapes.triangle || 0}개, 사각형(□) ${shapes.rect || 0}개, 선 ${shapes.line || 0}개`
      : "도형 정보 없음";

    const prompt = `
당신은 중학교 1학년 담임 선생님입니다.
학생이 그림책 『너는 어떤 씨앗이니?』를 읽고 작성한 독후 에세이를 아래 루브릭에 따라 채점해주세요.

[분석 원칙]
- 에세이 텍스트를 주된 분석 대상으로 삼고, 도형 정보는 참고 정보로만 활용하세요.
- 도형 배열의 창의성이나 학생의 내면 상태를 직접 판단하지 마세요.
- 학생이 에세이에서 서술한 도형의 의미와 실제 도형 선택 간의 일관성, 설명의 구체성, 형식 준수 여부를 중심으로 분석하세요.

[학생 제출 정보]
- ${shapeSummary}
- 에세이 내용: ${essay}

[키워드 추출 가이드]
아래 목록에서 학생의 수준에 맞는 키워드를 3개 선택하세요.
- 자기 경험 연계 서술: #구체적_경험_연결, #삶의_투영, #자기_서사_완성, #경험_연계_시도, #성장_서술, #발전_가능성, #일반적_다짐, #경험_연결_부족, #의지_표명, #줄거리_요약, #경험_서술_없음, #시작점
- 그림-글 연결 일관성: #완벽한_일치, #설득력_높음, #상징_고도화, #의도_전달, #적절한_연계, #구조적_연결, #설명_모호, #부분적_연결, #보완_필요, #의미_단절, #설명_부족, #불일치
- 도형 의미 부여 및 설명 일관성: #구체적_의미_부여, #배치_설명_완성, #일관된_서술, #의미_부여_시도, #설명_연결, #배치_의도_전달, #단순_설명, #의미_부여_미흡, #추상적_서술, #의미_설명_없음, #배치_의도_불명, #미완성
- 과제 조건 준수: #조건_완벽_준수, #형식_완성, #가이드_이행, #대부분_준수, #일부_미흡, #문장_수정_필요, #조건_일부_위반, #규칙_재확인, #형식_보완, #조건_전반_위반, #미완성, #가이드_미달

[수준별 피드백 전략]
- 완성: 강점을 동료처럼 인정하고, 더 깊은 사고로 확장할 수 있는 질문을 한 가지 덧붙이세요.
- 발전: 잘한 점을 먼저 구체적으로 언급하고, 한 가지 보완 방향을 친절하게 제안하세요.
- 시도: 시도한 것 자체를 인정하고, 다음에 어떻게 하면 좋을지 쉽고 구체적인 힌트를 제공하세요.
- 탐색: 오늘 시작한 것 자체를 충분히 의미 있게 인정하고, 한 가지 아주 작고 쉬운 다음 단계만 제안하세요.

[루브릭 채점 기준]

① 자기 경험 연계 서술 (최대 8점)
- 완성(8점): 잠재력과 미래를 자신의 구체적 경험과 연결하여 서술함
- 발전(6점): 잠재력과 성장의 모습을 제시하며 자기 삶과 연결하려는 서술이 나타남
- 시도(4점): 일반적인 다짐이나 기대를 서술하나 자기 경험과의 연결이 부족함
- 탐색(2점): 책 내용을 요약하거나 자기 경험과의 연결이 나타나지 않음

② 그림-글 연결 일관성 (최대 6점)
- 완성(6점): 도형의 특성과 텍스트 설명이 완벽하게 일치하며 설득력이 높음
- 발전(4.5점): 그림과 글의 관계가 적절하며 상징 의도가 텍스트를 통해 전달됨
- 시도(3점): 그림과 글이 연결되나 도형 선택 이유 설명이 모호함
- 탐색(1.5점): 그림과 글이 연결되지 않거나 도형에 대한 설명이 부족함

③ 도형 의미 부여 및 설명 일관성 (최대 4점)
- 완성(4점): 도형의 크기·위치·배치에 부여한 의미를 에세이에서 구체적이고 일관되게 서술함
- 발전(3점): 도형의 배치에 의미를 부여하고 에세이에서 설명하였으나 일부 연결이 부족함
- 시도(2점): 도형을 사용하였으나 에세이에서의 의미 설명이 단순하거나 추상적임
- 탐색(1점): 도형 배치에 대한 의미 부여나 설명이 나타나지 않음

④ 과제 조건 준수 (최대 2점)
- 완성(2점): 도형 제한·채색 금지·5문장 가이드를 모두 준수함
- 발전(1.5점): 대부분 준수하였으나 문장 수나 가이드 구성이 일부 미흡함
- 시도(1점): 조건 중 한 가지를 위반함
- 탐색(0.5점): 조건을 전반적으로 위반하거나 과제가 미완성임

아래 JSON 형식으로만 응답하세요. JSON 외 텍스트는 절대 포함하지 마세요.

{
  "scores": {
    "reflection": 숫자,
    "coherence": 숫자,
    "symbolism": 숫자,
    "format": 숫자
  },
  "levels": {
    "reflection": "완성 또는 발전 또는 시도 또는 탐색",
    "coherence": "완성 또는 발전 또는 시도 또는 탐색",
    "symbolism": "완성 또는 발전 또는 시도 또는 탐색",
    "format": "완성 또는 발전 또는 시도 또는 탐색"
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
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!data.content || !data.content[0]) {
      throw new Error("Claude 응답 오류: " + JSON.stringify(data));
    }

    const resultText = data.content[0].text;
    const cleaned = resultText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    // Netlify Blobs에 저장
    const store = getStore("submissions");
    const submission = {
      id: submissionId,
      name,
      essay,
      result,
      canvasImage,
      approved: false,
      submittedAt: new Date().toLocaleString("ko-KR"),
    };
    await store.setJSON(submissionId, submission);

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

export const config = { path: "/api/score" };