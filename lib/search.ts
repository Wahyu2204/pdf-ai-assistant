import { createClient } from "@/lib/supabase/server";
import { getEmbedding } from "@/lib/embedding";

export async function searchDocuments(query: string, limit = 5): Promise<string[]> {
  const supabase = await createClient();
  
  // Convert pertanyaan user ke vector
  const embedding = await getEmbedding(query);

  // Cari chunk yang paling mirip di Supabase
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: limit,
  });

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data.map((doc: { content: string }) => doc.content);
}