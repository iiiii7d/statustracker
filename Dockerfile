FROM debian:13.6-slim@sha256:3a39a0592364683e6bab97937b72cad5a8fa6dcbbee90edb3bb48c7f8e94f258 AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

# renovate: datasource=deb depName=sudo
ENV SUDO_VERSION="1.9.16p2-3+deb13u2"
# renovate: datasource=deb depName=curl
ENV CURL_VERSION="8.14.1-2+deb13u4"
# renovate: datasource=deb depName=git
ENV GIT_VERSION="1:2.47.3-0+deb13u1"
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
ENV MISE_VERSION="v2026.8.2"
ENV MISE_ENV=""
RUN curl https://mise.run | sh

COPY .config .config
RUN mise trust && mise install --system

ENV PUPPETEER_SKIP_DOWNLOAD="true"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm i -P

COPY . .
RUN pnpm run gen-licenses && pnpm run build


FROM node:26.5.1-slim@sha256:deae974a69e140f44f434ab29cb519fb5f8fe250fd364b8ca446bd0761acdc6a
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]
# renovate: datasource=deb depName=gnupg
ENV GNUPG_VERSION="2.4.7-21+deb13u1"
# renovate: datasource=deb depName=wget
ENV WGET_VERSION="1.25.0-2"
# renovate: datasource=deb depName=ca-certificates
ENV CA_CERTIFICATES_VERSION="20250419"

# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends gnupg="${GNUPG_VERSION}" wget="${WGET_VERSION}" ca-certificates="${CA_CERTIFICATES_VERSION}" && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/* && apt-get clean

COPY --from=build app/.output/ ./
EXPOSE 3000
ENV DOCKER=true
CMD ["node", "./server/index.mjs"]
