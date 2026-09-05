FROM python:3.10-slim AS builder

# Install Node.js for building React
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app
COPY . .

# Build React Frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Setup Python Backend
WORKDIR /app
RUN pip install --no-cache-dir -r requirements.txt

# Expose port and run FastAPI
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

