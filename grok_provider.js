const grokProvider = {
  id: 'grok_xai_solomon_codex',  // Unique ID for our system
  name: 'Grok (Solomon Codex)', // Display name in the UI
  description: 'Direct integration with the Grok API via the Solomon Codex Engine.',
  icon: 'https://static.wixstatic.com/media/033973_e7b86371720842e2a9515a450257a33b~mv2.png/v1/fill/w_320,h_320,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/grok-logo.png', // A functional icon URL
  models: [
    { id: 'grok-1', name: 'Grok-1', description: 'Powerful, large-context Grok model' },
    { id: 'llama3-70b-8192', name: 'Llama3 70b (via Grok)', description: 'High-speed Llama3 endpoint' }
    // Add other models provided by the Grok API as needed
  ],
  apiUrl: 'https://api.groq.com/openai/v1/chat/completions',  // NOTE: This uses the Groq Inc. API endpoint which is OpenAI-compatible and what the key you provided works with. If you get a specific x.ai key, we'll change this.

  // --- CRITICAL STEP: INSERT YOUR API KEY BELOW ---
  apiKey: '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',

  request: async function (model, prompt, options) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2048
        })
      });
      const data = await response.json();
      if (data.error) {
        console.error("Grok API Error:", data.error.message);
        throw new Error(data.error.message);
      }
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Failed to fetch from Grok API:", error);
      return `Error communicating with Grok API: ${error.message}`;
    }
  }
};

