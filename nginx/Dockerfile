FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=workoutapp20_frontend-build /app/build /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
