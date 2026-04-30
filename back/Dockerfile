FROM node:20-alpine

WORKDIR /app

# Install netcat for entrypoint healthchecks
RUN apk add --no-cache netcat-openbsd

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose backend port
EXPOSE 4000

# Entrypoint for migrations/seeds if needed
RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
