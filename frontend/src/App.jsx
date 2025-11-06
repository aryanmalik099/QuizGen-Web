import React, { useState } from "react";
import "./App.css";
import { jsPDF } from "jspdf";


function App() {
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(10);
  const [fastMode, setFastMode] = useState(false);
  const [globalShow, setGlobalShow] = useState(false);

  // --------------------------
  // Generate quiz from topic
  // --------------------------
  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }
    
    if (numQuestions > 50) {
      alert("Maximum 50 questions are allowed.");
      return;
    }

    setLoading(true);
    setQuiz("");
    setLoadingMessage("Generating quiz...");

    try {
      const response = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic,
          difficulty: difficulty,
          num_questions: numQuestions,
        }),
      });

      const data = await response.json();
      if (data.quiz) setQuiz(data.quiz);
      else alert(data.error || "No quiz generated.");
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Generate quiz from PDF
  // --------------------------
  const handlePDFUpload = async () => {
    if (!selectedFile) {
      alert("Please select a PDF file first.");
      return;
    }

    setQuiz("");
    setLoading(true);
    setLoadingMessage("Starting PDF processing...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `http://127.0.0.1:5000/upload?fast=${fastMode}&difficulty=${difficulty}&num_questions=${numQuestions}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        setLoading(false);
        alert("Failed to process PDF. Try again.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status) setLoadingMessage(data.status);
            if (data.error) {
              setLoading(false);
              alert(data.error);
              return;
            }
            if (data.done && data.quiz) {
              accumulatedText = data.quiz;
            }
          } catch (err) {
            console.warn("Stream parse warning:", err);
          }
        }
      }

      setQuiz(accumulatedText || "No quiz generated.");
    } catch (err) {
      console.error("Error uploading PDF:", err);
      alert("An error occurred while uploading the PDF.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Download quiz
  // --------------------------
  const downloadQuiz = () => {
    const doc = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: "a4",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.text("QUIZ", 40, 40);
    doc.setFontSize(11);

    let y = 70;
    const lineHeight = 18;

    const questions = parseQuiz(quiz);

    questions.forEach((q, idx) => {
      // Add question text
      doc.text(`${idx + 1}. ${q.question}`, 40, y);
      y += lineHeight;

      // Add options
      q.options.forEach((opt) => {
        doc.text(opt, 60, y);
        y += lineHeight;
      });

      // Add answer
      doc.setFont("helvetica", "bold");
      doc.text(`Answer: ${q.answer}`, 60, y);
      doc.setFont("helvetica", "normal");
      y += lineHeight + 10;

      // New page if needed
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.save("generated_quiz.pdf");
  };

  // --------------------------
  // Parse quiz into structured list
  // --------------------------
  const parseQuiz = (quizText) => {
    const questions = [];
    // Match blocks like "Q1. Question... A) ... D) ... Answer: ..."
    const blocks = quizText.match(/Q\d+\..*?(?=Q\d+\.|$)/gs);

    if (!blocks) return questions;

    for (const block of blocks) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const questionLine = lines[0].replace(/^Q\d+\.\s*/, ""); // remove Q1. prefix
      const options = lines
        .filter((l) => /^[A-D]\)/.test(l))
        .map((l) => l.replace(/^([A-D]\))\s*/, "$1 "));
      const answer =
        lines.find((l) => /^Answer:/i.test(l))?.replace(/^Answer:\s*/i, "") ||
        "N/A";

      questions.push({
        id: questions.length + 1,
        question: questionLine,
        options,
        answer,
      });
    }

    return questions;
  };

  const questions = quiz ? parseQuiz(quiz) : [];

  return (
    <div className="app">
      <h1>AI Quiz Generator</h1>

      {/* Universal options */}
      <div className="options-row">
        <label>
          Difficulty:
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label>
          No. of Questions:
          <input
            type="number"
            value={numQuestions}
            onChange={(e) => {
              const value = Math.min(50, Math.max(1, parseInt(e.target.value) || 1));
              setNumQuestions(value);
            }}
            min="1"
            max="100"
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={fastMode}
            onChange={(e) => setFastMode(e.target.checked)}
          /> Fast OCR
        </label>
      </div>

      {/* Topic input */}
      <div className="input-section">
        <input
          type="text"
          placeholder="Enter topic (e.g. Cloud Computing)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button className="btn" onClick={handleGenerate}>
          Generate from Topic
        </button>
      </div>

      {/* PDF upload */}
      <div className="input-section">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button className="btn secondary" onClick={handlePDFUpload}>
          Generate from PDF
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="overlay">
          <div className="loader"></div>
          <p>{loadingMessage}</p>
        </div>
      )}

      {/* Quiz display */}
      {quiz && (
        <div className="quiz-section">
          <div className="quiz-header">
            <h2>Generated Quiz</h2>
            <div>
              <button className="btn small" onClick={() => setGlobalShow(!globalShow)}>
                {globalShow ? "Hide All Answers" : "Show All Answers"}
              </button>
              <button className="btn small" onClick={downloadQuiz}>
                Download Quiz
              </button>
            </div>
          </div>

          {questions.map((q) => (
            <QuizCard key={q.id} q={q} globalShow={globalShow} />
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------
// QuizCard Component
// ----------------------
function QuizCard({ q, globalShow }) {
  const [localShow, setLocalShow] = useState(false);
  const isVisible = globalShow || localShow;

  return (
    <div className="card">
      <h3>
        Q{q.id}. {q.question}
      </h3>
      <ul>
        {q.options.map((opt, idx) => (
          <li key={idx}>{opt}</li>
        ))}
      </ul>

      <div className="answer-toggle">
        {!globalShow && (
          <button className="btn small" onClick={() => setLocalShow(!localShow)}>
            {localShow ? "Hide Answer" : "Show Answer"}
          </button>
        )}
        {isVisible && <p className="answer">Option- {q.answer}</p>}
      </div>
    </div>
  );
}

export default App;
