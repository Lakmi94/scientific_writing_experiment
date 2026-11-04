const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw7TC17nQ4m85L8q4NIDy9XO7fyoeKQj2faC-AuE3qXLLBaALB94xwzHz1p2oRKPRIjMg/exec";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let payload = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({ error: "Expected a JSON object" });
  }

  try {
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    if (!upstream.ok) {
      console.error("Apps Script returned HTTP", upstream.status);
      return res.status(502).json({ error: "Google Sheets rejected the submission" });
    }

    const result = await upstream.json();
    if (result.status !== "success") {
      console.error("Apps Script returned an unexpected response");
      return res.status(502).json({ error: "Google Sheets did not confirm the submission" });
    }

    return res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Apps Script forwarding failed:", error);
    return res.status(502).json({ error: "Could not forward the submission to Google Sheets" });
  }
};
