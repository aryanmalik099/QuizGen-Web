import React from "react";

const QuizDisplay = ({ quizData }) => {
  if (!quizData || !quizData.questions) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Generated Quiz</h2>
      <ul className="space-y-4">
        {quizData.questions.map((q, index) => (
          <li key={index} className="bg-white p-4 rounded-xl shadow-sm">
            <p className="font-semibold">{index + 1}. {q.question}</p>
            {q.options && (
              <ul className="ml-4 mt-2 list-disc">
                {q.options.map((opt, i) => (
                  <li key={i}>{opt}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuizDisplay;
