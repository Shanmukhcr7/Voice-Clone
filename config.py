import os

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, "cache")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

# Create directories if they don't exist
for d in [CACHE_DIR, OUTPUTS_DIR, UPLOADS_DIR]:
    os.makedirs(d, exist_ok=True)

# Audio Constraints
MIN_AUDIO_DURATION = 5.0  # seconds
MAX_AUDIO_DURATION = 30.0 # seconds
TARGET_SAMPLE_RATE = 24000 # target sample rate for Chatterbox

# Model configuration
MODEL_REPO = "BosonLab/chatterbox-desi"
MODEL_NAME = "chatterbox"
