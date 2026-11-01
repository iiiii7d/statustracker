FROM jdxcode/mise:2026.10.20-debian@sha256:98d379dcc6291d6dfa09614003e88b864430a6120ca0fea2917d6f03eb60af4d AS build
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


FROM node:26.12.1-slim@sha256:94816674c62774da0d099a947bf4613b9e1972a2733abd0d0cd80e795f8411d0
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build app/tracker/dist/ ./
ENV DOCKER=true
CMD ["node", "./tracker.js"]
