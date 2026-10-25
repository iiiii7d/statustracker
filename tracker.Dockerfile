FROM jdxcode/mise:2026.10.19-debian AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY ./.config .config
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY tracker/package.json tracker/pnpm-lock.yaml pnpm-workspace.yaml ./
WORKDIR /app/tracker
RUN pnpm i -P

COPY tracker/ .
COPY shared/ ../shared
COPY tsconfig.json ..
RUN pnpm run build


FROM node:26.12.1-slim@sha256:36793bcbb160a6a16cede1e62b93f84e26b78a972a8a4c0b879c1c12f22761ec
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build app/tracker/dist/ ./
ENV DOCKER=true
CMD ["node", "./tracker.js"]
