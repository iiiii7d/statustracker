FROM jdxcode/mise:2026.11.10-debian@sha256:e2efdfd1243dfa8f24831208ab4d91ef811d0640f8ead9e25aa604307961a019 AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]
ENV NODE_ENV="production"

COPY ./.config .config
ENV MISE_ENV=""
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY tracker/package.json package.json pnpm-lock.yaml pnpm-workspace.yaml ./
WORKDIR /app/tracker
RUN pnpm ci -P

COPY tracker/ .
COPY shared/ ../shared
COPY tsconfig.json ..
RUN pnpm run build


FROM node:26.13.1-slim@sha256:abe7e5a82b61a8ef67b315b85497c9e65173387ccf2f4a029248184b8e020be5
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]
ENV NODE_ENV="production"

COPY --from=build app/tracker/dist/ ./
CMD ["node", "./tracker.js"]
