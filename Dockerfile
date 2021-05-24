FROM node:10.23 AS build
ARG app_version=0.0.0
RUN apt-get update \
    && apt-get install --yes --no-install-recommends make build-essential
WORKDIR /home/node
COPY ./ .
RUN npm install && npm run build

FROM nginx:1.17.10-alpine
EXPOSE 8080
RUN sed -i 's/listen\(.*\)80;/listen 8080;/' /etc/nginx/conf.d/default.conf && \
    sed -i 's/^user/#user/' /etc/nginx/nginx.conf
COPY --from=build /home/node/build/out /usr/share/nginx/html
