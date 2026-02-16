FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

# instala todo, no solo production
RUN npm install   

COPY . .

RUN npm run build

EXPOSE 8080
CMD ["npm", "start"]
