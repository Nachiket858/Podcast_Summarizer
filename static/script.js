// Format summary text properly
function formatSummary(rawText) {
    // Remove any existing HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawText;
    const textContent = tempDiv.textContent || tempDiv.innerText || rawText;

    const lines = textContent.split('\n');
    let bullets = [];
    let processingInfo = '';

    for (let line of lines) {
        line = line.trim();

        // Skip separators
        if (line === '---') continue;

        // Collect processing info
        if (line.startsWith('Processed') && line.includes('chunks')) {
            processingInfo = line;
            continue;
        }

        // Skip header lines
        if (line.toLowerCase().includes('here is a summary') ||
            line.toLowerCase().includes('bullet points:')) {
            continue;
        }

        // Extract bullet points
        if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
            bullets.push(line.substring(1).trim());
        } else if (line && bullets.length === 0) {
            // Regular text before bullets
            bullets.push(line);
        }
    }

    // Build formatted HTML
    let formatted = '<ul>';
    bullets.forEach(bullet => {
        if (bullet) {
            formatted += `<li>${bullet}</li>`;
        }
    });
    formatted += '</ul>';

    if (processingInfo) {
        formatted += `<div class="processing-info">ℹ️ ${processingInfo}</div>`;
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
                submitButton.textContent = '⏳ Processing...';
            }
        });
    }
});
