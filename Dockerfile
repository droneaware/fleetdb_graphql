FROM node:8 AS base

FROM fleetdb_fleetdb as fleetdb 

FROM base as dependencies

# Create app directory
WORKDIR /usr/src/app

COPY --from=fleetdb /usr/src/app/models /usr/src/app/models

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install --production

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
