import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEmbedding } from "@/lib/embedding";
import { chunkText } from "@/lib/chunker";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse-fork");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 },
      );
    }

    // 1. Parse PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    // 2. Chunk teks
    const chunks = chunkText(text);

    // 3. Embed setiap chunk & simpan ke Supabase
    const supabase = await createClient();

    // Hapus chunk lama dari file yang sama dulu
    await supabase
      .from("documents")
      .delete()
      .eq("metadata->>filename", file.name);

    // Insert chunk
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);
      await supabase.from("documents").insert({
        content: chunk,
        metadata: { filename: file.name, pages: pdfData.numpages },
        embedding,
      });
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      pages: pdfData.numpages,
      chunks: chunks.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 },
    );
  }
}
