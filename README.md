# Shortlink service in MEAN and docker stack

This is the 2nd version of the previous [bosong.link](https://github.com/zjusbo/bosong.link) repo.

It shortens the orginal url with user provided customized links.

Demo: http://bosong.link

## Tech stack

- Database: MongoDB
- Server runtime: NodeJS
- Frontend framework: Angular
- Backend framework: Express
- Programming language: Typescript
- Deploying stack: Docker

## Code structure

- client: The client code, written in Angular/Typescript
- server: The server code, written in NodeJS/Express/Typescript
- config: (not published in this repo) the configuration file, containing credentials

### Server

#### Modules installed

- body-parser

  - Parse incoming json requests

- cors

  - cross origin resource sharing

- mongoose

  - the mongo database library

- nodemon

  - restarts the server when its code changes

- ts-node
  - compiles the node typescript code to javascript

#### notes

watching client file changes in development

`ng serve --host 0.0.0.0 --poll`

- **--poll** to monitor the file change aggressively in container. https://stackoverflow.com/questions/44176922/docker-container-doesnt-reload-angular-app and https://angular.io/cli/serve#arguments
- **--host 0.0.0.0** listen to all network interfaces. This is needed when client webkit is built within container

## Data migration commands

### Exports Mysql data to csv

`select <..column_names> from <table> into outfile '<output_filepath>' fields enclosed by '"' terminated by ',';`

make sure the output_filepath is contained in the secure_file_priv path so that the mysql server could read from and write to. Run the following command in mysql cli to check the secure_file_priv value.

`show variables like "secure_file_priv"`

### Import csv data to mongoDB

`mongoimport --type csv -d <db_name> -c <collection_name> --headerline --drop -u <db_username> -p <db_password> <csv_file>`

- **-d** databse name
- **-c** collection name
- **-headerline** the first row in the csv file is headerline
- **-u -p** databse username and password

## Development workflow

### How to develop it at your local machine

1. Install docker and docker-compose
2. run `./start.sh`
3. access your service at http://localhost:4200

The script starts up two containers, mongo container and code container. The mongo container contains the running mongoDB service. The code container has two commands running concurrently. One command starts the server listening at port 3000. The other command starts the angular clients listening at port 4200.

### How to deploy the project to production

1. Prepare a docker-compose.yml file at your server machine

A sample docer-compose.yml file looks like the following. Make sure to set your own db username and password.

```
# docker-compose.yml
# Production configuration
# WARNING: Do not push this file to public. This compose file contains sensitive configuration
# Please use secure file transfer protocol to transfer this file to your server
# then run
# $ docker-compose up
# to depoly the service
version: "3.7"
services:
  app:
    image: "sbdxxcjh/shortlink"
    command: node index.js
    ports:
      - 80:3000 # map host 80 port to container 3000 port
    working_dir: /app
    volumes:
      - ./config/short-link-service-281615-f8909019adc5.json:/app/short-link-service-281615-f8909019adc5.json:ro
    environment:
      MONGO_HOST: mongo # This should be the same as the databse service name in this file
      MONGO_USERNAME: root # This should keep the same as that in the init-mongo.js file
      MONGO_PASSWORD: secret
      MONGO_DB: links # keep it the same as the MONGO_INITDB_DATABASE
      GOOGLE_APPLICATION_CREDENTIALS: ./<service_account_credential.json> # path to the google service account credential file
    depends_on:
      - mongo # only starts the app server after all its dependencies are ready.

  mongo: # This is the service name as well as the network alias/hostname
    image: "mongo"
    container_name: "my-mongo-container"
    environment:
      - MONGO_INITDB_DATABASE=links # this is the DB the inti-mongo.js will run on
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=secret
    volumes:
      - ./config/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro # init username and password for webapp
      - ./config/data.csv:/app/data.csv:ro # data.csv contains the prefilled data. To populate data.csv into the DB, please run the following command
      - mongo-volume:/data/db
    ports:
      - "27017-27019:27017-27019"
volumes:
  mongo-volume:
```

2. Set up your own init-mongo.js file

This file is to create the user on the links database. It shall looks like the following

```
db.createUser({
  user: "root",
  pwd: "secret",
  roles: [
    {
      role: "readWrite",
      db: "links",
    },
  ],
});
```

3. (optional) download your google service account credential and save it, and config the GOOGLE_APPLICATION_CREDENTIALS to point to the path.

4. build and push the image `docker build . -t shortlink && docker push shortlink`

5. On your server machine, run `docker-compose up -d`
