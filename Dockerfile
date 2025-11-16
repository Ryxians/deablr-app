FROM oven/bun:1.3.2
WORKDIR /usr/src/app

COPY . .


RUN bun install

EXPOSE 3000
ENV NODE_ENV = production
CMD ["bun", "server/index.ts"]