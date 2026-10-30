import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kaggleUrl = "https://virtually-agricultural-estimate-lan.trycloudflare.com/ask"; // PUT YOUR URL HERE

    console.log("Forwarding request to:", kaggleUrl);

    const res = await fetch(`${process.env.BACKEND_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Kaggle responded with error:", res.status, errorText);
      return NextResponse.json({ error: `Kaggle returned ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy Fetch Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}