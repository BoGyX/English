#!/bin/bash

# Generate self-signed SSL certificate for development
mkdir -p nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=English Learning/CN=localhost"

echo "SSL certificates generated in nginx/ssl/"
echo "For production, replace with real certificates from Let's Encrypt"
