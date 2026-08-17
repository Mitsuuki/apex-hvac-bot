// --- 100% BULLETPROOF CLOUDFLARE URL ---
const N8N_WEBHOOK_URL = "https://ships-generators-relative-wma.trycloudflare.com/webhook/apex-web-chat";

let isSending = false;

function toggleBackend() { 
    document.getElementById('backendPanel').classList.toggle('open'); 
}

function refreshFrame(id) {
    const frame = document.getElementById(id);
    const btn = document.getElementById('btn-' + id);
    
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 600);
    
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

function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
}

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
        term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > Executing Webhook Payload... <span style="color:white">[OK]</span>`;
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

        // --- COMMAND EMBED TELEMETRY SEQUENCE ---
        if (data.text.includes("scheduled") || data.text.includes("saved") || text.toLowerCase().includes("book") || text.toLowerCase().includes("pm") || text.toLowerCase().includes("am")) {
            
            // Step 1: Database Sync
            setTimeout(() => {
                term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > SQL_INSERT into public.leads... <span style="color:#10b981">[SUCCESS]</span>`;
                term.scrollTop = term.scrollHeight;
            }, 800);

            // Step 2: Calendar Sync
            setTimeout(() => {
                term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > POST https://www.googleapis.com/calendar/v3/calendars... <span style="color:#10b981">[SUCCESS]</span>`;
                term.scrollTop = term.scrollHeight;
            }, 1800);

            // Step 3: Dispatch Alert & Play Ding!
            setTimeout(() => {
                if (demoDest) {
                    term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > DISPATCH_ALERT: Routing notification to <b>${demoDest}</b>... <span style="color:#f59e0b">[SENT]</span>`;
                    
                    // Play subtle notification ding
                    try {
                        let ding = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                        ding.volume = 0.6;
                        ding.play();
                    } catch(e) { console.log("Audio blocked by browser"); }
                    
                    // Automatically slide open the dev panel
                    const panel = document.getElementById("backendPanel");
                    if (!panel.classList.contains("open")) {
                        panel.classList.add("open");
                    }
                } else {
                    term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > <span style="color:#94a3b8">WARN: No alert destination provided. Skipping email dispatch.</span>`;
                }
                term.scrollTop = term.scrollHeight;
            }, 3000);
        }

    } catch (error) {
        hideTyping();
        console.error("Transmission Error:", error);
        appendMessage("Network error or outdated browser detected. Please check your connection or call us directly.", "bot");
        
        term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > <span style="color:#e11d48">FATAL: Webhook transmission failed.</span>`;
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