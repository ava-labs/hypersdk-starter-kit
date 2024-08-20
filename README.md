# HyperSDK Starter

This repository is intended to provide a starter template for HyperSDK developers. Fork this repository and start building your HyperSDK-based Avalanche L1.

## Develop VM locally
TODO: TBD after HyperSDK API is more stable

## Launch a local devnet
This will launch a local devnet and a faucet, but not the reverse proxy. So you will be access itt flom locahost.
1. `cd deploy`
2. `docker compose up -d --build`

After around 5 minutes, if everthing is correct, try opening [http://localhost:8765/faucet/morpheus1qqgvs58cq6f0fv876f2lccay8t55fwf6vg4c77h5c3h4gjruqelk5srn9ds](http://localhost:8765/faucet/morpheus1qqgvs58cq6f0fv876f2lccay8t55fwf6vg4c77h5c3h4gjruqelk5srn9ds) to test the faucet. 

Monitor logs using `docker compose logs -f`. Once the devnet is operational, you'll see a message `Devnet started` in the logs.

Now you can `cd web_wallet` and run `npm install` and `npm run dev` to test the web wallet. It will point to the local devnet. Don't forget to proxy ports 8765 and 9650 if you work in codespaces or devcontainers.

## Deploy a devnet on a remote server
The `deploy` folder already contains all you need to get started. You'll need a VM with at least one vCPU and 2 GB of RAM.
1. `cd deploy`
2. `cp .env.example .env`
3. Set variable `SERVE_DOMAIN` in `.env` file to the domain you want to use for your devnet. 
4. Make sure the domain in `SERVE_DOMAIN` is pointing to the IP address of the server you're deploying to. If you are using AWS, you can use `ec2-1-2-3-4.region.compute.amazonaws.com` kind of domain, otherwise just point any domain to the server using A record.
5. Install docker on the remote host
6. `export DOCKER_HOST=ssh://remoteUser@remoteHost`. Replace `remoteUser` with the user name of the remote host and `remoteHost` with the IP address of the remote host.
7. `docker compose up -d --build proxy`. This will build the docker image and deploy it to the remote host.

## HyperSDK VM
The example VM is based on MorpheusVM, but a sample VM code will only be included in this repository once the HyperSDK API is a bit more stable.

## Faucet
To deploy a devnet/testnet you'll need a way to distribute tokens to users.

Currently the faucet drips 10 tokens to an address in the URL, for example `http://localhost:8765/faucet/morpheus1qqgvs58cq6f0fv876f2lccay8t55fwf6vg4c77h5c3h4gjruqelk5srn9ds`.

To launch a faucet locally:
1. Launch a local devnet only, so `localhost:9650` is accessible. `cd deploy`, then `docker compose up -d --build devnet`
2. Make sure the docker-based faucet is not running. `docker compose down faucet` from `deploy` folder
3. `export FAUCET_PRIVATE_KEY_HEX=323b1d8f4eed5f0da9da93071b034f2dce9d2d22692c172f3cb252a64ddfafd01b057de320297c29ad0c1f589ea216869cf1938d88c9fbd70d6748323dbf2fa7`
4. `go run ./cmd/faucet/`
5. Open `http://localhost:8766/faucet/morpheus1qqgvs58cq6f0fv876f2lccay8t55fwf6vg4c77h5c3h4gjruqelk5srn9ds`

## TODO:
- validate minimal requirements of machine
- The faucet deployment relies on the default Morpheus private key `323b1d8f4eed5f0da9da93071b034f2dce9d2d22692c172f3cb252a64ddfafd01b057de320297c29ad0c1f589ea216869cf1938d88c9fbd70d6748323dbf2fa7`. This should be changed to a randomly generated one later.
- Simplify web_wallet example to include minimal dependencies, preferably without any compilation and frontend frameworks like react. We have to focus on communcation with chain and wallet. TBD if we need react or not here.
- limit RPC requests to non-public methods (admin, etc)
- add a devcontainer with ports 8765 and 9650 exposed