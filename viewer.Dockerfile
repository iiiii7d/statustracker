FROM jdxcode/mise:2026.11.7-debian@sha256:0e4c7634244a6e09b99bf2b5aa2934d29837c400a6af53dd6fb3690b92b1d31f AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY ./.config .config
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY viewer/package.json package.json pnpm-lock.yaml pnpm-workspace.yaml ./
WORKDIR /app/viewer
RUN pnpm ci

COPY viewer/ .
COPY shared/ ../shared
COPY tsconfig.json ..
RUN pnpm run gen-licenses && pnpm run build


FROM node:26.13.1-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build /app/viewer/.output/ ./
EXPOSE 3000
ENV DOCKER=true
CMD ["node", "./server/index.mjs"]
