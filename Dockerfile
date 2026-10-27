FROM jdxcode/mise:2026.10.19-debian@sha256:9b8995abd457c975a4f5150b423f6569ee5a01960662ffa4c06c859867e59a21 AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY .config .config
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm i -P

COPY . .
RUN pnpm run gen-licenses && pnpm run build


FROM node:26.12.1-slim@sha256:36793bcbb160a6a16cede1e62b93f84e26b78a972a8a4c0b879c1c12f22761ec
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build app/.output/ ./
EXPOSE 3000
ENV DOCKER=true
CMD ["node", "./server/index.mjs"]
