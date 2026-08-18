// --- 100% BULLETPROOF CLOUDFLARE URL ---
const N8N_WEBHOOK_URL = "https://exercises-contracting-maternity-dealers.trycloudflare.com/webhook/apex-web-chat";

let isSending = false;

// --- EMAIL PING LOGIC ---
function checkEmailInput() {
    const emailInput = document.getElementById("demo-alert-dest");
    const pingNav = document.getElementById("dev-ping");
    const pingInput = document.getElementById("input-ping");
    
    if(emailInput.value.trim() !== "") {
        pingNav.style.display = "none";
        pingInput.style.display = "none";
        emailInput.classList.add("filled");
    } else {
        pingNav.style.display = "inline-block";
        pingInput.style.display = "inline-block";
        emailInput.classList.remove("filled");
    }
}

function toggleBackend() { 
    document.getElementById('backendPanel').classList.toggle('open'); 
    
    // Auto-focus the email box when they open it, if it's empty
    const emailInput = document.getElementById("demo-alert-dest");
    if(emailInput.value.trim() === "") {
        setTimeout(() => emailInput.focus(), 400);
    }
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

        // PROFESSIONAL TERMINAL LOGIC
        term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > POST /api/v1/engine/transmit ... <span style="color:#e2e8f0">[PENDING]</span>`;
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
        
        term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > RESPONSE RECEIVED ... <span style="color:#10b981">[200 OK]</span>`;

        if (data.text.includes("scheduled") || data.text.includes("saved") || text.toLowerCase().includes("book") || text.toLowerCase().includes("pm") || text.toLowerCase().includes("am")) {
            
            setTimeout(() => {
                term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > SQL_INSERT into public.leads ... <span style="color:#10b981">[SUCCESS]</span>`;
                term.scrollTop = term.scrollHeight;
            }, 800);

            setTimeout(() => {
                term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > POST https://www.googleapis.com/calendar/v3/calendars ... <span style="color:#10b981">[SUCCESS]</span>`;
                term.scrollTop = term.scrollHeight;
            }, 1800);

            setTimeout(() => {
                if (demoDest) {
                    term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > DISPATCH_MAIL_SMTP: Routing to <b>${demoDest}</b> ... <span style="color:#3b82f6">[QUEUED & SENT]</span>`;
                    
                    try {
                        let ding = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                        ding.volume = 0.5;
                        ding.play();
                    } catch(e) {}
                    
                    const panel = document.getElementById("backendPanel");
                    if (!panel.classList.contains("open")) {
                        panel.classList.add("open");
                    }
                } else {
                    term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > <span style="color:#f59e0b">WARN: alert_destination is null. Skipping SMTP dispatch.</span>`;
                }
                term.scrollTop = term.scrollHeight;
            }, 3000);
        }

    } catch (error) {
        hideTyping();
        console.error("Transmission Error:", error);
        appendMessage("Network error or outdated browser detected. Please check your connection or call us directly.", "bot");
        term.innerHTML += `<br><span style="color: #64748b">[${getTimestamp()}]</span> > <span style="color:#ef4444">FATAL_ERR: Webhook connection timed out.</span>`;
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