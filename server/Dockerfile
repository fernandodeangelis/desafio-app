FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# Crear carpeta de uploads por si no existe
RUN mkdir -p uploads
EXPOSE 3000
CMD ["npm", "start"]