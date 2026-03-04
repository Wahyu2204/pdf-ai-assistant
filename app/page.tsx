"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filename, setFilename] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [chunks, setChunks] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setIsUploading(false);

    if (data.success) {
      setFilename(data.filename);
      setChunks(data.chunks);
      setMessages([{
        role: "ai",
        content: `Dokumen "${data.filename}" berhasil diproses! ${data.pages} halaman, ${data.chunks} bagian siap untuk ditanya. Silakan ajukan pertanyaan tentang isi dokumen.`,
      }]);
    } else {
      alert("Gagal proses PDF: " + data.error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });
    const data = await res.json();
    setIsLoading(false);
    setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-[#212121] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#171717] flex flex-col p-4 gap-4 shrink-0">
        {/* Logo */}
        <div className="px-2 py-3">
          <h1 className="text-lg font-semibold text-white">Omni Read AI</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Document Assistant</p>
        </div>

        {/* Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition-colors text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 10V3M8 3L5.5 5.5M8 3L10.5 5.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" strokeLinecap="round"/>
          </svg>
          Upload PDF
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={uploadPDF}
          className="hidden"
        />

        {/* Upload state */}
        {isUploading && (
          <div className="flex items-center gap-2 px-2 text-xs text-neutral-500">
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Memproses dokumen...
          </div>
        )}

        {/* File info */}
        {filename && !isUploading && (
          <div className="px-3 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs text-white font-medium truncate">{filename}</span>
            </div>
            <p className="text-xs text-neutral-500 pl-4">{chunks} chunks tersimpan</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto text-xs text-neutral-600 px-2 leading-relaxed">
          Upload PDF lalu tanyakan apapun tentang isinya.
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-700">
          <span className="text-sm text-neutral-400 truncate">
            {filename || "Belum ada dokumen"}
          </span>
          <span className="text-xs text-neutral-600 shrink-0 ml-4">LLaMA 3.3 · RAG</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-2xl">
                📄
              </div>
              <p className="text-base font-medium text-neutral-400">Mulai dengan upload dokumen</p>
              <p className="text-sm text-neutral-600 max-w-xs">
                Upload file PDF di sidebar, lalu tanyakan apapun tentang isinya.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  msg.role === "ai"
                    ? "bg-neutral-700 text-white"
                    : "bg-white text-black"
                }`}>
                  {msg.role === "ai" ? "AI" : "U"}
                </div>

                {/* Bubble */}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "ai"
                    ? "bg-neutral-800 text-neutral-100 rounded-tl-sm"
                    : "bg-white text-black rounded-tr-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium shrink-0">
                AI
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-neutral-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-6 pt-2">
          <div className={`flex items-end gap-3 bg-neutral-800 border rounded-2xl px-4 py-3 transition-colors ${
            filename ? "border-neutral-600 focus-within:border-neutral-400" : "border-neutral-700 opacity-50"
          }`}>
            <textarea
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-neutral-500 resize-none max-h-32 min-h-6 leading-6"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={filename ? "Tanya tentang dokumen..." : "Upload dokumen terlebih dahulu..."}
              disabled={!filename || isLoading}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || !filename}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="black" strokeWidth="2.5">
                <path d="M8 12V4M8 4L4.5 7.5M8 4L11.5 7.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-neutral-700 mt-2">
            Enter untuk kirim · Shift+Enter untuk baris baru
          </p>
        </div>
      </main>
    </div>
  );
}