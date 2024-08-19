#####
# Source of precompiled avalanchego
#####
ARG INSTALL_AVALANCHEGO_VERSION_SHORT=d729e5c7
FROM avaplatform/avalanchego:${INSTALL_AVALANCHEGO_VERSION_SHORT} AS avalanchego

#####
# Base layer with hypersdk
#####
FROM golang:1.22-bookworm AS hypersdk-downloader

ENV GOMODCACHE /go/pkg/mod

WORKDIR /

# latest commit from https://github.com/ava-labs/hypersdk/tree/containerman17/morpheus-faucet
RUN git clone https://github.com/ava-labs/hypersdk.git \
    && cd /hypersdk \
    && git checkout 45735c4

WORKDIR /hypersdk/examples/morpheusvm

#####
# Build the faucet
#####

FROM hypersdk-downloader AS faucet-builder

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -o build/morpheus-faucet ./cmd/morpheus-faucet

#####
# Final layer with faucet, VM and avalanchego
#####
FROM hypersdk-downloader 
ARG INSTALL_AVALANCHEGO_VERSION=d729e5c7ef9f008c3e89cd7131148ad3acda2e34
COPY --from=avalanchego /avalanchego/build/avalanchego /tmp/hypersdk/avalanchego-${INSTALL_AVALANCHEGO_VERSION}/avalanchego

COPY --from=faucet-builder /hypersdk/examples/morpheusvm/build/morpheus-faucet /morpheus-faucet

ENTRYPOINT ["/bin/bash", "-c", "./scripts/stop.sh; ./scripts/run.sh && echo 'Subnet RPC started, starting faucet' && /morpheus-faucet"]