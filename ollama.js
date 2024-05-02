// #############################################
// ###                                       ###
// ###          DISCLAIMER                   ###
// ###                                       ###
// #############################################

// The script "ollama.js" is provided as-is, without any warranties or guarantees of any kind.
// The creator of this script is not responsible for any damages or consequences arising from the use of this script. 
// Use it at your own risk.

// Description:
// "ollama.js" is a Node.js script designed for integrating the Ollama natural language processing (NLP) engine into WhatsApp chatbots. 
// It allows users to interact with Ollama-powered chatbots on the WhatsApp platform.

// Creator:
// This script was created by MaliosDark. For inquiries or support, please contact malios666@gmail.com.

// Instructions:
// 1. Before using the script, ensure that you have configured the required settings, including:
//    - Phone number associated with your WhatsApp session. line 33
//    - Configuration of the Ollama model, including language and prompt settings.
//    - Deleting the "!" it will alow you to freely chat to the bot.
//    - once started. the first message that every user send to the bot it would respond it with a 🤖.
//      ( this meaning that a private chat had been created and is ready to chat and remember the conversation from that specific user.
//      Maintaining the privacy on managing multiple chats with ollama.)
//    - Must Note that conversations are saved while the script is running, once restarted chats would start again with a 🤖 and no memory of conversations.

// 2. Make sure to handle any errors or exceptions that may occur during script execution.

// 3. Use this script responsibly and adhere to the terms of service of any third-party services it interacts with.

// 4. Whatsapp does not Allow Bots on their platform. And here we are.
//
//
//
//
// Import the DuckDuckGo search dependency
const duckDuckScrape = require('duck-duck-scrape');

// Import the Venom dependency
const venom = require('venom-bot');
// Import the Ollama class from ollama-node
const { Ollama } = require('ollama-node');

// Phone number associated with your WhatsApp session
const yourPhoneNumber = '000000000000';

// Object to store Ollama instances associated with phone numbers
const ollamaInstances = {};

// Function to get or create an Ollama instance associated with a phone number
function getOllamaInstance(phoneNumber) {
  // Check if there is already an instance for this number
  if (!ollamaInstances[phoneNumber]) {
    // If it doesn't exist, create a new instance and store it
    ollamaInstances[phoneNumber] = new Ollama();
    // Configure the Ollama Mistral model with the Spanish pretext
    setupModel(ollamaInstances[phoneNumber]);
  }
  // Return the instance associated with the phone number
  return ollamaInstances[phoneNumber];
}

// Configure the Ollama model with the Spanish pretext
async function setupModel(ollamaInstance) {
  try {
    await ollamaInstance.setModel('mistral', {
      pretext: 'you are a very helpful bot',
      language: 'en',
      prompt: 'How can i help you today?' // Pre-prompt for additional context
    });
    console.log('Ollama model configured successfully.');
  } catch (error) {
    console.error('Error setting up Ollama model:', error);
  }
}

// Create a WhatsApp session with Venom
venom
  .create({
    session: 'session-name' // WhatsApp session name
  })
  .then((client) => start(client))
  .catch((error) => {
    console.log(error);
  });

// Function to start the WhatsApp client
function start(client) {
  // Listen for incoming messages and respond using Ollama or search with DuckDuckGo
  client.onMessage(async (message) => {
    try {
      // Check if the message starts with "!" or if the sender is your phone number
      if (message.body.startsWith('!') || message.from === yourPhoneNumber) {
        // Get the command text by removing the "!"
        const command = message.body.slice(1).trim();
        
        // Get the Ollama instance associated with the sender's phone number
        const ollamaInstance = getOllamaInstance(message.from);

        // Predefined options for interpretation generation
        const options = {
          max_tokens: 60,
          temperature: 0.9,
          top_p: 0.9,
          presence_penalty: 0.5,
          frequency_penalty: 0.5
        };

        // Generate a response using the corresponding Ollama instance
        const response = await ollamaInstance.generate(command, options);
        
        // Add the robot icon at the beginning of the response
        const responseWithIcon = "🤖 " + response.output;

        // Send the generated response as a WhatsApp message to the sender
        client
          .sendText(message.from, responseWithIcon)
          .then((result) => {
            console.log('Response sent successfully:', result);
          })
          .catch((error) => {
            console.error('Error sending response:', error);
          });
      } else if (message.body.startsWith('/search')) {
        // Get the search query by removing "/search"
        const query = message.body.slice(8).trim();

        // Perform the search on DuckDuckGo
        duckDuckScrape.search(query)
          .then((results) => {
            if (results && results.length > 0) {
              // Take the first result of the search
              const firstResult = results[0];
              // Check if the first result has a title and a URL
              if (firstResult.title && firstResult.url) {
                // Send the title and the link of the first result as a WhatsApp message to the sender
                const response = `${firstResult.title}\n${firstResult.url}`;
                client.sendText(message.from, response)
                  .then((result) => {
                    console.log('Search response sent successfully:', result);
                  })
                  .catch((error) => {
                    console.error('Error sending search response:', error);
                  });
              } else {
                console.error('No title or URL found in the first search result.');
              }
            } else {
              console.error('No results found in the search.');
            }
          })
          .catch((error) => {
            console.error('Error performing the search:', error);
          });
      }
    } catch (error) {
      console.error('Error processing the message:', error);
    }
  });
}
