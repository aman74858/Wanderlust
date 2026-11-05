/**
 * Wanderlust AI Chat Board Agent Client Script
 */
(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const launcherBtn = document.getElementById('chatLauncherBtn');
    const boardWindow = document.getElementById('chatBoardWindow');
    const closeBtn = document.getElementById('chatCloseBtn');
    const clearBtn = document.getElementById('chatClearBtn');
    const messagesArea = document.getElementById('chatMessagesArea');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const typingIndicator = document.getElementById('chatTypingIndicator');

    if (!launcherBtn || !boardWindow || !chatForm || !chatInput || !messagesArea) {
      return;
    }

    const STORAGE_KEY = 'wanderlust_chat_history_v1';
    let conversationHistory = [];

    // Format Markdown helpers (bold, italic, links, lists)
    const formatMessageText = (text) => {
      if (!text) return '';
      let formatted = text
        // Escape basic HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic *text*
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Inline code `code`
        .replace(/`([^`]+)`/g, '<code class="bg-light px-1 rounded text-danger">$1</code>')
        // Links [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-decoration-underline text-danger fw-semibold">$1</a>')
        // Bullet points
        .replace(/^[•\-\*]\s+(.*)$/gm, '<li class="ms-3">$1</li>')
        // Numbered lists
        .replace(/^\d+\.\s+(.*)$/gm, '<li class="ms-3">$1</li>')
        // Newlines to <br>
        .replace(/\n\n/g, '</p><p class="mb-2">')
        .replace(/\n/g, '<br/>');

      return `<p class="mb-1">${formatted}</p>`;
    };

    // Scroll to bottom of message list
    const scrollToBottom = () => {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    };

    // Toggle chat board open / closed
    const toggleChat = (forceOpen = null) => {
      const isOpen = boardWindow.classList.contains('active');
      const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;

      if (shouldOpen) {
        boardWindow.classList.add('active');
        boardWindow.setAttribute('aria-hidden', 'false');
        setTimeout(() => chatInput.focus(), 150);
        scrollToBottom();
      } else {
        boardWindow.classList.remove('active');
        boardWindow.setAttribute('aria-hidden', 'true');
      }
    };

    launcherBtn.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    // Input validation & send button state
    chatInput.addEventListener('input', () => {
      const hasText = chatInput.value.trim().length > 0;
      sendBtn.disabled = !hasText;
    });

    // Render a single message to DOM
    const renderMessage = (msg, persist = true) => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}`;

      let html = '';
      if (msg.role !== 'user') {
        html += `
          <div class="chat-msg-avatar">
            <i class="fa-solid fa-comments"></i>
          </div>
        `;
      }

      html += `<div class="chat-msg-content">`;
      html += `<div class="chat-bubble">${formatMessageText(msg.text)}</div>`;

      // Render attached listing cards if any
      if (msg.listings && Array.isArray(msg.listings) && msg.listings.length > 0) {
        html += `<div class="chat-listings-grid">`;
        msg.listings.forEach(listing => {
          const priceFormatted = Number(listing.price || 0).toLocaleString('en-IN');
          html += `
            <div class="chat-listing-card">
              <img src="${listing.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800'}" alt="${listing.title}" class="chat-listing-img" loading="lazy" />
              <div class="chat-listing-body">
                <h6 class="chat-listing-title" title="${listing.title}">${listing.title}</h6>
                <div class="chat-listing-loc">
                  <i class="fa-solid fa-location-dot text-danger"></i>
                  <span>${listing.location || 'Wanderlust'}</span>
                </div>
                <div class="chat-listing-footer">
                  <div class="chat-listing-price">
                    ₹${priceFormatted} <small>/ night</small>
                  </div>
                  <a href="${listing.url || `/listings/${listing.id}`}" class="chat-listing-btn">View Stay</a>
                </div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }

      // Render suggestions if any
      if (msg.suggestions && Array.isArray(msg.suggestions) && msg.suggestions.length > 0) {
        html += `<div class="chat-quick-suggestions mt-2">`;
        msg.suggestions.forEach(s => {
          html += `<span class="suggestion-chip" data-prompt="${s}">${s}</span>`;
        });
        html += `</div>`;
      }

      html += `</div>`;
      msgDiv.innerHTML = html;
      messagesArea.appendChild(msgDiv);
      scrollToBottom();

      if (persist) {
        conversationHistory.push(msg);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversationHistory));
        } catch (e) {
          // sessionStorage quota safe ignore
        }
      }
    };

    // Load saved conversation from session
    const loadSavedHistory = () => {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            conversationHistory = [];
            parsed.forEach(m => renderMessage(m, true));
          }
        }
      } catch (err) {
        console.warn('Failed to load chat history:', err);
      }
    };

    // Clear history
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear your conversation with Wanderlust AI?')) {
        conversationHistory = [];
        sessionStorage.removeItem(STORAGE_KEY);
        // Reset DOM to initial greeting
        messagesArea.innerHTML = `
          <div class="chat-msg chat-msg-bot">
            <div class="chat-msg-avatar">
              <i class="fa-solid fa-comments"></i>
            </div>
            <div class="chat-msg-content">
              <div class="chat-bubble">
                <p class="mb-2">
                  👋 <strong>Chat cleared!</strong> How can I help you explore Wanderlust today?
                </p>
                <div class="chat-intro-note">
                  <i class="fa-solid fa-lock text-secondary me-1"></i>
                  <small class="text-muted">Domain Limited: Answers restricted to Wanderlust platform.</small>
                </div>
              </div>
              <div class="chat-quick-suggestions mt-2">
                <span class="suggestion-chip" data-prompt="Find beachfront villas in Greece">🏖️ Beachfront in Greece</span>
                <span class="suggestion-chip" data-prompt="Show me stays under ₹3,000 / night">💰 Stays under ₹3,000</span>
                <span class="suggestion-chip" data-prompt="How do I book a stay and what are the fees?">📅 Booking & Fee guide</span>
                <span class="suggestion-chip" data-prompt="How do I list my property as a host?">🏡 How to host</span>
              </div>
            </div>
          </div>
        `;
        scrollToBottom();
      }
    });

    // Handle sending a message
    const sendMessage = async (rawText) => {
      const text = rawText.trim();
      if (!text) return;

      chatInput.value = '';
      sendBtn.disabled = true;

      // Render user's message
      renderMessage({ role: 'user', text }, true);

      // Show typing indicator
      typingIndicator.classList.remove('d-none');
      scrollToBottom();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: text,
            history: conversationHistory.slice(-6)
          })
        });

        const data = await res.json();
        typingIndicator.classList.add('d-none');

        if (data && data.success) {
          renderMessage({
            role: 'bot',
            text: data.reply,
            listings: data.listings || [],
            suggestions: data.suggestions || []
          }, true);
        } else {
          renderMessage({
            role: 'bot',
            text: data.error || "I'm sorry, something went wrong while getting an answer. Please try again!",
            suggestions: ["Find beach stays", "How do I book?"]
          }, true);
        }
      } catch (err) {
        typingIndicator.classList.add('d-none');
        console.error('Chat error:', err);
        renderMessage({
          role: 'bot',
          text: "Connection error: Unable to reach the Wanderlust travel assistant right now. Please check your connection and try again.",
          suggestions: ["Show stays under ₹3,000", "How do I host?"]
        }, true);
      }
    };

    // Form submit listener
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value;
      sendMessage(text);
    });

    // Event delegation for suggestion chips
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.suggestion-chip');
      if (chip && chip.dataset.prompt) {
        const prompt = chip.dataset.prompt;
        toggleChat(true);
        sendMessage(prompt);
      }
    });

    // Load any saved conversation
    loadSavedHistory();
  });
})();
