FROM node:22-alpine

# Install mysql client, bash, and curl for healthchecks
RUN apk add --no-cache mysql-client bash curl

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Make scripts executable
RUN chmod +x entrypoint.sh wait-for-mysql.sh

EXPOSE 3000

# Use entrypoint for better startup control
ENTRYPOINT ["./entrypoint.sh"]
CMD ["mysql"]

