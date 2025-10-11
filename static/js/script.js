// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const audioInput = document.getElementById('audioInput');
const welcomeScreen = document.getElementById('welcomeScreen');
const loadingScreen = document.getElementById('loadingScreen');
const resultsScreen = document.getElementById('resultsScreen');
const loadingMessage = document.getElementById('loadingMessage');
const newMeetingBtn = document.getElementById('newMeetingBtn');

// Recording elements
const recordOptionBtns = document.querySelectorAll('.record-option-btn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const audioInputContainer = document.querySelector('.audio-input-container');
const recordingStatus = document.getElementById('recordingStatus');
const recordingTime = document.getElementById('recordingTime');

// Tab elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Result content elements
const transcriptionContent = document.getElementById('transcriptionContent');
const summaryContent = document.getElementById('summaryContent');
const actionItemsContent = document.getElementById('actionItemsContent');

// Store results for download
let results = {
    transcription: '',
    summary: '',
    actionItems: ''
};

// Processing states - track what's been processed
let processedStates = {
    transcription: false,
    summary: false,
    actionItems: false
};

// Recording variables
let mediaRecorder;
let audioChunks = [];
let recordingInterval;
let recordingStartTime;

// Audio playback
let currentAudioFile = null;

// Upload Area Click
uploadArea.addEventListener('click', () => {
    audioInput.click();
});

// File Input Change
audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

// Drag and Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragging');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragging');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragging');

    const file = e.dataTransfer.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

// Tab Switching
tabButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const targetTab = button.getAttribute('data-tab');

        // Remove active class from all tabs and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // Add active class to clicked tab and corresponding pane
        button.classList.add('active');
        document.getElementById(targetTab + 'Tab').classList.add('active');

        // Process content if not already processed
        if (currentAudioFile && !processedStates[targetTab]) {
            await processTab(targetTab);
        }
    });

    // Touch feedback for tabs
    button.addEventListener('touchstart', (e) => {
        if (!button.classList.contains('active')) {
            button.style.opacity = '0.7';
        }
    }, { passive: true });

    button.addEventListener('touchend', (e) => {
        button.style.opacity = '1';
    }, { passive: true });
});

// Download Buttons
document.querySelectorAll('.btn-download').forEach(button => {
    button.addEventListener('click', () => {
        const contentType = button.getAttribute('data-content');
        downloadContent(contentType);
    });

    // Touch feedback for download buttons
    button.addEventListener('touchstart', (e) => {
        button.style.opacity = '0.8';
    }, { passive: true });

    button.addEventListener('touchend', (e) => {
        button.style.opacity = '1';
    }, { passive: true });
});

// New Meeting Button
newMeetingBtn.addEventListener('click', () => {
    resetApp();
});

// Touch feedback for new meeting button
newMeetingBtn.addEventListener('touchstart', (e) => {
    newMeetingBtn.style.opacity = '0.7';
}, { passive: true });

newMeetingBtn.addEventListener('touchend', (e) => {
    newMeetingBtn.style.opacity = '1';
}, { passive: true });

// Record Option Buttons
recordOptionBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const mode = btn.getAttribute('data-mode');
        startRecording(mode);
    });

    // Add touch feedback for mobile devices
    btn.addEventListener('touchstart', (e) => {
        btn.style.opacity = '0.7';
    }, { passive: true });

    btn.addEventListener('touchend', (e) => {
        btn.style.opacity = '1';
    }, { passive: true });

    btn.addEventListener('touchcancel', (e) => {
        btn.style.opacity = '1';
    }, { passive: true });
});

// Stop Record Button
stopRecordBtn.addEventListener('click', () => {
    stopRecording();
});

// Add touch feedback for stop button
stopRecordBtn.addEventListener('touchstart', (e) => {
    stopRecordBtn.style.opacity = '0.8';
}, { passive: true });

stopRecordBtn.addEventListener('touchend', (e) => {
    stopRecordBtn.style.opacity = '1';
}, { passive: true });

// Start Recording
async function startRecording(mode) {
    try {
        let stream;
        let micStream;
        let systemStream;

        if (mode === 'system') {
            // Record system audio only
            try {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                });

                // We only want audio, so stop the video track
                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.stop();
                    stream.removeTrack(videoTrack);
                }

                // Check if audio track exists
                if (stream.getAudioTracks().length === 0) {
                    throw new Error('No audio track available. Please make sure to check "Share audio" when selecting what to share.');
                }
            } catch (error) {
                console.error('Error accessing system audio:', error);
                alert('Error accessing system audio. Make sure to:\n1. Select a tab/window to share\n2. Check "Share audio" option\n3. Click Share');
                return;
            }
        } else if (mode === 'microphone') {
            // Record microphone only
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        } else if (mode === 'both') {
            // Record both system audio and microphone
            try {
                // Get system audio
                systemStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                });

                // Stop video track
                const videoTrack = systemStream.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.stop();
                    systemStream.removeTrack(videoTrack);
                }

                // Check if audio track exists
                if (systemStream.getAudioTracks().length === 0) {
                    throw new Error('No audio track available. Please make sure to check "Share audio" when selecting what to share.');
                }

                // Get microphone
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                // Mix both streams
                const audioContext = new AudioContext();
                const systemSource = audioContext.createMediaStreamSource(systemStream);
                const micSource = audioContext.createMediaStreamSource(micStream);
                const destination = audioContext.createMediaStreamDestination();

                systemSource.connect(destination);
                micSource.connect(destination);

                stream = destination.stream;
            } catch (error) {
                console.error('Error accessing audio:', error);
                alert('Error accessing audio sources. Please grant necessary permissions.');
                return;
            }
        }

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

            // Stop all tracks
            if (systemStream) systemStream.getTracks().forEach(track => track.stop());
            if (micStream) micStream.getTracks().forEach(track => track.stop());
            stream.getTracks().forEach(track => track.stop());

            // Process the recorded audio
            handleFileUpload(audioFile);
        };

        mediaRecorder.start();

        // Update UI
        audioInputContainer.style.display = 'none';
        recordingStatus.style.display = 'block';

        // Start timer
        recordingStartTime = Date.now();
        recordingInterval = setInterval(updateRecordingTime, 1000);

    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Error starting recording. Please ensure permissions are granted.');
    }
}

// Stop Recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();

        // Update UI
        audioInputContainer.style.display = 'grid';
        recordingStatus.style.display = 'none';

        // Clear timer
        clearInterval(recordingInterval);
        recordingTime.textContent = '00:00';
    }
}

// Update Recording Time
function updateRecordingTime() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    recordingTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Handle File Upload
async function handleFileUpload(file) {
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/flac', 'audio/aac', 'audio/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|flac|aac|webm)$/i)) {
        alert('Please upload a valid audio file (MP3, WAV, M4A, FLAC, AAC, or WEBM)');
        return;
    }

    // Check file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
        alert('File size must be less than 500MB');
        return;
    }

    // Store audio file for playback
    currentAudioFile = file;

    // Set up audio playback
    const audioPlayer = document.getElementById('audioPlayer');
    const audioFileName = document.getElementById('audioFileName');
    const audioURL = URL.createObjectURL(currentAudioFile);
    audioPlayer.src = audioURL;
    audioFileName.textContent = currentAudioFile.name;

    // Clear previous results and processing states
    results = {
        transcription: '',
        summary: '',
        actionItems: ''
    };
    processedStates = {
        transcription: false,
        summary: false,
        actionItems: false
    };

    // Clear content areas
    transcriptionContent.innerHTML = '<p style="color: #64748b; text-align: center; padding: 2rem;">Click to generate transcription</p>';
    summaryContent.innerHTML = '<p style="color: #64748b; text-align: center; padding: 2rem;">Click to generate summary</p>';
    actionItemsContent.innerHTML = '<p style="color: #64748b; text-align: center; padding: 2rem;">Click to extract action items</p>';

    // Show results screen immediately
    showScreen('results');
}

// Process individual tab content
async function processTab(tabName) {
    if (!currentAudioFile) return;

    const contentMap = {
        transcription: transcriptionContent,
        summary: summaryContent,
        actionItems: actionItemsContent
    };

    const promptMap = {
        transcription: 'Please transcribe this meeting audio.',
        summary: 'Based on this meeting audio, provide a comprehensive summary:',
        actionItems: 'Extract all action items from this meeting audio. If no action items are found, say "No action items identified."'
    };

    const loadingMessages = {
        transcription: 'Transcribing audio...',
        summary: 'Generating summary...',
        actionItems: 'Extracting action items...'
    };

    const contentElement = contentMap[tabName];

    try {
        // Show loading state in the tab
        contentElement.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem;">
                <div class="spinner" style="margin-bottom: 1rem;"></div>
                <p style="color: #64748b;">${loadingMessages[tabName]}</p>
            </div>
        `;

        // Process the specific content
        const formData = new FormData();
        formData.append('audio', currentAudioFile);
        formData.append('type', tabName);

        const response = await fetch('/api/process-audio-single', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to process audio');
        }

        const data = await response.json();

        // Store and display result
        results[tabName] = data.result;
        contentElement.textContent = data.result;
        processedStates[tabName] = true;

    } catch (error) {
        console.error('Error:', error);
        contentElement.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: #ef4444; margin-bottom: 1rem;">Error: ${error.message}</p>
                <button onclick="processTab('${tabName}')" style="padding: 0.5rem 1rem; background: #0EA5E9; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// Update Loading Message
function updateLoadingMessage(message) {
    loadingMessage.textContent = message;
}

// Show Screen
function showScreen(screen) {
    welcomeScreen.style.display = 'none';
    loadingScreen.style.display = 'none';
    resultsScreen.style.display = 'none';

    switch (screen) {
        case 'welcome':
            welcomeScreen.style.display = 'block';
            break;
        case 'loading':
            loadingScreen.style.display = 'flex';
            break;
        case 'results':
            resultsScreen.style.display = 'block';
            break;
    }
}

// Download Content
function downloadContent(type) {
    let content = '';
    let filename = '';

    switch (type) {
        case 'transcription':
            content = results.transcription;
            filename = 'meeting-transcription.txt';
            break;
        case 'summary':
            content = results.summary;
            filename = 'meeting-summary.txt';
            break;
        case 'actionItems':
            content = results.actionItems;
            filename = 'meeting-action-items.txt';
            break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Reset App
function resetApp() {
    showScreen('welcome');
    audioInput.value = '';
    results = {
        transcription: '',
        summary: '',
        actionItems: ''
    };
    processedStates = {
        transcription: false,
        summary: false,
        actionItems: false
    };

    // Reset audio playback
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer.src) {
        URL.revokeObjectURL(audioPlayer.src);
        audioPlayer.src = '';
    }
    currentAudioFile = null;

    // Reset to first tab
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    tabButtons[0].classList.add('active');
    tabPanes[0].classList.add('active');
}

// Make processTab available globally for retry buttons
window.processTab = processTab;
