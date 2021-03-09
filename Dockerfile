# base image
FROM node:12.2.0

RUN apt-get update

RUN apt-get install dos2unix

# set working directory
WORKDIR /app

RUN chmod -R a+rwx /app
RUN chmod +x /app/docker-entrypoint.sh

COPY . .

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH
RUN NODE_OPTIONS="--max-old-space-size=8192" npm install 
RUN npm install -g @angular/cli@7.3.9
RUN dos2unix docker-entrypoint.sh

EXPOSE 4200
ENTRYPOINT ["/app/docker-entrypoint.sh"]
