FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .

# Construir los bundles
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
