import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateQuestions = async (req, res) => {
  try {
    const { grade, level, skill } = req.body;

    const prompt = `
    Bạn là giáo viên tiếng Anh. 
    Hãy tạo 5 câu hỏi trắc nghiệm cho học sinh lớp ${grade}, trình độ ${level}, kỹ năng ${skill}.
    Mỗi câu gồm: "question", 4 "options", 1 "answer", và "explanation" ngắn gọn.
    Trả về JSON hợp lệ.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const text = completion.choices[0].message.content;
    const jsonStart = text.indexOf("[") >= 0 ? text.indexOf("[") : text.indexOf("{");
    const cleanJson = text.slice(jsonStart);

    const result = JSON.parse(cleanJson);

    res.json({
      grade,
      level,
      skill,
      questions: result,
    });
  } catch (err) {
    console.error("Lỗi tạo câu hỏi:", err);
    res.status(500).json({ message: "Không thể tạo câu hỏi" });
  }
};
