// Format summary text properly
// Format summary text properly
function formatSummary(rawText) {
    // Remove any existing HTML tags to be safe (though usually we trust our own backend)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawText;
    const textContent = tempDiv.textContent || tempDiv.innerText || rawText;

    let formatted = '';

    // Check for our specific markdown headers
    if (textContent.includes('### Summary') || textContent.includes('### Key Takeaways')) {
        const sections = textContent.split('###');

        sections.forEach(section => {
            section = section.trim();
            if (!section) return;

            if (section.startsWith('Summary')) {
                const content = section.replace('Summary', '').trim();
                formatted += `<div class="summary-block"><h4>Summary</h4><p>${content}</p></div>`;
            } else if (section.startsWith('Key Takeaways')) {
                const content = section.replace('Key Takeaways', '').trim();
                const lines = content.split('\n');
                let bullets = '';
                lines.forEach(line => {
                    line = line.trim();
                    if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
                        bullets += `<li>${line.substring(1).trim()}</li>`;
                    } else if (line) {
                        // Some models might not use bullets strictly
                        bullets += `<li>${line}</li>`;
                    }
                });
                formatted += `<div class="takeaways-block"><h4>Key Takeaways</h4><ul>${bullets}</ul></div>`;
            } else {
                // Fallback for other sections
                formatted += `<div class="generic-block"><p>${section}</p></div>`;
            }
        });

    } else {
        // Legacy/Fallback formatting logic
        const lines = textContent.split('\n');
        let bullets = [];
        let processingInfo = '';

        for (let line of lines) {
            line = line.trim();
            if (line === '---') continue;
            if (line.startsWith('Processed') && line.includes('chunks')) {
                processingInfo = line;
                continue;
            }
            if (line.toLowerCase().includes('here is a summary') || line.toLowerCase().includes('bullet points:')) {
                continue;
            }
            if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
                bullets.push(line.substring(1).trim());
            } else if (line && bullets.length === 0) {
                bullets.push(line);
            }
        }

        formatted = '<ul>';
        bullets.forEach(bullet => {
            if (bullet) formatted += `<li>${bullet}</li>`;
        });
        formatted += '</ul>';

        if (processingInfo) {
            formatted += `<div class="processing-info">ℹ️ ${processingInfo}</div>`;
        }
    }

    return formatted;
}

// Typewriter effect
function typewriterEffect(element, html, speed = 3) {
    element.innerHTML = '';
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    let index = 0;
    const fullText = tempDiv.innerHTML;

    function type() {
        if (index < fullText.length) {
            element.innerHTML = fullText.substring(0, index + 1);
            index++;
            setTimeout(type, speed);
        }
    }

    type();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Handle existing summary with typewriter effect
    const summaryElement = document.getElementById('summary-content');
    if (summaryElement && summaryElement.dataset.rawSummary) {
        const rawSummary = summaryElement.dataset.rawSummary;
        const formattedSummary = formatSummary(rawSummary);
        typewriterEffect(summaryElement, formattedSummary, 3);
    }


    // Form submission handler - show loading state
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function (e) {
            const submitButton = document.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = '⏳ Processing... (This may take a few minutes for new videos)';
            }
        });
    }

    // Chat Functionality
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat-btn');
    const chatWindow = document.getElementById('chat-window');
    const chatSection = document.querySelector('.chat-section');

    if (chatInput && sendBtn && chatSection) {
        const videoId = chatSection.dataset.videoId;

        function addMessage(text, sender) {
            const div = document.createElement('div');
            div.classList.add('chat-message', sender);
            div.innerHTML = `<p>${text}</p>`;
            chatWindow.appendChild(div);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        async function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;

            addMessage(message, 'user');
            chatInput.value = '';
            chatInput.disabled = true;
            sendBtn.disabled = true;

            // Add loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.classList.add('chat-message', 'bot', 'loading-msg');
            loadingDiv.innerHTML = '<p>Thinking...</p>';
            chatWindow.appendChild(loadingDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        video_id: videoId
                    })
                });

                const data = await response.json();

                // Remove loading
                chatWindow.removeChild(loadingDiv);

                if (data.response) {
                    addMessage(data.response, 'bot');
                } else {
                    addMessage("Sorry, something went wrong.", 'bot');
                }

            } catch (error) {
                chatWindow.removeChild(loadingDiv);
                addMessage("Error connecting to server.", 'bot');
                console.error(error);
            } finally {
                chatInput.disabled = false;
                sendBtn.disabled = false;
                chatInput.focus();
            }
        }

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
});
