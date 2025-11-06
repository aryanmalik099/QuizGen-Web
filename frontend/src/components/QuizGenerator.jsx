import React, { useState } from "react";
import { jsPDF } from "jspdf";

export default function QuizGenerator() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let payload;
      let headers;
      let url = "http://127.0.0.1:5000/generate";

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        payload = formData;
        headers = {}; // Let browser set Content-Type for FormData
      } else {
        payload = JSON.stringify({ text });
        headers = { "Content-Type": "application/json" };
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: payload,
      });

      const data = await res.json();
      setQuiz(data.questions || []);
    } catch (err) {
      console.error(err);
      alert("Error generating quiz. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!quiz) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("AI Generated Quiz", 10, 10);
    let y = 20;

    quiz.forEach((q, idx) => {
      doc.text(`${idx + 1}. ${q.question}`, 10, y);
      y += 8;
      q.options.forEach((opt, i) => {
        doc.text(`  ${String.fromCharCode(65 + i)}. ${opt}`, 14, y);
        y += 6;
      });
      doc.text(`Answer: ${q.answer}`, 10, y);
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("quiz.pdf");
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>🧠 AI Quiz Generator</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your notes or text here..."
        rows={8}
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
      />

      <p style={{ textAlign: "center", margin: "10px 0" }}>— OR —</p>

      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
        style={{ marginBottom: "10px" }}
      />

      <div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          {loading ? "Generating..." : "Generate Quiz"}
        </button>

        {quiz && (
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Download as PDF
          </button>
        )}
      </div>

      {quiz && (
        <div style={{ marginTop: "30px" }}>
          <h3>Generated Quiz</h3>
          {quiz.map((q, idx) => (
            <div key={idx} style={{ marginBottom: "20px" }}>
              <strong>
                {idx + 1}. {q.question}
              </strong>
              <ul>
                {q.options.map((opt, i) => (
                  <li key={i}>{opt}</li>
                ))}
              </ul>
              <p>
                <b>Answer:</b> {q.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
