import gradio as gr
import os
import time
from utils import load_and_validate_audio, save_temp_wav, save_generated_audio, generate_history_list
from generate import generate_speech

def process_and_generate(audio_file, text_prompt, progress=gr.Progress()):
    if audio_file is None:
        raise gr.Error("Please upload a voice sample.")
    if not text_prompt or not text_prompt.strip():
        raise gr.Error("Please enter some text to generate.")
        
    try:
        progress(0.1, desc="Validating and processing audio...")
        y, sr = load_and_validate_audio(audio_file)
        
        processed_path = save_temp_wav(y, sr, audio_file)
        
        progress(0.3, desc="Audio validated. Initializing AI Model...")
        
        # We don't have exact step-by-step progress from the model, but we can simulate it
        progress(0.5, desc="Synthesizing Speech (CPU generation takes time)...")
        
        out_sr, out_y, gen_time = generate_speech(text_prompt, processed_path)
        
        progress(0.9, desc="Saving output...")
        out_path = save_generated_audio(out_y, out_sr, text_prompt)
        
        if os.path.exists(processed_path):
            os.remove(processed_path)
            
        success_msg = f"✨ Successfully generated in {gen_time:.1f} seconds!"
        
        # Return audio, success message, update history dropdown, and update estimated time label
        return out_path, success_msg, gr.update(choices=[h[0] for h in generate_history_list()])
        
    except ValueError as ve:
        raise gr.Error(str(ve))
    except Exception as e:
        raise gr.Error(f"An error occurred: {str(e)}")

def clear_all():
    return None, "", None, "Ready", "Characters: 0 / 250"

def count_chars(text):
    length = len(text) if text else 0
    # Estimate time: roughly 1 second per 5 characters on a decent CPU, just a placeholder estimate
    est_time = max(5, length // 5)
    return f"Characters: {length} | Estimated Generation Time: ~{est_time}s"

# Modern, sleek custom CSS for a premium dark theme
custom_css = """
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');

body, .gradio-container {
    font-family: 'Outfit', sans-serif !important;
    background-color: #0d1117 !important;
    color: #c9d1d9 !important;
}

h1 {
    text-align: center;
    background: -webkit-linear-gradient(45deg, #00f2fe, #4facfe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 600;
    margin-bottom: 0px !important;
}

.header-subtext {
    text-align: center;
    color: #8b949e;
    margin-bottom: 30px;
}

.box-container {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

button.primary {
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%) !important;
    border: none !important;
    color: white !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
}

button.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4) !important;
}

.status-box textarea {
    color: #58a6ff !important;
    font-weight: 600 !important;
    text-align: center;
}
"""

with gr.Blocks(theme=gr.themes.Base(), css=custom_css) as demo:
    with gr.Column():
        gr.Markdown("# 🎙️ Chatterbox Studio")
        gr.Markdown("<div class='header-subtext'>Premium AI Voice Cloning • Offline • CPU Optimized</div>")
    
    with gr.Row():
        # Left Column - Inputs
        with gr.Column(scale=5, elem_classes="box-container"):
            gr.Markdown("### 1. Upload Target Voice")
            audio_input = gr.Audio(type="filepath", label="Reference Audio (5-30s WAV/MP3/FLAC)")
            
            gr.Markdown("### 2. Enter Script")
            text_input = gr.Textbox(
                label="Speech Text", 
                lines=4, 
                placeholder="Type the exact words you want the voice to say...",
                show_label=False
            )
            char_count = gr.Markdown("Characters: 0 | Estimated Generation Time: ~5s")
            
            with gr.Row():
                clear_btn = gr.Button("🗑️ Clear", variant="secondary", size="lg")
                generate_btn = gr.Button("⚡ Generate Speech", variant="primary", size="lg")
                
        # Right Column - Outputs
        with gr.Column(scale=4, elem_classes="box-container"):
            gr.Markdown("### 🎧 Result")
            audio_output = gr.Audio(label="Generated Audio", interactive=False)
            
            status_bar = gr.Textbox(
                label="Status", 
                value="Ready", 
                interactive=False, 
                elem_classes="status-box",
                lines=1
            )
            
            gr.Markdown("---")
            gr.Markdown("### 📜 Generation History")
            history_dropdown = gr.Dropdown(
                label="Past Generations (Saved in outputs/)", 
                choices=[h[0] for h in generate_history_list()], 
                interactive=True
            )
            
    # Interactivity
    text_input.change(
        fn=count_chars, 
        inputs=text_input, 
        outputs=char_count
    )
    
    generate_btn.click(
        fn=process_and_generate,
        inputs=[audio_input, text_input],
        outputs=[audio_output, status_bar, history_dropdown]
    )
    
    clear_btn.click(
        fn=clear_all,
        inputs=[],
        outputs=[audio_input, text_input, audio_output, status_bar, char_count]
    )

if __name__ == "__main__":
    demo.launch(inbrowser=True, server_name="127.0.0.1")
