import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000"; // Flask backend

export const generateQuiz = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(`${API_BASE_URL}/generate-quiz`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
