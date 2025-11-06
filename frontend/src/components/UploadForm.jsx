import React, { useState } from "react";
import { generateQuiz } from "../api";

const UploadForm = ({ setQuizData, setLoading }) => {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first!");
    setLoading(true);
    try {
      const data = await generateQuiz(file);
      setQuizData(data);
    } catch (err) {
      alert("Error generating quiz. Check backend connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-3xl font-bold mb-6">AI QuizGen</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md w-80">
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4 w-full border border-gray-300 p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
        >
          Generate Quiz
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
