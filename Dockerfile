# base image
FROM node:12.2.0

# set working directory
WORKDIR /app
COPY . .

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH
RUN npm install
RUN npm install -g @angular/cli@7.3.9

EXPOSE 4200
ENTRYPOINT ["/app/docker-entrypoint.sh"]