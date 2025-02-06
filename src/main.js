import { Conversation } from '@11labs/client';

// Mapping buttons to agent IDs
const agents = {
  micButton1: "PsNR98dYRFTCCDJvkRPS",
  micButton2: "13pq2n4EeeB2PT9BHToH",
  micButton3: "h34yZ6JHAm21OnqDDSrK",
  micButton4: "8szkeWelAsBhASldWoAj",
  micButton5: "yro50dPZ55sBrJfsJ0kd"
};

// Select all mic buttons dynamically
const micButtons = document.querySelectorAll('.mic-button');
const termsModal = document.getElementById('termsModal');
const agreeButton = document.getElementById('agreeButton');
const connectionStatus = document.getElementById('connectionStatus');
const agentStatus = document.getElementById('agentStatus');

let conversations = {}; // Store multiple conversations
let isRunning = {}; // Track running state per button
let agreedToTerms = false;

// Handle agreement to terms
agreeButton.addEventListener('click', () => {
    termsModal.classList.remove('active');
    agreedToTerms = true;
});

// Add event listeners to all mic buttons
micButtons.forEach((button) => {
    button.addEventListener('click', async (event) => {
        if (!agreedToTerms) {
            termsModal.classList.add('active');
            return;
        }

        const buttonId = event.currentTarget.id;
        button.classList.add('disabled');

        if (!isRunning[buttonId]) {
            await startConversation(buttonId);
        } else {
            await stopConversation(buttonId);
        }

        button.classList.remove('disabled');
    });
});

// ✅ Start AI Conversation for a Specific Button
async function startConversation(buttonId) {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const agentId = agents[buttonId];

        if (!agentId) {
            console.error(`Agent ID not found for button: ${buttonId}`);
            return;
        }

        console.log(`Starting session for ${buttonId} (Agent: ${agentId})`);

        conversations[buttonId] = await Conversation.startSession({
            agentId: agentId,
            onConnect: () => updateUI(buttonId, 'connected', 'listening'),
            onDisconnect: () => updateUI(buttonId, 'disconnected', 'idle'),
            onError: (error) => {
                console.error(`Error for ${buttonId}:`, error);
                updateUI(buttonId, 'disconnected', 'error');
            },
            onModeChange: (mode) => updateUI(buttonId, 'connected', mode.mode),
        });

        isRunning[buttonId] = true;
    } catch (error) {
        console.error(`Failed to start conversation for ${buttonId}:`, error);
        updateUI(buttonId, 'disconnected', 'error');
    }
}

async function stopConversation(buttonId) {
    if (conversations[buttonId]) {
        await conversations[buttonId].endSession();
        conversations[buttonId] = null;
        updateUI(buttonId, 'disconnected', 'idle');
        isRunning[buttonId] = false;
    }
}

function updateUI(buttonId, connectionState, agentState) {
    connectionStatus.textContent = connectionState === 'connected' ? 'Connected' : 'Disconnected';
    agentStatus.textContent = agentState;
}

