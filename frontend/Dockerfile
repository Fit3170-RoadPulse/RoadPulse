# RoadPulse/frontend/Dockerfile
FROM node:20

WORKDIR /usr/src/app

# install deps using lockfile if present
COPY package*.json ./
RUN npm ci || npm install

# copy the rest (for prod builds; for dev, compose will mount your code)
COPY . .

EXPOSE 5173
CMD ["npm","run","dev","--","--host"]