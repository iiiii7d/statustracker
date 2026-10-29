FROM jdxcode/mise:2026.10.20-debian@sha256:98d379dcc6291d6dfa09614003e88b864430a6120ca0fea2917d6f03eb60af4d AS build
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


FROM node:26.12.1-slim@sha256:36793bcbb160a6a16cede1e62b93f84e26b78a972a8a4c0b879c1c12f22761ec
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build /app/viewer/.output/ ./
EXPOSE 3000
ENV DOCKER=true
CMD ["node", "./server/index.mjs"]
