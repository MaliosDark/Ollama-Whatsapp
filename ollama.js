// Import the 'venom-bot' library for WhatsApp integration
const venom = require('venom-bot');
// Import the Ollama class from the 'ollama-node' library
const { Ollama } = require('ollama-node');
const { exec } = require('child_process');
const duckduckgoSearch = require("duckduckgo-search");

// Object to store Ollama instances associated with phone numbers
const ollamaInstances = {};

// Function to set up the CUDA environment
function setupCUDAEnvironment() {
  // Execute the command to set the CUDA_VISIBLE_DEVICES environment variable
  exec('export CUDA_VISIBLE_DEVICES=0', (error, stdout, stderr) => {
    if (error) {
      console.error('Error setting CUDA environment:', error);
      return;
    }
    if (stderr) {
      console.error('CUDA environment setup warning:', stderr);
      return;
    }
    console.log('CUDA environment configured successfully.');
  });
}

// Call the function to set up the CUDA environment at startup
setupCUDAEnvironment();

// Function to get or create an Ollama instance associated with a phone number
function getOllamaInstance(phoneNumber) {
  // Check if an instance already exists for this number
  if (!ollamaInstances[phoneNumber]) {
    // If not, create a new instance and store it
    ollamaInstances[phoneNumber] = new Ollama();
    // Set up the model of Ollama with the Spanish pretext
    setupModel(ollamaInstances[phoneNumber]);
  }
  // Return the instance associated with the phone number
  return ollamaInstances[phoneNumber];
}

// Set up the  model of Ollama with the Spanish pretext
async function setupModel(ollamaInstance) {
  try {
    await ollamaInstance.setModel('zephyr', { //---> SET THE OLLAMA MODEL HERE
      pretext:
        'You are a very helpful chatbot.',
      language: 'english',
      prompt: 'How can I help you today?' // Pre-prompt for additional context
    });
    console.log('Ollama Model configured successfully.');
  } catch (error) {
    console.error('Error configuring Ollama model:', error);
  }
}

// Create a WhatsApp session with Venom
venom
  .create({
    session: 'session-name', // Session name for WhatsApp
    autoClose: false // Keep the session open even if the client is inactive
  })
  .then((client) => start(client))
  .catch((error) => {
    console.log(error);
  });

// Function to start the WhatsApp client
function start(client) {
  // Listen for incoming messages and respond using Ollama
  client.onMessage(async (message) => {
    try {
      // Check if the message is from a known sender and not from the bot itself
      if (message.from && message.body && !message.from.includes('@c.us')) {
        // Check if the message starts with "!"
        if (message.body.startsWith('!')) { //---> THIS CAN BE DEACTIVATED JUST DELETING THE !
          // Get the Ollama instance associated with the sender's phone number
          const ollamaInstance = getOllamaInstance(message.from);

          // Options for response generation with custom parameters
          const customOptions = {
            max_tokens: 60,
            temperature: 0.7, // Lower temperature for more conservative responses
            top_p: 0.8, // Adjust top-p to control response diversity
            presence_penalty: 0.3, // Penalize for repeating phrases
            frequency_penalty: 0.2 // Penalize for using infrequent phrases
          };

          // Generate a response using the corresponding Ollama instance with custom options
          const response = await ollamaInstance.generate(message.body.slice(1).trim(), customOptions);

          // Send the generated response as a WhatsApp message to the sender
          client
            .sendText(message.from, response.output)
            .then((result) => {
              console.log('Response sent successfully:', result);
            })
            .catch((error) => {
              console.error('Error sending response:', error);
            });
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
    }
  });
}
