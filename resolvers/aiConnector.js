import dotenv from 'dotenv';
import path from 'path';
import ollama from 'ollama';


let AI_URL;

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

    const AI_URL = process.env.AI_URL || 'http://localhost:11434';

    console.log(`AI Connector URL set to: ${AI_URL}`);

    const payload = {
    model: 'Qwen2.5:latest',
    prompt: promptText,
    stream: false // Set to true to receive responses in chunks
    };

  try {
    const response = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log(data.response); // The generated text
  } catch (error) {
    console.error("Error calling the local AI API:", error);
  }
}
 
loadConfig();
console.log("AI Connector initialized.");
//promptLocalAI("What is the capital of France?");    


export default { promptLocalAI };