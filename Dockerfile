FROM node:20.19.0-bullseye

WORKDIR /app

COPY package*.json .

RUN npm i

COPY src ./src

COPY client ./client

COPY .babelrc ./

COPY tsconfig.json ./

COPY webpack.config.js ./

RUN ls
RUN npm run build:ui

EXPOSE 3000

CMD [ "npm start" ]
