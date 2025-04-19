const socket = io("https://friendo-two.vercel.app/");

const status = document.getElementById("status");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const interestInput = document.getElementById("interest-input");
const sendBtn = document.getElementById("send-btn");
const joinBtn = document.getElementById("join-btn");
const disconnectBtn = document.getElementById("disconnect-btn");

messageInput.disabled = true;
sendBtn.disabled = true;

function appendMessage(text, isSelf = false) {
  const msg = document.createElement("div");
if (isSelf) {
    msg.className="message-user"
    msg.textContent = "You: " + text;
}else{
    msg.className="message-stranger"
    msg.textContent = "Stranger: " + text;
}
msg.classList.add("message");
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

socket.on("waiting", (msg) => {
  status.textContent = msg;
  messageInput.disabled = true;
  sendBtn.disabled = true;
});

socket.on("partner-found", (msg) => {
  status.textContent = msg;
  messageInput.disabled = false;
  sendBtn.disabled = false;
  interestInput.disabled = true;
  joinBtn.disabled = true;
  disconnectBtn.disabled = false;
  chatBox.innerHTML = ""; // Clear chat box on new partner
});

socket.on("partner-disconnected", (msg) => {
  appendMessage(msg);
  messageInput.disabled = true;
  sendBtn.disabled = true;
  interestInput.disabled = false;
  joinBtn.disabled = false;
  disconnectBtn.disabled = true;
});

socket.on("message", (msg) => {
  appendMessage(msg, false);
});



sendBtn.addEventListener("click", () => {
  const msg = messageInput.value.trim();
  if (msg) {
    socket.emit("message", msg);
    appendMessage(msg, true);
    messageInput.value = "";
  }
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

joinBtn.addEventListener("click", () => {
  const interestStr = interestInput.value.trim();
  if (interestStr) {
    socket.emit("join", interestStr);
    status.textContent = "Searching for a stranger with similar interests...";
  }
});

disconnectBtn.addEventListener("click", () => {
  socket.emit("disconnect-manual");
  status.textContent = "Disconnected. Join again to chat.";
  messageInput.disabled = true;
  sendBtn.disabled = true;
  joinBtn.disabled = false;
  interestInput.disabled = false;
  disconnectBtn.disabled = true;
});
