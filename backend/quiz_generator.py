import os
from dotenv import load_dotenv
import google.generativeai as genai
import time

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_quiz(text, difficulty="medium", num_questions=10, retries=2):
    """
    Generates a multiple-choice quiz from text using Gemini.
    Retries automatically if the model gives no output.
    """

    model_name = "models/gemini-2.5-flash"

    prompt = f"""
You are an expert quiz generator.

Create a {difficulty}-level multiple-choice quiz based on the following text.
Generate exactly {num_questions} questions.

Each question must have:
- Four options labeled A, B, C, D
- One correct answer clearly shown as "Answer: <letter>"

Example format:

Q1. Question text
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Answer: A

Here is the source text:
{text}
"""

    model = genai.GenerativeModel(model_name)

    for attempt in range(retries):
        try:
            response = model.generate_content(prompt)
            quiz_output = getattr(response, "text", None) or str(response)

            if quiz_output and quiz_output.strip():
                return quiz_output.strip()

            print(f"[Retry {attempt+1}] Empty quiz, retrying...")
            time.sleep(2)

        except Exception as e:
            print(f"Error generating quiz (attempt {attempt+1}):", e)
            time.sleep(2)

    return "Error: No quiz generated after retries."
