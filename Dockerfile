FROM jdxcode/mise:2026.11.2-debian@sha256:84bb97455fe918f3b805520f9a7b1fd3060085a4ccc757a3ab17fa2e946df46e AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY .config .config
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm ci -P

COPY . .
RUN pnpm run gen-licenses && pnpm run build


FROM node:26.13.1-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build app/.output/ ./
EXPOSE 3000
ENV DOCKER=true
CMD ["node", "./server/index.mjs"]
