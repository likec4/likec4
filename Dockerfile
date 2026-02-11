# Stage 1: Build Graphviz
FROM node:22.22.0-bookworm AS graphviz

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV DEBIAN_FRONTEND=noninteractive

# Build Graphviz from source because there are no binary distributions for recent versions
# Copied from https://github.com/plantuml/plantuml/blob/51f3b45e37735085a87dff9eb1a0cf986f9719d2/Dockerfile
ARG GRAPHVIZ_VERSION
ARG GRAPHVIZ_BUILD_DIR=/tmp/graphiz-build
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        build-essential \
        jq \
        libexpat1-dev \
        libgd-dev \
        zlib1g-dev \
        curl \
        cmake \
        pkg-config \
        libtool && \
    mkdir -p $GRAPHVIZ_BUILD_DIR && \
    cd $GRAPHVIZ_BUILD_DIR && \
    GRAPHVIZ_VERSION=${GRAPHVIZ_VERSION:-$(curl -s https://gitlab.com/api/v4/projects/4207231/releases/ | jq -r '.[] | .name' | sort -V -r | head -1)} && \
    echo "Graphviz version: $GRAPHVIZ_VERSION" && \
    curl -o graphviz.tar.gz https://gitlab.com/api/v4/projects/4207231/packages/generic/graphviz-releases/${GRAPHVIZ_VERSION}/graphviz-${GRAPHVIZ_VERSION}.tar.gz && \
    tar -xzf graphviz.tar.gz && \
    cd graphviz-$GRAPHVIZ_VERSION && \
    ./configure && \
    make && \
    make install DESTDIR=/install && \
    ldconfig

# Stage 2: Create runner image
FROM node:22.22.0-bookworm-slim AS runner

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV DEBIAN_FRONTEND=noninteractive

# Copy Graphviz binaries
COPY --from=graphviz /install /

ARG PLAYWRIGHT_VER=1.56.1
# Install runtime dependencies
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        fonts-dejavu \
        libexpat1 \
        libgd3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libcairo2 \
        libglib2.0-0 \
        libltdl7 \
        libpango-1.0-0 \
        libgts-bin \
        libgtk2.0-bin \
        curl && \
    # Verify installation
    dot -V && \
    dot -c && \
    # Install Playwright
    npx -y playwright@${PLAYWRIGHT_VER} install chromium --with-deps && \
    apt-get autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /root/.npm

# Install LikeC4
ENV NODE_ENV=production
ARG LIKEC4_VER=latest
RUN npm install -g likec4@${LIKEC4_VER} && \
    rm -rf /root/.npm

WORKDIR /data

ENTRYPOINT ["/usr/local/bin/likec4"]
CMD ["-h"]

# Default ports
EXPOSE 5173 24678
