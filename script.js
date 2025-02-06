import { Conversation } from '@11labs/client';

// DOM Elements
const micButton = document.getElementById('micButton');
const termsModal = document.getElementById('termsModal');
const agreeButton = document.getElementById('agreeButton');
const connectionStatus = document.getElementById('connectionStatus');
const agentStatus = document.getElementById('agentStatus');
let conversation = null;
let isRunning = false;

// Terms and Conditions Logic
agreeButton.addEventListener('click', () => {
    // Hide the modal
    termsModal.style.display = 'none';

    // Enable the "Start" button
    micButton.disabled = false;
});

// Bot Logic
async function startConversation() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        conversation = await Conversation.startSession({
            agentId: 'PsNR98dYRFTCCDJvkRPS', // Replace with your Agent ID
            onConnect: () => {
                updateUI('connected', 'listening');
            },
            onDisconnect: () => {
                updateUI('disconnected', 'idle');
            },
            onError: (error) => {
                console.error('Error:', error);
                updateUI('disconnected', 'error');
            },
            onModeChange: (mode) => {
                if (mode.mode === 'speaking') {
                    updateUI('connected', 'speaking');
                } else if (mode.mode === 'listening') {
                    updateUI('connected', 'listening');
                }
            },
        });
    } catch (error) {
        console.error('Failed to start conversation:', error);
        updateUI('disconnected', 'error');
    }
}

async function stopConversation() {
    if (conversation) {
        await conversation.endSession();
        conversation = null;
        updateUI('disconnected', 'idle');
    }
}

function updateUI(connectionState, agentState) {
    connectionStatus.textContent =
        connectionState === 'connected' ? 'Connected' : 'Disconnected';
    agentStatus.textContent = agentState;

    micButton.querySelector('h5').textContent =
        connectionState === 'connected' ? 'Stop' : 'Start';
    isRunning = connectionState === 'connected';
}

micButton.addEventListener('click', async () => {
    if (!isRunning) {
        await startConversation();
    } else {
        await stopConversation();
    }
});
