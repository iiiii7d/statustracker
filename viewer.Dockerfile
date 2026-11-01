FROM jdxcode/mise:2026.10.23-debian@sha256:500fb7751d822969b59f8d15a639d89438a3f27bf9ee23cc5d363190839733ac AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY ./.config .config
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY viewer/package.json viewer/pnpm-lock.yaml pnpm-workspace.yaml ./
WORKDIR /app/viewer
RUN pnpm i -P

COPY viewer/ .
COPY shared/ ../shared
COPY tsconfig.json ..
RUN pnpm run gen-licenses && pnpm run build


FROM node:26.12.1-slim@sha256:94816674c62774da0d099a947bf4613b9e1972a2733abd0d0cd80e795f8411d0
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build /app/viewer/.output/ ./
EXPOSE 3000
ENV DOCKER=true
CMD ["node", "./server/index.mjs"]
