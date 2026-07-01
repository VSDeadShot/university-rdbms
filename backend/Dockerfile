FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Since this is a typescript project and we want to keep it simple,
# we'll run it using ts-node directly in production for this portfolio app.
# A more optimized setup would compile to JS first.
# Install ts-node globally just in case
RUN npm install -g ts-node typescript

EXPOSE 5000

# Start the server using ts-node
CMD ["ts-node", "--esm", "server.ts"]
