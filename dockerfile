FROM node:14
RUN mkdir /app
WORKDIR /app
ADD dist ./dist
ADD index.js package.json package-lock.json ./
RUN npm install --production
CMD ["node", "index.js"]
