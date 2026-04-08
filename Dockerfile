FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=https://survey.bitsathy.ac.in/api
ARG VITE_FILE_BASE_URL=https://survey.bitsathy.ac.in
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FILE_BASE_URL=$VITE_FILE_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY deploy/frontend.default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
