// ==================== Format Summary ====================
function formatSummary(rawText) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawText;
    const textContent = tempDiv.textContent || tempDiv.innerText || rawText;

    // Clean markdown artifacts
    let cleanedText = textContent
        .replace(/\*{1,3}/g, '')           // Remove **, ***, *
        .replace(/#{1,6}\s*/g, '')          // Remove # headers inline
        .replace(/`+/g, '')                 // Remove backticks
        .replace(/\n{3,}/g, '\n\n');        // Collapse excessive newlines

    let formatted = '';

    // Check for section headers (with or without ### prefix)
    const hasSummaryHeader = /(?:^|\n)\s*(?:###?\s*)?(?:Summary|सारांश)/im.test(cleanedText);
    const hasTakeawaysHeader = /(?:^|\n)\s*(?:###?\s*)?(?:Key Takeaways|मुख्य बिंदु|मुख्य मुद्दे)/im.test(cleanedText);

    if (hasSummaryHeader || hasTakeawaysHeader) {
        const parts = cleanedText.split(/(?:^|\n)\s*(?:###?\s*)?(?=Summary|Key Takeaways|सारांश|मुख्य बिंदु|मुख्य मुद्दे)/im);

        parts.forEach(section => {
            section = section.trim();
            if (!section) return;

            if (/^(?:Summary|सारांश)/i.test(section)) {
                const content = section.replace(/^(?:Summary|सारांश)\s*/i, '').trim();
                if (content) {
                    formatted += `<div class="summary-block"><h4>Summary</h4><p>${content}</p></div>`;
                }
            }
            else if (/^(?:Key Takeaways|मुख्य बिंदु|मुख्य मुद्दे)/i.test(section)) {
                const content = section.replace(/^(?:Key Takeaways|मुख्य बिंदु|मुख्य मुद्दे)\s*/i, '').trim();
                const lines = content.split('\n');
                let bullets = '';
                lines.forEach(line => {
                    line = line.trim();
                    if (line.match(/^[-\*•\d.]+\s*/)) {
                        line = line.replace(/^[-\*•]+\s*/, '').replace(/^\d+[.)]\s*/, '').trim();
                    }
                    if (line && line.length > 3) {
                        bullets += `<li>${line}</li>`;
                    }
                });
                if (bullets) {
                    formatted += `<div class="takeaways-block"><h4>Key Takeaways</h4><ul>${bullets}</ul></div>`;
                }
            } else if (section.length > 10) {
                formatted += `<div class="generic-block"><p>${section}</p></div>`;
            }
        });
    }

    // Fallback formatting
    if (!formatted) {
        const lines = cleanedText.split('\n');
        let bullets = [];
        let paragraphs = [];

        for (let line of lines) {
            line = line.trim();
            if (line === '---') continue;
            if (line.startsWith('Processed') && line.includes('chunks')) continue;
            if (line.toLowerCase().includes('here is a summary') || line.toLowerCase().includes('bullet points:')) continue;
            if (line.match(/^[-\*•]/)) {
                bullets.push(line.replace(/^[-\*•]+\s*/, '').trim());
            } else if (line.match(/^\d+[.)]\s/)) {
                bullets.push(line.replace(/^\d+[.)]\s*/, '').trim());
            } else if (line && line.length > 5) {
                if (bullets.length === 0) {
                    paragraphs.push(line);
                } else {
                    bullets.push(line);
                }
            }
        }

        if (paragraphs.length > 0) {
            formatted += `<div class="summary-block"><p>${paragraphs.join(' ')}</p></div>`;
        }
        if (bullets.length > 0) {
            formatted += '<div class="takeaways-block"><ul>';
            bullets.forEach(bullet => {
                if (bullet) formatted += `<li>${bullet}</li>`;
            });
            formatted += '</ul></div>';
        }
    }

    return formatted || `<p>${cleanedText}</p>`;
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
            const takeawaysBlock = element.querySelector('.takeaways-block');
            if (takeawaysBlock) {
                textToCopy = takeawaysBlock.innerText || takeawaysBlock.textContent;
            } else {
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
    setTimeout(() => { toast.remove(); }, 3000);
}

// ==================== Print Summary ====================
function printSummary() {
    window.print();
}

// ==================== Text-to-Speech ====================
let ttsUtterance = null;
let ttsIsPaused = false;
let ttsIsPlaying = false;

function getVoiceForLanguage(langCode) {
    const voices = window.speechSynthesis.getVoices();
    const langMap = { 'en': 'en', 'hi': 'hi', 'mr': 'mr' };
    const targetLang = langMap[langCode] || 'en';
    let voice = voices.find(v => v.lang.startsWith(targetLang));
    if (!voice && langCode === 'mr') {
        voice = voices.find(v => v.lang.startsWith('hi'));
    }
    return voice || voices.find(v => v.default) || voices[0];
}

function toggleSpeech() {
    if (ttsIsPlaying) { stopSpeech(); return; }
    const summaryEl = document.getElementById('summary-content');
    if (!summaryEl) return;
    const text = summaryEl.innerText || summaryEl.textContent;
    if (!text || text.trim().length === 0) { showToast('No content to speak'); return; }
    const langCode = summaryEl.dataset.language || 'en';
    window.speechSynthesis.cancel();
    ttsUtterance = new SpeechSynthesisUtterance(text.trim());
    const voice = getVoiceForLanguage(langCode);
    if (voice) ttsUtterance.voice = voice;
    ttsUtterance.rate = 0.95;
    ttsUtterance.pitch = 1;
    ttsUtterance.onstart = () => {
        ttsIsPlaying = true;
        ttsIsPaused = false;
        document.getElementById('tts-controls').style.display = 'flex';
        document.getElementById('tts-btn-text').textContent = '🔊 Playing...';
        document.getElementById('tts-pause-btn').style.display = '';
        document.getElementById('tts-resume-btn').style.display = 'none';
    };
    ttsUtterance.onend = () => { resetTtsUI(); };
    ttsUtterance.onerror = () => { resetTtsUI(); };
    window.speechSynthesis.speak(ttsUtterance);
}

function pauseSpeech() {
    if (ttsIsPlaying && !ttsIsPaused) {
        window.speechSynthesis.pause();
        ttsIsPaused = true;
        document.getElementById('tts-pause-btn').style.display = 'none';
        document.getElementById('tts-resume-btn').style.display = '';
        document.getElementById('tts-btn-text').textContent = '⏸ Paused';
    }
}

function resumeSpeech() {
    if (ttsIsPaused) {
        window.speechSynthesis.resume();
        ttsIsPaused = false;
        document.getElementById('tts-pause-btn').style.display = '';
        document.getElementById('tts-resume-btn').style.display = 'none';
        document.getElementById('tts-btn-text').textContent = '🔊 Playing...';
    }
}

function stopSpeech() { window.speechSynthesis.cancel(); resetTtsUI(); }

function resetTtsUI() {
    ttsIsPlaying = false;
    ttsIsPaused = false;
    const controls = document.getElementById('tts-controls');
    const btnText = document.getElementById('tts-btn-text');
    if (controls) controls.style.display = 'none';
    if (btnText) btnText.textContent = 'Speak';
}

// ==================== Comments ====================
function loadComments(videoId) {
    const commentsList = document.getElementById('comments-list');
    const loadingEl = document.getElementById('comments-loading');
    if (!commentsList) return;

    fetch(`/comments/${videoId}`)
        .then(res => res.json())
        .then(data => {
            if (loadingEl) loadingEl.remove();
            if (!data.comments || data.comments.length === 0) {
                commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to share your thoughts!</div>';
                return;
            }
            commentsList.innerHTML = '';
            data.comments.forEach(c => {
                commentsList.appendChild(createCommentElement(c));
            });
        })
        .catch(err => {
            console.error('Error loading comments:', err);
            if (loadingEl) loadingEl.textContent = 'Failed to load comments.';
        });
}

function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML = `
        <div class="comment-header">
            <div class="comment-avatar">${(comment.username || 'U')[0].toUpperCase()}</div>
            <div class="comment-meta">
                <span class="comment-username">${comment.username}</span>
                <span class="comment-time">${comment.created_at}</span>
            </div>
        </div>
        <div class="comment-body">${escapeHtml(comment.comment_text)}</div>
    `;
    return div;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function submitComment(videoId) {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text) return;

    const btn = document.getElementById('submit-comment-btn');
    btn.disabled = true;
    input.disabled = true;

    fetch('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, comment_text: text })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                input.value = '';
                const commentsList = document.getElementById('comments-list');
                const noComments = commentsList.querySelector('.no-comments');
                if (noComments) noComments.remove();
                const newEl = createCommentElement(data.comment);
                commentsList.prepend(newEl);
                showToast('Comment added!');
            } else {
                showToast(data.error || 'Failed to add comment');
            }
        })
        .catch(err => {
            console.error('Comment error:', err);
            showToast('Error submitting comment');
        })
        .finally(() => {
            btn.disabled = false;
            input.disabled = false;
            input.focus();
        });
}

// ==================== Sidebar Toggle ====================
function initSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    });

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// ==================== Scroll Animations ====================
function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
}

// ==================== Initialize on Page Load ====================
document.addEventListener('DOMContentLoaded', function () {
    // Sidebar toggle
    initSidebar();

    // Scroll animations
    initScrollAnimations();

    // Handle existing summary - render immediately
    const summaryElement = document.getElementById('summary-content');
    if (summaryElement && summaryElement.dataset.rawSummary) {
        const rawSummary = summaryElement.dataset.rawSummary;
        const formattedSummary = formatSummary(rawSummary);
        summaryElement.innerHTML = formattedSummary;
    }

    // Load voices for TTS
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    // Form submission handler - show loading state
    const form = document.getElementById('analysis-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            const submitButton = document.getElementById('analyze-btn');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    Processing... (This may take a few minutes)
                `;
            }
        });
    }

    // Comments initialization
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
        const videoId = commentsSection.dataset.videoId;
        loadComments(videoId);

        const submitBtn = document.getElementById('submit-comment-btn');
        const commentInput = document.getElementById('comment-input');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => submitComment(videoId));
        }
        if (commentInput) {
            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitComment(videoId);
            });
        }
    }

    // Chat Functionality (works on both results page inline and dedicated chat page)
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat-btn');
    const chatWindow = document.getElementById('chat-window');

    // Get video ID from chat container or chat section
    const chatContainer = document.querySelector('.chat-container') || document.querySelector('.chat-section');

    if (chatInput && sendBtn && chatContainer) {
        const videoId = chatContainer.dataset.videoId;

        function addMessage(text, sender = "user") {
            const msgDiv = document.createElement("div");
            msgDiv.className = `chat-message ${sender}`;

            if (sender === 'bot') {
                const avatar = document.createElement('div');
                avatar.className = 'chat-msg-avatar bot-avatar';
                avatar.textContent = 'AI';
                msgDiv.appendChild(avatar);
            }

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

            const loadingDiv = document.createElement('div');
            loadingDiv.classList.add('chat-message', 'bot', 'loading-msg');

            const loadAvatar = document.createElement('div');
            loadAvatar.className = 'chat-msg-avatar bot-avatar';
            loadAvatar.textContent = 'AI';
            loadingDiv.appendChild(loadAvatar);

            const loadBubble = document.createElement('div');
            loadBubble.className = 'bubble';
            loadBubble.textContent = 'Thinking...';
            loadingDiv.appendChild(loadBubble);

            chatWindow.appendChild(loadingDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: message, video_id: videoId })
                });
                const data = await response.json();
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

// Spinner animation (used in loading button)
const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);
