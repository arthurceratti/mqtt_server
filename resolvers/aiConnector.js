import dotenv from 'dotenv';
import path from 'path';
import ollama from 'ollama'

function loadConfig(envFilePath) {

    const envPath = envFilePath ? path.resolve(process.cwd(), envFilePath) : path.resolve(process.cwd(), '.env');
    const dotenvResult = dotenv.config({ path: envPath });
    if (dotenvResult.error) {
        if (dotenvResult.error && dotenvResult.error.code === 'ENOENT') {
            console.log(`.env file not found at ${envPath} (continuing with existing environment variables)`);
        } else {
            console.warn('Warning: could not load .env file:', dotenvResult.error.message || dotenvResult.error);
        }
    } else {
        console.log(`Loaded environment variables from ${envPath}`);
    }
}



async function promptLocalAI(promptText) {
  loadConfig();
  let AI_URL = process.env.AI_URL || 'http://192.168.0.101:11434/api/generate';
  
  try {
    console.log("Sending prompt to AI:", promptText);
    console.log("Using AI URL:", AI_URL);

    const response = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:1.5b',
        prompt: promptText,
        stream: false
      }),
    });
    const responseData = await response.json();
    console.log("Received response from AI:", responseData.response);
    return responseData.response;
  } catch (error) {
    console.error("Could not fetch the response:", error);
  }
}
 

console.log("AI Connector initialized.");
//promptLocalAI("What is the capital of France?");    


export default { promptLocalAI };