from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from pathlib import Path
from dotenv import load_dotenv
import tempfile

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/process-audio', methods=['POST'])
def process_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        if audio_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Read audio file data
        audio_data = audio_file.read()

        # Determine mime type
        mime_type_map = {
            '.mp3': 'audio/mp3',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4',
            '.flac': 'audio/flac',
            '.aac': 'audio/aac',
            '.webm': 'audio/webm'
        }

        file_ext = os.path.splitext(audio_file.filename)[1].lower()
        mime_type = mime_type_map.get(file_ext, 'audio/wav')

        print(f"Processing audio file: {audio_file.filename}, type: {mime_type}, size: {len(audio_data)} bytes")

        # Create model - using gemini-2.5-flash (confirmed available)
        model = genai.GenerativeModel("models/gemini-2.5-flash")

        # Create audio part for inline data
        audio_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": audio_data
            }
        }

        # Generate transcription
        transcription_prompt = """
        Please transcribe this meeting audio.
        """
        print("Generating transcription...")
        transcription_response = model.generate_content([transcription_prompt, audio_part])

        # Generate summary
        summary_prompt = """
        Based on this meeting audio, provide a comprehensive summary:
        """
        print("Generating summary...")
        summary_response = model.generate_content([summary_prompt, audio_part])

        # Extract action items
        action_items_prompt = """
        Extract all action items from this meeting audio.
        If no action items are found, say "No action items identified."
        """
        print("Extracting action items...")
        action_items_response = model.generate_content([action_items_prompt, audio_part])

        return jsonify({
            'success': True,
            'transcription': transcription_response.text,
            'summary': summary_response.text,
            'action_items': action_items_response.text
        })

    except Exception as e:
        import traceback
        print(f"Error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/process-audio-single', methods=['POST'])
def process_audio_single():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        if 'type' not in request.form:
            return jsonify({'error': 'No processing type specified'}), 400

        audio_file = request.files['audio']
        processing_type = request.form['type']

        if audio_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Read audio file data
        audio_data = audio_file.read()

        # Determine mime type
        mime_type_map = {
            '.mp3': 'audio/mp3',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4',
            '.flac': 'audio/flac',
            '.aac': 'audio/aac',
            '.webm': 'audio/webm'
        }

        file_ext = os.path.splitext(audio_file.filename)[1].lower()
        mime_type = mime_type_map.get(file_ext, 'audio/wav')

        print(f"Processing {processing_type} for audio file: {audio_file.filename}, type: {mime_type}")

        # Create model
        model = genai.GenerativeModel("models/gemini-2.5-flash")

        # Create audio part for inline data
        audio_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": audio_data
            }
        }

        # Process based on type
        if processing_type == 'custom':
            # Get custom prompt from request
            custom_prompt = request.form.get('customPrompt', '')
            if not custom_prompt:
                return jsonify({'error': 'Custom prompt is required'}), 400
            prompt = custom_prompt
        else:
            prompt_map = {
                'transcription': 'Please transcribe this meeting audio.',
                'summary': 'Based on this meeting audio, provide a comprehensive summary:',
                'actionItems': 'Extract all action items from this meeting audio. If no action items are found, say "No action items identified."'
            }

            if processing_type not in prompt_map:
                return jsonify({'error': 'Invalid processing type'}), 400

            prompt = prompt_map[processing_type]

        print(f"Generating {processing_type}...")
        response = model.generate_content([prompt, audio_part])

        return jsonify({
            'success': True,
            'result': response.text
        })

    except Exception as e:
        import traceback
        print(f"Error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
