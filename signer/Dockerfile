FROM node:22

WORKDIR /app

# Install dependencies
COPY validator_script.js .
COPY package.json .
COPY package-lock.json .

RUN npm install

ENTRYPOINT ["node", "validator_script.js"]
