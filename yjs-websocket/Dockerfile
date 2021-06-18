FROM node:16
WORKDIR /src
COPY . /src
RUN npm ci

CMD [ "node"," ./node_modules/y-websocket/bin/server.js PORT=1234" ]