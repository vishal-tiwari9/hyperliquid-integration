FROM rust:1.80-slim as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/proxy-hl-engine /usr/local/bin/proxy-hl-engine
["proxy-hl-engine"]
