import { getStore }  from "@netlify/blobs";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const store = getStore("submissions");

  // GET — 전체 목록 불러오기
  if (req.method === "GET") {
    try {
      const { blobs } = await store.list();
      const submissions = await Promise.all(
        blobs.map((blob) => store.get(blob.key, { type: "json" }))
      );
      return new Response(JSON.stringify(submissions.filter(Boolean)), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  }

  // POST — 승인/피드백 수정 저장
  if (req.method === "POST") {
    try {
      const { id, teacherFeedback, approved } = await req.json();
      const existing = await store.get(id, { type: "json" });
      if (!existing) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      }
      const updated = { ...existing, teacherFeedback, approved };
      await store.setJSON(id, updated);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  }
};

export const config = { path: "/api/submissions" };