# Meeting Notes AI 🎙️

AI-powered meeting transcription, summary, and action items extraction using Google Gemini.

## Features

- 📝 **Transcription**: Accurate audio-to-text conversion
- 📋 **Summary**: AI-generated meeting summaries
- ✅ **Action Items**: Automatically extracted tasks and responsibilities
- 💾 **Export**: Download all outputs as text files
- 🎵 **Multiple Formats**: Supports MP3, WAV, M4A, FLAC, AAC, WEBM
- 🎙️ **Recording Options**:
  - System Audio only
  - Microphone only
  - System + Microphone combined
- 🎧 **Audio Playback**: Listen to uploaded or recorded audio

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yatendra3192/meetnote)

### Railway Deployment Steps

1. Click the "Deploy on Railway" button above
2. Connect your GitHub account
3. Configure environment variables:
   - `GOOGLE_API_KEY`: Your Google Gemini API key
4. Click "Deploy"
5. Wait for deployment to complete
6. Your app will be live!

## Local Development Setup

1. **Clone the repository**:
```bash
git clone https://github.com/yatendra3192/meetnote.git
cd meetnote
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Get Google Gemini API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

4. **Configure API Key**:
   - Create `.env` file in the root directory
   - Add: `GOOGLE_API_KEY=your_key_here`

## Run the App Locally

```bash
python app.py
```

The app will be available at `http://localhost:5000`

## Usage

1. **Upload Audio**: Drop an audio file or click to browse
2. **Or Record**:
   - System Audio: Record laptop speakers/app audio
   - Microphone: Record your voice only
   - System + Mic: Record both combined
3. **Process**: AI automatically generates transcription, summary, and action items
4. **Download**: Export any output as text file
5. **Playback**: Listen to your audio anytime

## Supported Audio Formats

- MP3
- WAV
- M4A
- FLAC
- AAC
- WEBM (for browser recordings)

## Requirements

- Python 3.11+
- Google Gemini API Key (free tier available)
- Modern web browser (Chrome, Firefox, Edge)

## Technology Stack

- **Backend**: Flask
- **AI**: Google Gemini 2.5 Flash
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Recording**: MediaRecorder API, Web Audio API
- **Deployment**: Railway, Gunicorn

## Notes

- First run may take longer as Gemini processes the audio
- Larger files will take more time to process
- Ensure stable internet connection for API calls
- System audio recording requires browser permission
- Maximum file size: 500MB

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Your Google Gemini API key | Yes |
| `PORT` | Port to run the server (default: 5000) | No |

## License

MIT License - feel free to use this project for your needs!

---

🤖 Built with Claude Code
