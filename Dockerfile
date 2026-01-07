# ==============================
# STAGE 1: Base (Node 20 LTS)
# ==============================
FROM node:20-bullseye-slim AS base
WORKDIR /home/dev/app

# Install app dependencies first for caching
COPY ./app/package.json ./app/yarn.lock* ./
RUN yarn install --frozen-lockfile

# ==============================
# STAGE 2: Development (Lightweight)
# ==============================
FROM base AS dev
EXPOSE 8081
# Modern Metro port for Expo SDK 53+
CMD ["npx", "expo", "start"]

# ==============================
# STAGE 3: Production & Deployment (Heavy)
# ==============================
FROM base AS prod

# 1. Install 2025 Mandatory Tools (JDK 17 required for RN 0.76+)
USER root
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk git curl unzip wget build-essential ruby-full \
    && rm -rf /var/lib/apt/lists/*

# 2. Global Tooling (EAS CLI for Cloud/Local Builds)
RUN npm install -g eas-cli

# 3. Android SDK 35 Setup (Google Play mandatory for 2025)
ENV ANDROID_SDK_ROOT=/usr/local/android-sdk
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && \
    wget -O cmd.zip "dl.google.com" && \
    unzip cmd.zip -d ${ANDROID_SDK_ROOT}/cmdline-tools && \
    mv ${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest && \
    rm cmd.zip

ENV PATH="${PATH}:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools"

# Accept licenses and install 2025 SDK components
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

# 4. Permissions & User Security
ENV USERNAME=dev
RUN useradd -m -s /bin/bash ${USERNAME} && chown -R ${USERNAME} /home/dev/app
USER ${USERNAME}
ENV NPM_CONFIG_PREFIX=/home/dev/.npm-global
ENV PATH=/home/dev/.npm-global/bin:$PATH
