# DoAW — "Death of A Wallet", Joan Heemskerk.
#
# One image, two processes, mirroring the droplet:
#
#   server/app.js     metadata + static files + the rendered GIFs   (port 3003)
#   listen/listen.js  watches the contract for mints and renders    (no port)
#
# They are not separable. The renderer drives a headless browser against
# gif.html, which only the server serves, so it needs the server on localhost;
# and both read and write the same gifs/ directory, which on Fly is one volume
# that only one machine can mount. The droplet runs them as two PM2 processes on
# one box for the same reasons.
#
# The droplet happens to run the server on Node 14 and the listener on Node 18.
# Nothing depends on that split — the server is express and string manipulation
# with no native modules — so both run on 18 here, confirmed by scripts/parity.js
# (55 checks: metadata bodies, GIF bytes, the static bundle, and error bodies).
#
# bullseye, not bookworm: the renderer shells out to gifsicle to optimise every
# GIF it produces, and the droplet's gifsicle is 1.92. bullseye ships 1.92;
# bookworm ships 1.93. Viper's render image is bookworm for the mirror-image
# reason — that droplet has 1.93. The base image is a version pin here.
#
# dist/ is vendored because package.json declares `postinstall: webpack --mode
# production`, so an install rebuilds the bundle and the droplet's output cannot
# be reproduced from source.
FROM node:18-bullseye-slim

# Chromium 78's runtime libraries. puppeteer downloads the browser itself during
# npm install; these are what that binary dynamically links against.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git gosu gifsicle \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
      libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
      libpango-1.0-0 libcairo2 libatspi2.0-0 libx11-6 libxcb1 libxext6 \
      libxss1 libgtk-3-0 fonts-liberation \
      libx11-xcb1 libxtst6 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY fly/package.doaw.json ./package.json
# --ignore-scripts is required, not tidiness: doaw-contracts is a git dependency
# whose prepare step builds the contracts (ganache and all), which fails in this
# image and is not wanted anyway — only its ABI and addresses are read.
# Chromium is therefore fetched explicitly afterwards, since suppressing scripts
# also suppresses puppeteer's own installer.
RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts \
 && node node_modules/puppeteer/install.js \
 && apt-get purge -y git && apt-get autoremove -y

# server/index.js requires ../listen/utils.js for parseTokenId, so listen/ is
# needed even by a server-only run. Omitting it is how the first deploy of this
# image built cleanly, deployed cleanly, and then crash-looped on MODULE_NOT_FOUND.
COPY server ./server
COPY listen ./listen
COPY public ./public
COPY vendor/doaw-dist/ ./dist/
COPY fly/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh && chown -R node:node /app

ARG GIT_SHA=unknown
ARG GIT_DIRTY=false
ARG BUILD_TIME=
ENV GIT_SHA=$GIT_SHA GIT_DIRTY=$GIT_DIRTY BUILD_TIME=$BUILD_TIME

ENV NODE_ENV=production PORT=3003
EXPOSE 3003
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
