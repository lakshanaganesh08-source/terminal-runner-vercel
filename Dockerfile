# ==============================================================================
# TERMINAL RUNNER - Multi-Platform Docker Container
# ==============================================================================
FROM python:3.11-slim-bookworm

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DISPLAY=:0

# Install required system packages, X11 libraries, and SDL2 runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsdl2-2.0-0 \
    libsdl2-image-2.0-0 \
    libsdl2-mixer-2.0-0 \
    libsdl2-ttf-2.0-0 \
    libfreetype6 \
    libportmidi0 \
    libasound2 \
    libpulse0 \
    libx11-6 \
    libxext6 \
    libxrender1 \
    libgl1-mesa-glx \
    x11-utils \
    x11-apps \
    xauth \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy dependency definition and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy complete game source code and assets
COPY game/ ./game/
COPY assets/ ./assets/
COPY main.py .
COPY README.md .

# Default execution command
ENTRYPOINT ["python", "main.py"]
