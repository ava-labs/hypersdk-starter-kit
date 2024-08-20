# HyperSDK Starter

This repository helps you start building your own blockchain using HyperSDK on Avalanche. You can fork this repository to begin.

## Develop VM locally
We will add instructions here later when the HyperSDK API is more stable.

## Start a local test network (devnet)
This will start a local test network and a faucet on your computer:
1. Go to the `deploy` folder: `cd deploy`
2. Start the services: `docker compose up -d --build`

Wait about 5 minutes. If everything works, open this link in your browser:
[http://localhost:8765/faucet/morpheus1qqgvs58cq6f0fv876f2lccay8t55fwf6vg4c77h5c3h4gjruqelk5srn9ds](http://localhost:8765/faucet/morpheus1qqgvs58cq6f0fv876f2lccay8t55fwf6vg4c77h5c3h4gjruqelk5srn9ds)

To see what's happening, use: `docker compose logs -f`
You'll see "Devnet started" when it's ready.

To test the web wallet:
1. Go to the `web_wallet` folder: `cd web_wallet`
2. Install dependencies: `npm install`
3. Start the wallet: `npm run dev`

The wallet will connect to your local test network.

If you're using Codespaces or devcontainers, make sure to forward ports 8765 and 9650.

## Set up a test network on a remote server
You need a server with at least 1 CPU and 2 GB of RAM.

1. Go to the `deploy` folder: `cd deploy`
2. Copy the example environment file: `cp .env.example .env`
3. In the `.env` file, set `SERVE_DOMAIN` to your domain name.
4. Make sure your domain points to your server's IP address.
5. Install Docker on your server.
6. Connect to your server's docker daemon: `export DOCKER_HOST=ssh://remoteUser@remoteHost`
   Replace `remoteUser` with your username and `remoteHost` with your server's IP.
7. Build and start the services: `docker compose up -d --build proxy`

The frontend will be deployed using GitHub Actions. Check your repository settings to enable Pages and get the URL.

## About the HyperSDK VM
We use a VM based on MorpheusVM. We'll add sample VM code later when the HyperSDK API is more stable.

## Faucet
The faucet gives out free tokens for testing. It gives 10 tokens to the address in the URL after the `/faucet/` path.

To run the faucet locally:
1. Start only the local test network: 
   - Go to `deploy` folder: `cd deploy`
   - Run: `docker compose up -d --build devnet`
2. Stop the Docker faucet if it's running: `docker compose down faucet`
3. Set the faucet's private key: 
   `export FAUCET_PRIVATE_KEY_HEX=323b1d8f4eed5f0da9da93071b034f2dce9d2d22692c172f3cb252a64ddfafd01b057de320297c29ad0c1f589ea216869cf1938d88c9fbd70d6748323dbf2fa7`
4. Start the faucet: `go run ./cmd/faucet/`
5. Test the faucet: Open this link in your browser:
   `http://localhost:8766/faucet/morpheus1qqgvs58cq6f0fv876f2lccay8t55fwf6vg4c77h5c3h4gjruqelk5srn9ds`

## Things to do:
- Check the minimum server requirements
- Change the default Morpheus private key to a new random one
- Make the web wallet example simpler
- Limit RPC requests to non-public methods
- Add a devcontainer with ports 8765 and 9650 open