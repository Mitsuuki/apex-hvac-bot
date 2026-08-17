// --- 100% BULLETPROOF CLOUDFLARE URL ---
const N8N_WEBHOOK_URL = "https://ships-generators-relative-wma.trycloudflare.com/webhook/apex-web-chat";

let isSending = false;

function toggleBackend() { document.getElementById('backendPanel').classList.toggle('open'); }

// NEW: Refresh Iframe Function
function refreshFrame(id) {
    const frame = document.getElementById(id);
    const btn = document.getElementById('btn-' + id);
    
    // Add spinning animation to button
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 600);
    
    // Reload iframe without refreshing page
    const currentSrc = frame.src;
    frame.src = '';
    setTimeout(() => { frame.src = currentSrc; }, 100);
}

function toggleChat() {
    const chat = document.getElementById('chatContainer');
    const toggleBtn = document.getElementById('chatToggleBtn');
    chat.classList.toggle('open');
    toggleBtn.classList.toggle('hidden');
    if (chat.classList.contains('open')) document.getElementById('user-input').focus();
}

// Only auto-open chat if screen is larger than a phone
setTimeout(() => {
    if (window.innerWidth > 768) {
        const chat = document.getElementById('chatContainer');
        const toggleBtn = document.getElementById('chatToggleBtn');
        if (!chat.classList.contains('open')) {
            chat.classList.add('open');
            toggleBtn.classList.add('hidden');
        }
    }
}, 2000);

function openChatWithPrefill(text) {
    const chat = document.getElementById('chatContainer');
    const toggleBtn = document.getElementById('chatToggleBtn');
    chat.classList.add('open');
    toggleBtn.classList.add('hidden');
    const input = document.getElementById('user-input');
    input.value = text;
    input.style.height = "auto";
    input.style.height = (input.scrollHeight) + "px";
    input.focus();
}

const userInput = document.getElementById("user-input");
userInput.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
});

const sessionId = "session_" + Math.floor(Math.random() * 1000000000);
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-btn");
const typingIndicator = document.getElementById("typing-indicator");

function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${sender}`;
    msgDiv.innerHTML = text; 
    chatBox.insertBefore(msgDiv, typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendButtons(buttonsArray) {
    if (!buttonsArray || buttonsArray.length === 0) return;
    const container = document.createElement("div");
    container.className = "btn-container";

    buttonsArray.forEach(btnText => {
        const btn = document.createElement("button");
        btn.className = "quick-reply";
        btn.innerText = btnText;
        btn.onclick = () => {
            container.style.display = "none";
            userInput.value = "I want to book " + btnText;
            userInput.style.height = "auto";
            sendMessage();
        };
        container.appendChild(btn);
    });
    chatBox.insertBefore(container, typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() { typingIndicator.style.display = "flex"; chatBox.scrollTop = chatBox.scrollHeight; }
function hideTyping() { typingIndicator.style.display = "none"; }

async function sendMessage() {
    if (isSending) return;
    const text = userInput.value.trim();
    if (!text) return;

    isSending = true;
    appendMessage(text, "user");
    userInput.value = "";
    userInput.style.height = "auto";
    userInput.disabled = true;
    sendBtn.disabled = true;
    
    showTyping();

    const term = document.getElementById("telemetryTerminal");

    try {
        const demoDest = document.getElementById("demo-alert-dest") ? document.getElementById("demo-alert-dest").value.trim() : "";

        // Log the outbound request in the terminal
        term.innerHTML += `<br>> Transmitting payload to AI Engine... <span style="color:white">[OK]</span>`;
        term.scrollTop = term.scrollHeight;

        const liveUrl = N8N_WEBHOOK_URL + "?t=" + Date.now();
        const response = await fetch(liveUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                sessionId: sessionId, 
                message: text,
                alert_destination: demoDest 
            })
        });

        const data = await response.json();
        
        hideTyping();
        appendMessage(data.text || "Sorry, I encountered an error.", "bot");
        if (data.buttons) { appendButtons(data.buttons); }

        // --- NEW: LIVE TELEMETRY SIMULATION SEQUENCE ---
        // If the AI replied with something that indicates a booking (or Mario provided an email), simulate the backend magic
        if (demoDest && (data.text.includes("scheduled") || data.text.includes("saved") || text.toLowerCase().includes("book") || text.toLowerCase().includes("pm") || text.toLowerCase().includes("am"))) {
            
            // Step 1: Database Sync
            setTimeout(() => {
                term.innerHTML += `<br>> Pushing lead data to Google Sheets CRM... <span style="color:#3b82f6">[SUCCESS]</span>`;
                term.scrollTop = term.scrollHeight;
            }, 800);

            // Step 2: Calendar Sync
            setTimeout(() => {
                term.innerHTML += `<br>> Syncing Event to Google Calendar... <span style="color:#3b82f6">[SUCCESS]</span>`;
                term.scrollTop = term.scrollHeight;
            }, 1800);

            // Step 3: Dispatch Alert & Play Ding!
            setTimeout(() => {
                term.innerHTML += `<br>> Routing live alert to <b>${demoDest}</b>... <span style="color:#f59e0b">[DISPATCHED]</span>`;
                term.scrollTop = term.scrollHeight;
                
                // Play subtle notification ding
                try {
                    let ding = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    ding.volume = 0.6;
                    ding.play();
                } catch(e) { console.log("Audio blocked by browser"); }
                
                // Automatically slide open the dev panel to show the client!
                const panel = document.getElementById("backendPanel");
                if (!panel.classList.contains("open")) {
                    panel.classList.add("open");
                }
            }, 3000);
        }

    } catch (error) {
        hideTyping();
        console.error("Transmission Error:", error);
        appendMessage("Network error or outdated browser detected. Please check your connection or call us directly.", "bot");
        
        term.innerHTML += `<br>> <span style="color:#e11d48">ERROR: Webhook transmission failed.</span>`;
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
        isSending = false;
    }
}

function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}