FROM jdxcode/mise:2026.11.10-debian@sha256:e2efdfd1243dfa8f24831208ab4d91ef811d0640f8ead9e25aa604307961a019 AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]
ENV NODE_ENV="production"

COPY ./.config .config
ENV MISE_ENV=""
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY viewer/package.json package.json pnpm-lock.yaml pnpm-workspace.yaml ./
WORKDIR /app/viewer
RUN pnpm ci -P

COPY viewer/ .
COPY shared/ ../shared
COPY tsconfig.json ..
RUN pnpm run gen-licenses && pnpm run build


FROM node:26.13.1-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]
ENV NODE_ENV="production"

COPY --from=build /app/viewer/.output/ ./
EXPOSE 3000
CMD ["node", "./server/index.mjs"]
