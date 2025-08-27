FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /app/build /usr/share/nginx/html
