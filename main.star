DEVNET_PORT_ID = "devnet"

def run(plan):
    # TODO: generate an address and private key
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
            },
        ),
    )
    # TODO: wait till devnet is healthy
    