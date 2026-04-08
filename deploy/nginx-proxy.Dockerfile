FROM nginx:1.27-alpine

COPY deploy/app-vm.nginx.conf /etc/nginx/conf.d/default.conf
