# 🎙️ Voice Cloning Web Application

A production-quality, CPU-optimized Voice Cloning Web Application built for Windows using Resemble AI's Chatterbox TTS and Gradio. 
The application works completely offline after the initial model download and ensures minimal RAM/CPU footprint.

## 📁 Project Structure

- `app.py`: Main Gradio Web UI script.
- `install.py`: Installer script that automatically sets up the environment, installs dependencies, and downloads the model.
- `requirements.txt`: List of dependencies.
- `download_model.py`: Script responsible for downloading the Chatterbox TTS model.
- `config.py`: Project configuration and paths.
- `utils.py`: Audio processing (format conversion, silence removal, normalization).
- `model_loader.py`: Handles loading the TTS model using a memory-optimized Singleton pattern.
- `generate.py`: Executes the model inference with memory garbage collection.
- `outputs/`: Saved generated audios.
- `uploads/`: Processed uploads.
- `cache/`: Cached Chatterbox model.
- `venv/`: Virtual environment.

## ⚙️ Installation

1. Open a Command Prompt or PowerShell terminal.
2. Navigate to this directory.
3. Run the installer:
   ```cmd
   python install.py
   ```
   *This will create a virtual environment, install CPU-only PyTorch (to save space), install all dependencies, and pre-download the model.*

## 🚀 Running the App

After a successful installation, you can run the application directly from the virtual environment:

```cmd
.\venv\Scripts\python.exe app.py
```

The browser will automatically open to `http://127.0.0.1:7860`.

## 🛠️ Usage
1. **Upload Voice**: Upload a WAV/MP3/FLAC file. It must be between 5 and 30 seconds. The app will automatically convert, normalize, and remove silence.
2. **Type Text**: Enter the text you want the AI to speak.
3. **Generate**: Click the generate button. Generation time will depend on your CPU capability.
4. **Download**: The audio will appear on the right side and is automatically saved in the `outputs/` folder.

## ❓ FAQ & Troubleshooting
- **Model takes too long to load?** The first run might take a while to initialize. Subsequent generations use the cached model in memory.
- **Out of Memory Error?** Ensure you don't have other heavy applications open. The script automatically uses `gc.collect()` to free memory.
- **Audio Error?** Ensure your reference audio is clear, contains only one speaker, and is not overly noisy.
