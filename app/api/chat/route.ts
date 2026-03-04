import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/search";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // 1. Cari chunk relevan dari Supabase
    const relevantChunks = await searchDocuments(message);

    // 2. Gabungin chunk jadi konteks
    const context =
      relevantChunks.length > 0
        ? `Berikut informasi relevan dari dokumen:\n\n${relevantChunks.join("\n\n")}`
        : "Tidak ada dokumen yang relevan ditemukan.";

    // 3. Kirim ke Groq dengan konteks
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Kamu adalah asisten yang membantu menjawab pertanyaan berdasarkan dokumen yang diberikan. 
Jawab hanya berdasarkan konteks yang ada. Jika informasi tidak ada di dokumen, katakan dengan jujur.`,
        },
        {
          role: "user",
          content: `${context}\n\nPertanyaan: ${message}`,
        },
      ],
    });

    const reply = completion.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
