FROM debian:13.7-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

# renovate: datasource=deb depName=sudo
ENV SUDO_VERSION="1.9.16p2-3"
# renovate: datasource=deb depName=curl
ENV CURL_VERSION="8.14.1-2"
# renovate: datasource=deb depName=git
ENV GIT_VERSION="1:2.47.3-0"
# renovate: datasource=deb depName=ca-certificates
ENV CA_CERTIFICATES_VERSION="20250419"
# renovate: datasource=deb depName=build-essential
ENV BUILD_ESSENTIAL_VERSION="12.12"

RUN apt-get update && apt-get install -y --no-install-recommends \
    sudo="${SUDO_VERSION}" \
    curl="${CURL_VERSION}" \
    git="${GIT_VERSION}" \
    ca-certificates="${CA_CERTIFICATES_VERSION}" \
    build-essential="${BUILD_ESSENTIAL_VERSION}" \
    && rm -r /var/lib/apt/lists/* && apt-get clean

ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"
# renovate: datasource=github-tags depName=jdx/mise
ENV MISE_VERSION="v2026.10.11"
ENV MISE_ENV=""
RUN curl https://mise.run | sh

COPY ./.config .config
RUN mise trust && mise install && eval "$(mise activate bash)"

COPY tracker/package.json tracker/pnpm-lock.yaml pnpm-workspace.yaml ./
WORKDIR /app/tracker
RUN pnpm i -P

COPY tracker/ .
COPY shared/ ../shared
COPY tsconfig.json ..
RUN pnpm run build


FROM node:26.12.0-slim@sha256:e556a144463cc8dc53afe8de6d2fa0db5c132fd39ffa232c17641bd40df2bf11
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

COPY --from=build app/tracker/dist/ ./
ENV DOCKER=true
CMD ["node", "./tracker.js"]
