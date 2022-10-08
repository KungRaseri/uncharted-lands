FROM node:16-alpine as build-stage
WORKDIR /app

COPY [".", "./"]
RUN npm install
RUN npm run build

FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/build /usr/share/nginx/html
COPY --from=build-stage /app/.env.docker /usr/share/nginx/html/.env
EXPOSE 80
EXPOSE 443

CMD [ "nginx", "-g", "daemon off;" ]