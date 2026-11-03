FROM jdxcode/mise:2026.10.24-debian@sha256:a884cf3fced76edd72e2c25d0b173cd22ab24cda099a49f85a9088369748cc01 AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY .config .config
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm i -P

COPY . .
RUN pnpm run gen-licenses && pnpm run build


FROM node:26.13.0-slim@sha256:e4db4c914bf8ad241bd24804fc25d272d89bad97e68cdc8a1414862790a02c39
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build app/.output/ ./
EXPOSE 3000
ENV DOCKER=true
CMD ["node", "./server/index.mjs"]
