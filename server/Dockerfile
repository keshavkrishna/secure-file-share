# Use the official Python image
FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    python3-dev \
    gcc && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django project files
COPY . .

# Generate SSL certificates
RUN mkdir ./ssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./ssl/server.key -out ./ssl/server.crt -subj "/C=IN/ST=State/L=City/O=Organization/OU=Dev/CN=127.0.0.1"

# Expose the port for Django
EXPOSE 8000

# Run the Django server
CMD ["python", "manage.py", "runserver_plus", "0.0.0.0:8000", "--cert-file", "./ssl/server.crt", "--key-file", "./ssl/server.key"]
