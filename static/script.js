// ==================== Format Summary ====================
function formatSummary(rawText) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawText;
    const textContent = tempDiv.textContent || tempDiv.innerText || rawText;

    let formatted = '';

    // Check for markdown headers
    const hasHeaders = textContent.includes('### Summary') ||
        textContent.includes('### Key Takeaways');

    if (hasHeaders) {
        const sections = textContent.split('###');

        sections.forEach(section => {
            section = section.trim();
            if (!section) return;

            // Summary section
            if (section.startsWith('Summary')) {
                const content = section.replace('Summary', '').trim();
                formatted += `<div class="summary-block"><h4>Summary</h4><p>${content}</p></div>`;
            }
            // Key Takeaways
            else if (section.startsWith('Key Takeaways')) {
                const content = section.replace('Key Takeaways', '').trim();
                const lines = content.split('\n');
                let bullets = '';
                lines.forEach(line => {
                    line = line.trim();
                    if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
                        bullets += `<li>${line.substring(1).trim()}</li>`;
                    } else if (line) {
                        bullets += `<li>${line}</li>`;
                    }
                });
                formatted += `<div class="takeaways-block"><h4>Key Takeaways</h4><ul>${bullets}</ul></div>`;
            } else {
                formatted += `<div class="generic-block"><p>${section}</p></div>`;
            }
        });
    } else {
        // Fallback formatting
        const lines = textContent.split('\n');
        let bullets = [];

        for (let line of lines) {
            line = line.trim();
            if (line === '---') continue;
            if (line.startsWith('Processed') && line.includes('chunks')) continue;
            if (line.toLowerCase().includes('here is a summary') || line.toLowerCase().includes('bullet points:')) continue;
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
    }

    return formatted;
}

// ==================== Copy to Clipboard ====================
function copyToClipboard(section) {
    let textToCopy = '';

    if (section === 'summary') {
        const element = document.getElementById('summary-content');
        if (element) {
            textToCopy = element.innerText || element.textContent;
        }
    } else if (section === 'takeaways') {
        const element = document.getElementById('summary-content');
        if (element) {
            // Extract only the takeaways block
            const takeawaysBlock = element.querySelector('.takeaways-block');
            if (takeawaysBlock) {
                textToCopy = takeawaysBlock.innerText || takeawaysBlock.textContent;
            } else {
                // Fallback: copy all list items
                const listItems = element.querySelectorAll('li');
                if (listItems.length > 0) {
                    textToCopy = Array.from(listItems).map(li => '• ' + li.textContent).join('\n');
                }
            }
        }
    }

    if (!textToCopy) {
        showToast('No content to copy');
        return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Copied Successfully');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Copy failed, please try again');
    });
}

// ==================== Show Toast Notification ====================
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ==================== Print Summary ====================
function printSummary() {
    window.print();
}

// ==================== Initialize on Page Load ====================
document.addEventListener('DOMContentLoaded', function () {
    // Handle existing summary - render immediately (no typewriter effect)
    const summaryElement = document.getElementById('summary-content');
    if (summaryElement && summaryElement.dataset.rawSummary) {
        const rawSummary = summaryElement.dataset.rawSummary;
        const formattedSummary = formatSummary(rawSummary);
        summaryElement.innerHTML = formattedSummary;
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

        function addMessage(text, sender = "user") {
            const chatWindow = document.getElementById("chat-window");

            const msgDiv = document.createElement("div");
            msgDiv.className = `chat-message ${sender}`;

            const bubble = document.createElement("div");
            bubble.className = "bubble";
            bubble.textContent = text;

            msgDiv.appendChild(bubble);
            chatWindow.appendChild(msgDiv);

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
            loadingDiv.innerHTML = '<div class="bubble">Thinking...</div>';
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
