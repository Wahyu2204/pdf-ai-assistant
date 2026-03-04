# Omni Read AI

AI-powered document assistant that lets you upload PDF files and ask questions about their content using RAG (Retrieval-Augmented Generation).

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat-square&logo=supabase)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-F55036?style=flat-square)
![HuggingFace](https://img.shields.io/badge/HuggingFace-Embeddings-FFD21E?style=flat-square&logo=huggingface)

## Features

- Upload PDF documents and extract text automatically
- AI answers questions based on document content
- RAG pipeline: chunking → embedding → vector search → LLM response
- Clean dark UI similar to ChatGPT
- Powered by LLaMA 3.3 via Groq API

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + pgvector) |
| LLM | Groq API (LLaMA 3.3 70B) |
| Embeddings | HuggingFace Inference API |
| PDF Parsing | pdf-parse-fork |

## How It Works

```
Upload PDF
    ↓
Extract text → Split into chunks
    ↓
Convert chunks to vectors (embeddings)
    ↓
Store vectors in Supabase (pgvector)

User asks a question
    ↓
Convert question to vector
    ↓
Find most similar chunks in Supabase
    ↓
Send relevant chunks as context to LLaMA
    ↓
AI answers based on document content
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Groq API key
- HuggingFace API key

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/omni-read-ai.git
cd omni-read-ai
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your API keys in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
GROQ_API_KEY=your_groq_api_key
HF_API_KEY=your_huggingface_api_key
```

4. Set up Supabase

Run the following SQL in your Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(384),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ON documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(384),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click **Upload PDF** in the sidebar
2. Select a PDF file
3. Wait for the document to be processed
4. Ask questions about the document content in the chat

## Project Structure

```
omni-read-ai/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Chat endpoint (Groq LLM)
│   │   └── upload/route.ts    # PDF upload & processing
│   └── page.tsx               # Main UI
├── lib/
│   ├── chunker.ts             # Text chunking logic
│   ├── embedding.ts           # HuggingFace embeddings
│   ├── search.ts              # Vector search (Supabase)
│   └── supabase/              # Supabase client setup
├── proxy.ts                   # Next.js middleware
└── .env.local                 # Environment variables
```

## License

MIT