// pages/api/action.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  try {
    const payload = req.body;
    console.log("Frame action payload:", payload);

    // Optional: Add simple verification / logging here.
    // If you want to notify yourself, you can send to a webhook, store in DB, etc.

    return res.status(200).json({ ok: true, received: payload || null });
  } catch (err) {
    console.error("Action handler error:", err);
    return res.status(500).json({ ok: false, error: (err?.message || "server error") });
  }
}
