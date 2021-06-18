FROM node:16
WORKDIR /src
COPY . /src
RUN npm ci
EXPOSE 1234
CMD [ "npm","start" ]