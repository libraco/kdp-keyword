document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const NUM_KEYWORD_BOXES = 7;
    const MAX_CHARS_PER_BOX = 50;

    // --- DOM Elements ---
    const inputKeywordsEl = document.getElementById('inputKeywords');
    const inputCharCountEl = document.getElementById('inputCharCount');
    const organizeBtn = document.getElementById('organizeBtn');
    const keywordBoxesContainer = document.getElementById('keywordBoxesContainer');
    const noticeArea = document.getElementById('noticeArea');
    const noticeList = document.getElementById('noticeList');

    // --- Helper Functions ---

    // Clean and prepare a single keyword/phrase
    function cleanKeyword(keyword) {
        // Remove leading/trailing whitespace
        let cleaned = keyword.trim();
        // Convert to lowercase
        cleaned = cleaned.toLowerCase();
        // Remove most punctuation, keep spaces and letters/numbers
        // Allows hyphens within words for phrases like "sci-fi"
        cleaned = cleaned.replace(/[^\p{L}\p{N}\s-]|(?<!\p{L}\p{N})-(?!\p{L}\p{N})/gu, '');
        // Replace multiple spaces/hyphens with a single space
        cleaned = cleaned.replace(/[\s-]+/g, ' ').trim();
        return cleaned;
    }

    // Get, clean, and deduplicate keywords from input
    function getAndProcessInputKeywords() {
        const rawInput = inputKeywordsEl.value;
        // Split by comma or newline, then clean and filter empty
        const keywords = rawInput
            .split(/,|\n/)
            .map(cleanKeyword)
            .filter(kw => kw.length > 0);

        // Deduplicate while preserving order
        const uniqueKeywords = [];
        const seenKeywords = new Set();
        const duplicates = [];

        for (const kw of keywords) {
            if (!seenKeywords.has(kw)) {
                uniqueKeywords.push(kw);
                seenKeywords.add(kw);
            } else {
                duplicates.push(kw);
            }
        }
        return { uniqueKeywords, duplicates };
    }

    // Count relevant characters (letters, numbers, spaces)
    function countRelevantChars(text) {
        const relevantChars = text.match(/[\p{L}\p{N}\s]/gu);
        return relevantChars ? relevantChars.length : 0;
    }

    // Update character count for the main input
    function updateInputCharCount() {
        const text = inputKeywordsEl.value;
        inputCharCountEl.textContent = countRelevantChars(text);
    }

    // Update character count for a specific keyword box
    function updateKeywordBoxCharCount(inputElement, countElement) {
        const currentLength = inputElement.value.length;
        const remaining = MAX_CHARS_PER_BOX - currentLength;
        countElement.textContent = `Characters left: ${remaining}`;
        // Optional: Add styling if over limit
        if (remaining < 0) {
            countElement.style.color = 'red';
            inputElement.style.borderColor = 'red';
        } else {
            countElement.style.color = '#6c757d'; // Reset color
             inputElement.style.borderColor = '#ced4da'; // Reset border
        }
    }

     // Copy text to clipboard
    function copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Copied!';
            setTimeout(() => {
                buttonElement.textContent = originalText;
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy text.');
        });
    }

    // --- Core Logic ---

    // Generate the HTML for the keyword boxes
    function generateKeywordBoxes() {
        keywordBoxesContainer.innerHTML = ''; // Clear existing boxes
        for (let i = 1; i <= NUM_KEYWORD_BOXES; i++) {
            const boxDiv = document.createElement('div');
            boxDiv.className = 'keyword-box';
            boxDiv.innerHTML = `
                <span class="keyword-box-label">KEYWORD BOX ${i}</span>
                <input type="text" id="keywordBoxInput${i}" placeholder="Box ${i}">
                <span class="char-counter" id="keywordBoxCounter${i}">Characters left: ${MAX_CHARS_PER_BOX}</span>
                <button class="copy-btn" id="copyBtn${i}">Copy</button>
            `;
            keywordBoxesContainer.appendChild(boxDiv);

            // Add event listeners for the new elements
            const boxInput = document.getElementById(`keywordBoxInput${i}`);
            const boxCounter = document.getElementById(`keywordBoxCounter${i}`);
            const copyBtn = document.getElementById(`copyBtn${i}`);

            boxInput.addEventListener('input', () => updateKeywordBoxCharCount(boxInput, boxCounter));
            copyBtn.addEventListener('click', () => copyToClipboard(boxInput.value, copyBtn));
        }
    }

    // Distribute keywords into boxes
    function organizeKeywords() {
        const { uniqueKeywords, duplicates } = getAndProcessInputKeywords();
        const keywordBoxes = Array.from({ length: NUM_KEYWORD_BOXES }, () => []);
        const boxLengths = Array.from({ length: NUM_KEYWORD_BOXES }, () => 0);
        const overflowKeywords = [];
        const notices = [];

        if (duplicates.length > 0) {
            notices.push(`Removed duplicate keywords: ${[...new Set(duplicates)].join(', ')}`);
        }

        // Try to fit keywords into boxes
        for (const keyword of uniqueKeywords) {
            let placed = false;
            for (let i = 0; i < NUM_KEYWORD_BOXES; i++) {
                const currentContent = keywordBoxes[i].join(' ');
                const currentLength = currentContent.length;
                const neededLength = (currentLength > 0 ? 1 : 0) + keyword.length; // Add 1 for space if not empty

                if (currentLength + neededLength <= MAX_CHARS_PER_BOX) {
                    keywordBoxes[i].push(keyword);
                    boxLengths[i] = currentLength + neededLength;
                    placed = true;
                    break; // Move to the next keyword
                }
            }
            if (!placed) {
                overflowKeywords.push(keyword);
            }
        }

        if (overflowKeywords.length > 0) {
            notices.push(`Keywords that did not fit: ${overflowKeywords.join(', ')}`);
        }

        // Update the UI
        for (let i = 1; i <= NUM_KEYWORD_BOXES; i++) {
            const boxInput = document.getElementById(`keywordBoxInput${i}`);
            const boxCounter = document.getElementById(`keywordBoxCounter${i}`);
            if (boxInput) {
                boxInput.value = keywordBoxes[i - 1].join(' ');
                updateKeywordBoxCharCount(boxInput, boxCounter); // Update count after filling
            }
        }

        // Display notices
        noticeList.innerHTML = ''; // Clear previous notices
        if (notices.length > 0) {
            notices.forEach(note => {
                const li = document.createElement('li');
                li.textContent = note;
                noticeList.appendChild(li);
            });
            noticeArea.style.display = 'block'; // Show notice area
        } else {
             noticeArea.style.display = 'none'; // Hide if no notices
        }
    }

    // --- Initial Setup ---
    generateKeywordBoxes(); // Create the boxes on page load
    noticeArea.style.display = 'none'; // Hide notice area initially

    // --- Event Listeners ---
    inputKeywordsEl.addEventListener('input', updateInputCharCount);
    organizeBtn.addEventListener('click', organizeKeywords);

});
