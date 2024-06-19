import { styles, CLOSE_ICON, MESSAGE_ICON, SEND_ICON, SEND_MESSAGE_ICON } from "./assets.js";

class MessageWidget {
  constructor(position = "bottom-right") {
    this.position = this.getPosition(position);
    this.open = false;
    this.widgetContainer = null;
    this.initialize();
    this.injectStyles();
  }

  position = "";
  open = false;
  widgetContainer = null;

  getPosition(position) {
    const [vertical, horizontal] = position.split("-");
    return {
      [vertical]: "30px",
      [horizontal]: "30px",
    };
  }

  async initialize() {
    const container = document.createElement("div");
    container.style.position = "fixed";
    Object.keys(this.position).forEach(
      (key) => (container.style[key] = this.position[key])
    );
    document.body.appendChild(container);

    const buttonContainer = document.createElement("button");
    buttonContainer.classList.add("button__container");

    const widgetIconElement = document.createElement("span");
    widgetIconElement.innerHTML = SEND_ICON;
    widgetIconElement.classList.add("widget__icon");
    this.widgetIcon = widgetIconElement;

    const closeIconElement = document.createElement("span");
    closeIconElement.innerHTML = CLOSE_ICON;
    closeIconElement.classList.add("widget__icon", "widget__hidden");
    this.closeIcon = closeIconElement;

    buttonContainer.appendChild(this.widgetIcon);
    buttonContainer.appendChild(this.closeIcon);
    buttonContainer.addEventListener("click", this.toggleOpen.bind(this));

    this.widgetContainer = document.createElement("div");
    this.widgetContainer.classList.add("widget__hidden", "widget__container");

    this.createWidgetContent();

    container.appendChild(this.widgetContainer);
    container.appendChild(buttonContainer);
  }

  createWidgetContent() {
    this.widgetContainer.innerHTML = `
      <header class="widget__header">
        <h3>Chat with us</h3>
        <p>We usually respond within a few minutes</p>
      </header>
      <div class="chat__messages" id="chatMessages"></div>
      <form id="chatForm">
        <div class="form__field">
          <input
            id="chatInput"
            name="message"
            placeholder="Type your message..."
          ></input>
        </div>
        <button type="submit">Send</button>
      </form>
    `;
  
    const chatForm = this.widgetContainer.querySelector('#chatForm');
    chatForm.addEventListener('submit', this.handleSendMessage.bind(this));

    const chatInput = this.widgetContainer.querySelector('#chatInput');
    chatInput.addEventListener('keypress', this.handleKeyPress.bind(this));
  
    const sendMessageIcon = this.widgetContainer.querySelector('#sendMessageIcon');
    sendMessageIcon.addEventListener('click', this.handleSendMessage.bind(this));
  
    this.loadMessages();
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSendMessage(event);
    }
  }

  async handleSendMessage(event) {
    event.preventDefault();
    const chatInput = this.widgetContainer.querySelector('#chatInput');
    const message = chatInput.value.trim();
    if (message) {
      this.addMessageToChat('user', message);
      chatInput.value = '';
      const response = await this.sendMessageToLLM(message);
      this.addMessageToChat('bot', response);
    }
  }

  async sendMessageToLLM(message) {
    const apiKey = import.meta.env.local.VITE_OPENAI_KEY;
  
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return 'Sorry, there was an error processing your request.';
    }
  
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
          temperature: 0.7,
          max_tokens: 150
        })
      });
  
      if (!response.ok) {
        console.error('Error sending message to LLM:', response.status, response.statusText);
        return 'Sorry, there was an error processing your request.';
      }
  
      const data = await response.json();
      return data.choices[0].message.content || 'Sorry, I could not understand your query.';
    } catch (error) {
      console.error('Error sending message to LLM:', error);
      return 'Sorry, there was an error processing your request.';
    }
  }

  addMessageToChat(sender, message) {
    const chatMessages = this.widgetContainer.querySelector('#chatMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat__message', `chat__message--${sender}`);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom

    this.saveMessage(sender, message);
  }

  saveMessage(sender, message) {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    messages.push({ sender, message });
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }

  loadMessages() {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    messages.forEach(({ sender, message }) => {
      this.addMessageToChat(sender, message);
    });
  }

  injectStyles() {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = styles.replace(/^\s+|\n/gm, "");
    document.head.appendChild(styleTag);
  }

  toggleOpen() {
    this.open = !this.open;
    if (this.open) {
      this.widgetIcon.classList.add("widget__hidden");
      this.closeIcon.classList.remove("widget__hidden");
      this.widgetContainer.classList.remove("widget__hidden");
    } else {
      this.widgetIcon.classList.remove("widget__hidden");
      this.closeIcon.classList.add("widget__hidden");
      this.widgetContainer.classList.add("widget__hidden");
    }
  }
}

function initializeWidget() {
  return new MessageWidget();
}

initializeWidget();