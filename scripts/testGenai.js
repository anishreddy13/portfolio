const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const ai = new GoogleGenAI({}); 
    // Uses GEMINI_API_KEY from environment
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Hello'
    });
    console.log("Success! Response:");
    console.log(response.text);
  } catch (error) {
    console.error("GenAI Error:");
    console.error(error);
  }
}

test();
