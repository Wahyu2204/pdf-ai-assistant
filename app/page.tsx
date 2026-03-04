"use client";
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [filename, setFilename] = useState("");

  const uploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  alert("⏳ Sedang memproses PDF, tunggu sebentar...");

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();

  if (data.success) {
    setFilename(data.filename);
    alert(`✅ ${data.filename} berhasil diproses! ${data.chunks} chunks disimpan ke database`);
  } else {
    alert("❌ Gagal proses PDF: " + data.error);
  }
};

  const sendMessage = async () => {
    if (!message) return;

    // Kalau ada PDF, kirim teksnya sebagai konteks
    const fullMessage = pdfText 
      ? `Berikut isi dokumen:\n\n${pdfText}\n\nPertanyaan: ${message}`
      : message;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: fullMessage }),
    });
    const data = await res.json();
    setReply(data.reply);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Omni Read AI</h1>
      
      {/* Upload PDF */}
      <div>
        <input type="file" accept=".pdf" onChange={uploadPDF} />
        {filename && <p>✅ File: {filename}</p>}
        {pdfText && <p>📄 {pdfText.length} karakter berhasil dibaca</p>}
      </div>

      <hr />

      {/* Chat */}
      <div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tanya sesuatu tentang dokumen..."
          style={{ width: "400px", marginRight: "8px" }}
        />
        <button onClick={sendMessage}>Kirim</button>
      </div>

      {reply && (
        <div style={{ marginTop: "16px", background: "#f0f0f0", padding: "12px" }}>
          <strong>AI:</strong> {reply}
        </div>
      )}
    </div>
  );
}