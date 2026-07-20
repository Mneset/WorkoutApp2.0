FROM node:20-alpine AS build
WORKDIR /app
COPY workoutLoggerFrontend/package*.json ./
RUN npm install
COPY workoutLoggerFrontend/ ./
ARG REACT_APP_API_BASE_URL=/api/v1
ARG REACT_APP_API_AUDIENCE
ARG REACT_APP_ACCESS_DOMAIN
ARG REACT_APP_ACCESS_CLIENT_ID
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_API_AUDIENCE=$REACT_APP_API_AUDIENCE
ENV REACT_APP_ACCESS_DOMAIN=$REACT_APP_ACCESS_DOMAIN
ENV REACT_APP_ACCESS_CLIENT_ID=$REACT_APP_ACCESS_CLIENT_ID
RUN npm run build

FROM nginx:alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/build /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]