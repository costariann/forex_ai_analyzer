FROM node:18.0.0-alpine3.15
WORKDIR /app
COPY package*.json ./

# Set npm configurations for better network reliability
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-timeout 600000 \
    && npm config set fetch-retries 5 \
    && npm config set network-timeout 600000 \
    && npm install

COPY . .
EXPOSE 3005
CMD npm start