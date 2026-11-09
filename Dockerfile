FROM jdxcode/mise:2026.11.2-debian@sha256:84bb97455fe918f3b805520f9a7b1fd3060085a4ccc757a3ab17fa2e946df46e AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY .config .config
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm i -P

COPY . .
RUN pnpm run gen-licenses && pnpm run build


FROM node:26.13.0-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build app/.output/ ./
EXPOSE 3000
ENV DOCKER=true
CMD ["node", "./server/index.mjs"]
