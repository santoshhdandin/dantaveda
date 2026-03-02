class WebChatAgent {
    constructor() {
        this.widget = document.getElementById('chatWidget');
        this.messages = document.getElementById('chatMessages');
        this.input = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('chatSend');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.cloudflareEndpoint = '';

        this.init();
    }

    init() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        this.addMessage('bot', 'Hello! How can I help you with your dental care today?');
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.input.value = '';

        this.showTyping();

        try {
            const response = await this.callCloudflareAgent(message);
            this.hideTyping();
            this.addMessage('bot', response);
        } catch (error) {
            this.hideTyping();
            this.addMessage('bot', 'I apologize, but I\'m having trouble connecting right now. Please try again or call us directly.');
            console.error('Chat agent error:', error);
        }
    }

    async callCloudflareAgent(message) {
        if (!this.cloudflareEndpoint) {
            return this.getDemoResponse(message);
        }

        const response = await fetch(this.cloudflareEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        return data.response || data.message || 'I received your message. How else can I help you?';
    }

    getDemoResponse(message) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = {
                    'appointment': 'I can help you book an appointment! Our available slots are Monday to Saturday, 9 AM to 9 PM. Would you like me to check availability for a specific date?',
                    'services': 'We offer comprehensive dental services including general dentistry, cosmetic procedures, root canal treatments, implants, orthodontics, and pediatric care. Which service interests you?',
                    'location': 'We\'re located in Haveri, Karnataka. Would you like directions or our exact address?',
                    'emergency': 'For dental emergencies, please call us immediately at +1 908 538 6155. We prioritize emergency cases.',
                    'default': 'Thank you for your message! Dr. Vinaya and our team are here to help. Could you please provide more details about how we can assist you?'
                };

                const lowerMessage = message.toLowerCase();
                if (lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
                    resolve(responses.appointment);
                } else if (lowerMessage.includes('service') || lowerMessage.includes('treatment')) {
                    resolve(responses.services);
                } else if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
                    resolve(responses.location);
                } else if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
                    resolve(responses.emergency);
                } else {
                    resolve(responses.default);
                }
            }, 1000);
        });
    }

    addMessage(type, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.textContent = text;
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    showTyping() {
        this.typingIndicator.classList.add('active');
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    hideTyping() {
        this.typingIndicator.classList.remove('active');
    }

    setCloudflareEndpoint(endpoint) {
        this.cloudflareEndpoint = endpoint;
    }
}

class VoiceAgent {
    constructor() {
        this.widget = document.getElementById('voiceWidget');
        this.timer = document.getElementById('voiceTimer');
        this.statusText = document.getElementById('voiceState');
        this.indicator = document.getElementById('voiceIndicator');
        this.muteBtn = document.getElementById('voiceMute');
        this.endBtn = document.getElementById('voiceEnd');

        this.isActive = false;
        this.isMuted = false;
        this.startTime = null;
        this.timerInterval = null;
        this.cloudflareEndpoint = '';

        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.audioContext = null;
        this.mediaStream = null;

        this.conversationState = 'idle';

        this.init();
    }

    init() {
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.endBtn.addEventListener('click', () => this.endCall());

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => this.handleSpeechResult(event);
            this.recognition.onerror = (event) => this.handleSpeechError(event);
            this.recognition.onend = () => this.handleSpeechEnd();
        }
    }

    async startCall() {
        if (this.isActive) return;

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.isActive = true;
            this.startTime = Date.now();
            this.updateTimer();
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);

            this.statusText.textContent = 'Listening...';
            this.indicator.classList.add('active');

            this.speak('Hello! I\'m the virtual assistant for Dantaveda Smiles Studio. How can I help you today?', () => {
                this.startListening();
            });

        } catch (error) {
            console.error('Error starting call:', error);
            alert('Unable to access microphone. Please check your permissions.');
            this.endCall();
        }
    }

    startListening() {
        if (!this.recognition || !this.isActive || this.isMuted) return;

        this.conversationState = 'listening';
        this.statusText.textContent = 'Listening...';
        this.indicator.classList.add('active');

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    }

    handleSpeechResult(event) {
        const transcript = event.results[0][0].transcript;
        console.log('User said:', transcript);

        this.conversationState = 'processing';
        this.statusText.textContent = 'Processing...';
        this.indicator.classList.remove('active');

        this.processUserInput(transcript);
    }

    handleSpeechError(event) {
        console.error('Speech recognition error:', event.error);

        if (this.isActive && !this.isMuted) {
            if (event.error === 'no-speech') {
                this.speak('I didn\'t catch that. Could you please repeat?', () => {
                    this.startListening();
                });
            } else {
                setTimeout(() => this.startListening(), 1000);
            }
        }
    }

    handleSpeechEnd() {
        if (this.conversationState === 'listening' && this.isActive && !this.isMuted) {
            setTimeout(() => this.startListening(), 500);
        }
    }

    async processUserInput(userInput) {
        try {
            const response = await this.callCloudflareAgent(userInput);

            this.conversationState = 'speaking';
            this.statusText.textContent = 'Speaking...';

            this.speak(response, () => {
                if (this.isActive) {
                    this.startListening();
                }
            });

        } catch (error) {
            console.error('Error processing input:', error);
            this.speak('I\'m having trouble processing that. Could you please try again?', () => {
                if (this.isActive) {
                    this.startListening();
                }
            });
        }
    }

    async callCloudflareAgent(message) {
        if (!this.cloudflareEndpoint) {
            return this.getDemoResponse(message);
        }

        const response = await fetch(this.cloudflareEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, type: 'voice' })
        });

        const data = await response.json();
        return data.response || data.message || 'I received your message. How else can I help you?';
    }

    getDemoResponse(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
            return 'I can help you book an appointment. Our clinic is open Monday to Saturday from 10 AM to 8 PM. What day works best for you?';
        } else if (lowerMessage.includes('service') || lowerMessage.includes('treatment')) {
            return 'We offer general dentistry, cosmetic procedures, root canal treatments, dental implants, orthodontics, and pediatric care. Which service are you interested in?';
        } else if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
            return 'We are located in Haveri, Karnataka. Would you like me to provide directions or our contact number?';
        } else if (lowerMessage.includes('cost') || lowerMessage.includes('price')) {
            return 'Our treatment costs vary depending on the procedure. I recommend booking a consultation with Doctor Vinaya for a detailed assessment and pricing. Would you like to schedule one?';
        } else if (lowerMessage.includes('emergency')) {
            return 'For dental emergencies, please call us immediately at plus nine one, nine nine nine nine nine, nine nine nine nine nine. We prioritize emergency cases.';
        } else {
            return 'Thank you for that information. Doctor Vinaya and our team are here to help you with all your dental needs. Is there anything specific you would like to know?';
        }
    }

    speak(text, onEnd) {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
            if (onEnd) onEnd();
        };

        this.synthesis.speak(utterance);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.muteBtn.classList.toggle('active', this.isMuted);

        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                track.enabled = !this.isMuted;
            });
        }

        if (this.isMuted) {
            this.statusText.textContent = 'Muted';
            this.indicator.classList.remove('active');
            if (this.recognition) {
                try {
                    this.recognition.stop();
                } catch (e) {}
            }
            if (this.synthesis.speaking) {
                this.synthesis.cancel();
            }
        } else {
            this.startListening();
        }
    }

    endCall() {
        this.isActive = false;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }

        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        this.statusText.textContent = 'Call ended';
        this.indicator.classList.remove('active');
        this.timer.textContent = '00:00';

        document.getElementById('voiceBtn').click();
    }

    updateTimer() {
        if (!this.startTime) return;

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        this.timer.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    setCloudflareEndpoint(endpoint) {
        this.cloudflareEndpoint = endpoint;
    }
}

let chatAgent;
let voiceAgent;

document.addEventListener('DOMContentLoaded', () => {
    const chatBtn = document.getElementById('chatBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const chatWidget = document.getElementById('chatWidget');
    const voiceWidget = document.getElementById('voiceWidget');
    const chatClose = document.getElementById('chatClose');

    chatAgent = new WebChatAgent();
    voiceAgent = new VoiceAgent();

    chatBtn.addEventListener('click', () => {
        const isActive = chatWidget.classList.toggle('active');
        if (isActive) {
            voiceWidget.classList.remove('active');
            document.getElementById('chatInput').focus();
        }
    });

    voiceBtn.addEventListener('click', () => {
        const isActive = voiceWidget.classList.toggle('active');
        if (isActive) {
            chatWidget.classList.remove('active');
            voiceAgent.startCall();
        } else {
            voiceAgent.endCall();
        }
    });

    chatClose.addEventListener('click', () => {
        chatWidget.classList.remove('active');
    });
});

window.setAgentEndpoints = function(chatEndpoint, voiceEndpoint) {
    if (chatAgent && chatEndpoint) {
        chatAgent.setCloudflareEndpoint(chatEndpoint);
    }
    if (voiceAgent && voiceEndpoint) {
        voiceAgent.setCloudflareEndpoint(voiceEndpoint);
    }
    console.log('Agent endpoints configured');
};

window.setAgentEndpoints(
  'https://dantaveda-chatbot.santoshhdandin.workers.dev',  // Chat endpoint
  'https://dantaveda-voiceassistant.santoshhdandin.workers.dev'  // Voice endpoint
);