FROM debian:13.6-slim@sha256:d7e12182ce18b85b93007c1dedf31f2d29e01ccf3182cc4017c709b6259bc132 AS build
WORKDIR /app
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

# renovate: datasource=deb depName=sudo
ENV SUDO_VERSION="1.9.16p2-3+deb13u2"
# renovate: datasource=deb depName=curl
ENV CURL_VERSION="8.14.1-2+deb13u5"
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
ENV MISE_VERSION="v2026.9.11"
ENV MISE_ENV=""
RUN curl https://mise.run | sh

COPY .config .config
RUN mise trust && mise install && eval "$(mise activate bash)"

ENV PUPPETEER_SKIP_DOWNLOAD="true"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm i -P

COPY . .
RUN pnpm run gen-licenses && pnpm run build


FROM node:26.8.2-slim@sha256:f7bb8247fdb16250dbec7fd0e24f091c6f5f0a29d256f3aef5816a7a369166b2
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
