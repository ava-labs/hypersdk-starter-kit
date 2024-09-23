# HyperSDK Starter

## 0. Prerequisites
- Install [Metamask Flask](https://chromewebstore.google.com/detail/metamask-flask-developmen/ljfoeinjpaedjfecbmggjgodbgkmjkjk) and disable normal Metamask, Core wallet, and any other wallets.
- Install Golang and a fresh NodeJS.
- This has not been tested on native Mac; everything is run in a devcontainer.
- ~~`go run ./cmd/keygen/`. It will fill the necessary env variables in the `.env` file. The faucet will not work without it.~~

## 1. Start the Whole Stack

Run: `docker compose pull && docker compose up -d --build devnet faucet frontend explorer`. Might take 5 minutes to download dependencies.

For devcontainers or codespaces, forward ports 8765 for faucet, 9650 for the chain, 5173 for the frontend, and 3000 for the explorer.

Open [http://localhost:5173](http://localhost:5173) to see the frontend. Play around with it. Try both the Temporary key and Metamask snap (from npm, not local).

That's how it should look with Metamask Snap signing:

![Screenshot](assets/screenshot.png)

This is the explorer:

![Screenshot](assets/explorer.png)


You can access the explorer at [http://localhost:3000](http://localhost:3000).

BTW a relatively fresh version should be deployed at [https://ec2-18-224-139-0.us-east-2.compute.amazonaws.com/](https://ec2-18-224-139-0.us-east-2.compute.amazonaws.com/)

When finished, shut everything down with: `docker compose down`

## 2. Develop a VM

To develop or port new actions:
1. Add them in the `actions/` folder.
2. Register them in `vm/vm.go`.
3. Rebuild the stack with: `docker compose up -d --build devnet faucet frontend explorer`

There are read-only and read-write actions. Ensure actions have `***Result` types defined in `vm/vm.go`. Use read-only actions instead of RPC API.

By the way, the Go code depends on the [`read-only-actions` branch](https://github.com/ava-labs/hypersdk/tree/read-only-actions) of HyperSDK. So copy-pasting actions would not work; you'll need to define the return types.

## 3. Develop a Frontend
1. Bring down the frontend container: `docker compose down`
2. Start only the devnet, faucet, and explorer: `docker compose up -d --build devnet faucet explorer`
3. Navigate to the web wallet: `cd web_wallet`
4. Install dependencies and start the dev server: `npm i && npm run dev`

Ensure ports `8765` (faucet), `9650` (chain), `5173` (frontend), and `3000` (explorer) are forwarded.

Note that most functionality depends on the `hypersdk-client` npm package.

## 4. Publish on a remote server
1. Set `DOCKER_HOST` to your server's IP.
2. Set the `SERVE_DOMAIN` variable in the `.env` file in your project's directory to your domain.
3. Run `docker compose up -d --build proxy`. That will do the trick. That's it.

## Notes
- You can launch everything without Docker:
  - Faucet: `go run ./cmd/faucet/`
  - Chain: `./scripts/run.sh`
  - Frontend: `npm run dev` in `web_wallet`
  - Explorer: Use the provided Docker image or set up your own instance
- Be aware of potential port conflicts if issues arise. `docker rm -f $(docker ps -a -q)` is your friend.
- To update the explorer image, run `docker compose pull explorer` before starting the stack.
- To release on a remote machine, set `export DOCKER_HOST="ssh://username@ip"` and run `docker compose pull && docker compose up -d --build proxy`.