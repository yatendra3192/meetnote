import streamlit as st
import google.generativeai as genai
import os
from pathlib import Path
import tempfile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

st.set_page_config(
    page_title="Meeting Notes AI",
    page_icon="🎙️",
    layout="wide"
)

st.title("🎙️ Meeting Notes AI")
st.markdown("Upload your meeting audio and get AI-generated transcription, summary, and action items")

# Sidebar for API key configuration
with st.sidebar:
    st.header("⚙️ Configuration")
    api_key = st.text_input("Google Gemini API Key", type="password", value=os.getenv("GOOGLE_API_KEY", ""))
    if api_key:
        genai.configure(api_key=api_key)
        st.success("API Key configured!")
    else:
        st.warning("Please enter your Gemini API Key")

    st.markdown("---")
    st.markdown("### Supported Audio Formats")
    st.markdown("- MP3\n- WAV\n- M4A\n- FLAC\n- AAC")

# Main content
uploaded_file = st.file_uploader("Upload Meeting Audio", type=["mp3", "wav", "m4a", "flac", "aac"])

if uploaded_file and api_key:
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(uploaded_file.name).suffix) as tmp_file:
        tmp_file.write(uploaded_file.getvalue())
        tmp_file_path = tmp_file.name

    st.success(f"File uploaded: {uploaded_file.name} ({uploaded_file.size / 1024 / 1024:.2f} MB)")

    if st.button("🚀 Process Meeting", type="primary"):
        try:
            with st.spinner("Processing audio..."):
                # Upload audio file to Gemini
                audio_file = genai.upload_file(path=tmp_file_path)

                # Create tabs for different outputs
                tab1, tab2, tab3 = st.tabs(["📝 Transcription", "📋 Summary", "✅ Action Items"])

                # Tab 1: Transcription
                with tab1:
                    with st.spinner("Transcribing audio..."):
                        model = genai.GenerativeModel("gemini-2.5-pro")
                        transcription_prompt = """
                        Please transcribe this meeting audio accurately.
                        Include speaker labels if you can identify different speakers.
                        Format the transcription clearly with timestamps if possible.
                        """
                        transcription_response = model.generate_content([transcription_prompt, audio_file])
                        st.markdown("### Transcription")
                        st.markdown(transcription_response.text)

                        # Download button
                        st.download_button(
                            label="📥 Download Transcription",
                            data=transcription_response.text,
                            file_name="transcription.txt",
                            mime="text/plain"
                        )

                # Tab 2: Summary
                with tab2:
                    with st.spinner("Generating summary..."):
                        summary_prompt = """
                        Based on this meeting audio, provide a comprehensive summary including:
                        1. Main topics discussed
                        2. Key decisions made
                        3. Important points raised
                        4. Next steps mentioned

                        Format the summary in a clear, structured way.
                        """
                        summary_response = model.generate_content([summary_prompt, audio_file])
                        st.markdown("### Meeting Summary")
                        st.markdown(summary_response.text)

                        st.download_button(
                            label="📥 Download Summary",
                            data=summary_response.text,
                            file_name="summary.txt",
                            mime="text/plain"
                        )

                # Tab 3: Action Items
                with tab3:
                    with st.spinner("Extracting action items..."):
                        action_items_prompt = """
                        Extract all action items from this meeting audio.
                        For each action item, identify:
                        - What needs to be done
                        - Who is responsible (if mentioned)
                        - Deadline or timeframe (if mentioned)

                        Format as a clear, numbered list.
                        If no action items are found, say "No action items identified."
                        """
                        action_items_response = model.generate_content([action_items_prompt, audio_file])
                        st.markdown("### Action Items")
                        st.markdown(action_items_response.text)

                        st.download_button(
                            label="📥 Download Action Items",
                            data=action_items_response.text,
                            file_name="action_items.txt",
                            mime="text/plain"
                        )

                st.success("✅ Processing complete!")

        except Exception as e:
            st.error(f"Error processing audio: {str(e)}")
            st.info("Make sure you have a valid Gemini API key and the audio file is in a supported format.")

        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

elif uploaded_file and not api_key:
    st.warning("⚠️ Please enter your Google Gemini API Key in the sidebar to proceed.")

# Footer
st.markdown("---")
st.markdown("Made with ❤️ using Streamlit and Google Gemini")
