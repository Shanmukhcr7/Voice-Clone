import os
import sys
import subprocess
import platform

def print_step(msg):
    print(f"\n{'='*50}\n[STEP] {msg}\n{'='*50}")

def print_success(msg):
    print(f"[SUCCESS] {msg}")

def print_error(msg):
    print(f"[ERROR] {msg}")

def run_command(command, error_msg):
    try:
        subprocess.check_call(command, shell=True)
    except subprocess.CalledProcessError as e:
        print_error(f"{error_msg}\nDetails: {e}")
        sys.exit(1)

def main():
    print_step("Checking System and Python Version")
    
    if platform.system() != "Windows":
        print_error("This application is optimized for Windows.")
        sys.exit(1)
        
    py_version = sys.version_info
    print(f"Python version detected: {py_version.major}.{py_version.minor}.{py_version.micro}")
    if py_version.major < 3 or py_version.minor < 8:
        print_error("Python 3.8 or higher is required.")
        sys.exit(1)
        
    print_step("Setting up Virtual Environment (venv)")
    venv_dir = "venv"
    if not os.path.exists(venv_dir):
        print("Creating virtual environment...")
        run_command(f"\"{sys.executable}\" -m venv {venv_dir}", "Failed to create virtual environment.")
        print_success("Virtual environment created.")
    else:
        print_success("Virtual environment already exists.")

    # Determine pip path inside venv
    pip_exe = os.path.join(venv_dir, "Scripts", "pip.exe")
    python_exe = os.path.join(venv_dir, "Scripts", "python.exe")
    
    if not os.path.exists(pip_exe):
        print_error("pip not found in virtual environment.")
        sys.exit(1)

    print_step("Upgrading pip")
    run_command(f"\"{python_exe}\" -m pip install --upgrade pip", "Failed to upgrade pip.")

    print_step("Installing PyTorch (CPU-only version)")
    # Specifically install CPU version to avoid huge CUDA downloads and enforce CPU-only usage
    run_command(
        f"\"{pip_exe}\" install torch torchaudio --index-url https://download.pytorch.org/whl/cpu",
        "Failed to install PyTorch CPU version."
    )
    print_success("PyTorch CPU installed successfully.")

    print_step("Installing other dependencies from requirements.txt")
    # Install remaining requirements (skips reinstalling torch since it's already there)
    run_command(f"\"{pip_exe}\" install -r requirements.txt", "Failed to install dependencies.")
    print_success("All dependencies installed.")
    
    print_step("Verifying Torch Installation (CPU Check)")
    verify_script = "import torch; print('Torch version:', torch.__version__); assert not torch.cuda.is_available(), 'CUDA should not be available in CPU-only install'"
    run_command(f"\"{python_exe}\" -c \"{verify_script}\"", "Torch verification failed.")
    print_success("Verified: PyTorch is running in CPU-only mode.")

    print_step("Downloading Chatterbox TTS Model")
    if os.path.exists("download_model.py"):
        run_command(f"\"{python_exe}\" download_model.py", "Failed to download the model.")
        print_success("Model download process completed.")
    else:
        print("download_model.py not found. Model will be downloaded on first run of app.py.")

    print_step("Installation Complete!")
    print("You can now run the application by executing:\n\n    .\\venv\\Scripts\\python.exe app.py\n")

if __name__ == "__main__":
    main()
