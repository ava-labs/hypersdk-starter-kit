DEVNET_PORT_ID = "devnet"
FAUCET_PORT_ID = "faucet"
FRONTEND_PORT_ID = "frontend"
# FIXME: do we need those?

def run(plan):
    # TODO: generate an address and private key
    # docker build -f ./Dockerfile.keygen -t keygen .
    # const [privateKey, address] = $(docker run keygen).split("\n")
    # run container once, grab output

    # TODO: set env to the address to prefund
    devnet = plan.add_service(
        name = "devnet",
        config = ServiceConfig(
            image = ImageBuildSpec(
                image_name="devnet",
                build_context_dir="./",
                build_file="Dockerfile.devnet",
                build_args={},
            ),
            ports = {
                DEVNET_PORT_ID: PortSpec(9650, application_protocol = "http"),
            },
            env_vars = {
                "HELLO": "WORLD",
                "PREFUND_ADDRESS":"morpheus1qrzvk4zlwj9zsacqgtufx7zvapd3quufqpxk5rsdd4633m4wz2fdjk97rwu",
            },
            # TODO: add healthcheck
        ),
    )
    # TODO: wait till devnet is healthy
    # [ "CMD", "curl", "-X", "POST", "http://localhost:9650/ext/bc/hypervm/coreapi", "-H", "Content-Type: application/json", "-d", "{\"jsonrpc\":\"2.0\",\"method\":\"hypersdk.network\",\"params\":{},\"id\":1}" ]

    faucet = plan.add_service(
        name = "faucet",
        config = ServiceConfig(
            image = ImageBuildSpec(
                image_name="faucet",
                build_context_dir="./",
                build_file="Dockerfile.faucet",
                build_args={},
            ),
            ports = {
                FAUCET_PORT_ID: PortSpec(8765, application_protocol = "http"),
            },
            env_vars = {
                # TODO: generate a random private key and address
                "FAUCET_PRIVATE_KEY_HEX": "323b1d8f4eed5f0da9da93071b034f2dce9d2d22692c172f3cb252a64ddfafd01b057de320297c29ad0c1f589ea216869cf1938d88c9fbd70d6748323dbf2fa7",
                "RPC_ENDPOINT": "http://devnet:9650",#FIXME: is host devnet correct?
            },
        ),
    )

    frontend = plan.add_service(
        name = "frontend",
        config = ServiceConfig(
            image = ImageBuildSpec(
                image_name="frontend",
                build_context_dir="./",
                build_file="Dockerfile.frontend",
                build_args={},
            ),
            ports = {
                FRONTEND_PORT_ID: PortSpec(5173, application_protocol = "http"),
            },
            # TODO: add healthcheck
        ),
    )   
    