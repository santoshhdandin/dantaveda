# AI Agent Integration Guide

This website includes two AI agent features that can be integrated with Cloudflare Workers:

## Features

### 1. Web Chat Agent (WhatsApp-style)
- Floating green WhatsApp-style chat button in bottom right corner
- Opens a full chat interface with typing indicators
- Supports text-based conversations
- Mobile responsive

### 2. Voice Call Agent
- Floating blue speaker button in bottom right corner
- Opens a voice call interface
- Features:
  - Speech-to-Text (listens to user)
  - Text-to-Speech (responds to user)
  - Automatic conversation flow: Listen → Process → Speak → Listen
  - Mute/unmute functionality
  - Call timer
  - Voice activity indicators

## How It Works

### Voice Agent Flow
1. User clicks the voice button
2. System requests microphone permission
3. Assistant speaks a greeting
4. System starts listening for user input
5. When user speaks, converts speech to text
6. Sends text to Cloudflare endpoint
7. Receives response and speaks it back
8. Returns to listening state
9. Cycle continues until call is ended

### Integration with Cloudflare

#### Step 1: Set Up Your Endpoints

Add this code to your website (after the scripts load):

```javascript
// In browser console or add to your HTML
window.setAgentEndpoints(
  'https://your-chat-worker.workers.dev',  // Chat endpoint
  'https://your-voice-worker.workers.dev'  // Voice endpoint
);
```

#### Step 2: Cloudflare Worker Example (Chat)

```javascript
export default {
  async fetch(request) {
    const { message } = await request.json();

    // Your AI logic here (OpenAI, Anthropic, etc.)
    const response = await getAIResponse(message);

    return new Response(JSON.stringify({
      response: response
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
```

#### Step 3: Cloudflare Worker Example (Voice)

```javascript
export default {
  async fetch(request) {
    const { message, type } = await request.json();

    // Same AI logic, but return shorter responses for voice
    const response = await getAIResponse(message, {
      maxLength: 150,  // Keep voice responses concise
      type: 'voice'
    });

    return new Response(JSON.stringify({
      response: response
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
```

## Demo Mode

Without Cloudflare integration, the agents run in demo mode with pre-programmed responses for:
- Appointment booking
- Service inquiries
- Location questions
- Emergency contacts
- General queries

## Browser Requirements

### Chat Agent
- All modern browsers

### Voice Agent
- Chrome/Edge (recommended)
- Safari (iOS 14.5+)
- Firefox (limited support)
- Requires HTTPS in production

## Mobile Support

Both agents are fully responsive and work on:
- iOS Safari
- Android Chrome
- Mobile browsers with microphone access

## Customization

### Change Button Positions
Edit `css/floating-agents.css`:
```css
.floating-agents {
    bottom: 30px;  /* Change vertical position */
    right: 30px;   /* Change horizontal position */
}
```

### Customize Colors
```css
.chat-button {
    background: linear-gradient(135deg, #YourColor1, #YourColor2);
}

.voice-button {
    background: linear-gradient(135deg, #YourColor1, #YourColor2);
}
```

## Testing

1. Open the website
2. Click the chat button (green WhatsApp icon)
3. Try sending messages like "book appointment" or "services"
4. Click the voice button (blue speaker icon)
5. Allow microphone access when prompted
6. Speak your question after the greeting
7. Wait for the response
8. The agent will automatically start listening again

## Troubleshooting

### Voice Agent Not Working
- Check microphone permissions in browser settings
- Ensure HTTPS is enabled (required for microphone access)
- Test in Chrome/Edge first (best compatibility)

### No Response from Agents
- Check browser console for errors
- Verify Cloudflare endpoints are configured
- Check CORS headers on your Cloudflare Worker

### Mobile Issues
- Ensure website is served over HTTPS
- Check mobile browser permissions for microphone
- Test on latest browser versions

## Security Notes

- Microphone access requires user permission
- All audio processing happens in the browser
- Only text is sent to Cloudflare endpoints
- No audio data is transmitted or stored

## Performance Tips

- Voice responses should be concise (under 150 words)
- Add timeout handling for slow API responses
- Consider caching common responses
- Implement rate limiting on Cloudflare side
