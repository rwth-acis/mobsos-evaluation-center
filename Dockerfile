# base image
FROM node:12.2.0

# set working directory
WORKDIR /app
COPY docker-entrypoint.sh ./

RUN git clone https://github.com/rwth-acis/mobsos-evaluation-center.git -b develop
WORKDIR /app/mobsos-evaluation-center
# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/mobsos-evaluation-center/node_modules/.bin:$PATH
RUN npm install
RUN npm install -g @angular/cli@7.3.9

EXPOSE 4200
ENTRYPOINT ["/app/docker-entrypoint.sh"]