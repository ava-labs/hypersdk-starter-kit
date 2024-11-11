# HyperSDK Starter Kit

HyperSDK Starter includes:
- Boilerplate VM based on [MorpheusVM](https://github.com/ava-labs/hypersdk/tree/main/examples/morpheusvm)
- Universal frontend
- Metamask Snap wallet
- A quick start guide (this document)

## Prerequisites
- Docker (recent version)
- Optional: Golang v1.22.5+
- Optional: NodeJS v20+
- Optional: [Metamask Flask](https://chromewebstore.google.com/detail/metamask-flask-developmen/ljfoeinjpaedjfecbmggjgodbgkmjkjk). Disable normal Metamask, Core wallet, and other wallets. *Do not use your real private key with Flask*.

## 0. Clone this repo
`git clone https://github.com/ava-labs/hypersdk-starter-kit.git`

## 1. Launch this example

Run: `docker compose up -d --build devnet faucet frontend`. This may take 5 minutes to download dependencies.

For devcontainers or codespaces, forward ports `8765` for faucet, `9650` for the chain, and `5173` for the frontend.

When finished, stop everything with: `docker compose down`

## 2. Explore MorpheusVM
This repo includes [MorpheusVM](https://github.com/ava-labs/hypersdk/tree/main/examples/morpheusvm), the simplest HyperSDK VM. It supports one action (Transfer) for moving funds and tracking balances.

### 2.1 Connect wallet
Open [http://localhost:5173](http://localhost:5173) to see the frontend.

![Auth options](assets/auth.png)

We recommend using a Snap (requires [Metamask Flask](https://chromewebstore.google.com/detail/metamask-flask-developmen/ljfoeinjpaedjfecbmggjgodbgkmjkjk)) for the full experience, but a temporary wallet works too.

### 2.2 Execute a read-only action

Actions can be executed on-chain (in a transaction) with results saved to a block, or off-chain (read-only). MorpheusVM has one action. Try executing it read-only. It shows expected balances of the sender and receiver. See the logic in `actions/transfer.go`.

![Read-only action](assets/read-only.png)

### 2.3 Issue a transaction

Now, write data to the chain. Click "Execute in transaction". All fields are pre-filled with default values.

![Sign](assets/sign.png)

After mining, the transaction appears in the right column. This column shows all non-empty blocks on the chain.

### 2.4 Check Logs

Logs are located inside the Docker container. To view them, you'll need to open a bash terminal inside the container and navigate to the folder with the current network:
```bash
docker exec -it devnet bash -c "cd /root/.tmpnet/networks/latest_morpheusvm-e2e-tests && bash"
```

This isn’t the best developer experience, and we’re working on improving it.

## 3. Add Your Own Custom Action

Think of actions in HyperSDK like functions in EVMs. They have inputs, outputs, and execution logic.

Let's add the `Greeting` action. This action doesn’t change anything; it simply prints your balance and the current date. However, if it's executed in a transaction, the output will be recorded in a block on the chain.

### 3.1 Create an Action File

Place the following code in `actions/greeting.go`. The code includes some comments, but for more details, check out [the docs folder in HyperSDK](https://github.com/ava-labs/hypersdk/tree/main/docs).
```golang
package actions

import (
	"context"
	"fmt"
	"time"

	"github.com/ava-labs/avalanchego/ids"

	"github.com/ava-labs/hypersdk-starter-kit/consts"
	"github.com/ava-labs/hypersdk-starter-kit/storage"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"
	"github.com/ava-labs/hypersdk/utils"
)

// Please see chain.Action interface description for more information
var _ chain.Action = (*Greeting)(nil)

// Action struct. All "serialize" marked fields will be saved on chain
type Greeting struct {
	Name string `serialize:"true" json:"name"`
}

// TypeID, has to be unique across all actions
func (*Greeting) GetTypeID() uint8 {
	return consts.HiID
}

// All database keys that could be touched during execution.
// Will fail if a key is missing or has wrong permissions
func (g *Greeting) StateKeys(actor codec.Address) state.Keys {
	return state.Keys{
		string(storage.BalanceKey(actor)): state.Read,
	}
}

// The "main" function of the action
func (g *Greeting) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable, // That's how we read and write to the database
	timestamp int64, // Timestamp of the block or the time of simulation
	actor codec.Address, // Whoever signed the transaction, or a placeholder address in case of read-only action
	_ ids.ID, // actionID
) (codec.Typed, error) {
	balance, err := storage.GetBalance(ctx, mu, actor)
	if err != nil {
		return nil, err
	}
	currentTime := time.Unix(timestamp/1000, 0).Format("January 2, 2006")
	greeting := fmt.Sprintf(
		"Hi, dear %s! Today, %s, your balance is %s %s.",
		g.Name,
		currentTime,
		utils.FormatBalance(balance),
		consts.Symbol,
	)

	return &GreetingResult{
		Greeting: greeting,
	}, nil
}

// How many compute units to charge for executing this action. Can be dynamic based on the action.
func (*Greeting) ComputeUnits(chain.Rules) uint64 {
	return 1
}

// ValidRange is the timestamp range (in ms) that this [Action] is considered valid.
// -1 means no start/end
func (*Greeting) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}

// Result of execution of greeting action
type GreetingResult struct {
	Greeting string `serialize:"true" json:"greeting"`
}

// Has to implement codec.Typed for on-chain serialization
var _ codec.Typed = (*GreetingResult)(nil)

// TypeID of the action result, could be the same as the action ID
func (g *GreetingResult) GetTypeID() uint8 {
	return consts.HiID
}
```
### 3.2 Register the Action

Now, you need to make both the VM and clients (via ABI) aware of this action.

To do this, register your action in `vm/vm.go` after the line `ActionParser.Register(&actions.Transfer{}, nil):`
```golang
ActionParser.Register(&actions.Greeting{}, nil),
```

Then, register its output after the line `OutputParser.Register(&actions.TransferResult{}, nil):`
```golang
OutputParser.Register(&actions.GreetingResult{}, nil),
```

### 3.3 Rebuild Your VM
```bash
docker compose down -t 1; docker compose up -d --build devnet faucet frontend
```

### 3.4 Test Your New Action

HyperSDK uses ABI, an autogenerated description of all the actions in your VM. Thanks to this, the frontend already knows how to interact with your new action. Every action you add will be displayed on the frontend and supported by the wallet as soon as the node restarts.

Now, enter your name and see the result:

![Greeting result](assets/greeting.png)

You can also send it as a transaction, but this doesn't make much sense since there’s nothing to write to the chain's state.

### 3.5 Next Steps

Congrats! You've just created your first action for HyperSDK.

This covers nearly half of what you need to build your own blockchain on HyperSDK. The remaining part is state management, which you can explore in `storage/storage.go`. Dive in and enjoy your journey!

## 4. Develop a Frontend
1. If you started anything, bring everything down: `docker compose down`
2. Start only the devnet and faucet: `docker compose up -d --build devnet faucet`
3. Navigate to the web wallet: `cd web_wallet`
4. Install dependencies and start the dev server: `npm i && npm run dev`

Make sure ports `8765` (faucet), `9650` (chain), and `5173` (frontend) are forwarded.

Learn more from [npm:hypersdk-client](https://www.npmjs.com/package/hypersdk-client) and the `web_wallet` folder in this repo.

## Notes
- You can launch everything without Docker:
  - Faucet: `go run ./cmd/faucet/`
  - Chain: `./scripts/run.sh`, and use `./scripts/stop.sh` to stop
  - Frontend: `npm run dev` in `web_wallet`
- Be aware of potential port conflicts. If issues arise, `docker rm -f $(docker ps -a -q)` will help.
- For VM development, you don’t need to know JavaScript—you can use an existing frontend, and all actions will be added automatically.
- If the frontend works with an ephemeral private key but doesn't work with the Snap, delete the Snap, refresh the page, and try again. The Snap might be outdated.
- Instead of using `./build/morpheus-cli` commands, please directly use `go run ./cmd/morpheus-cli/` for the CLI.
- Always ensure that you have the `hypersdk-client` npm version and the golang `github.com/ava-labs/hypersdk` version from the same commit of the starter kit. HyperSDK evolves rapidly.

## Using CLI

**Install CLI with a version matching `go.mod`:**
```bash
go install github.com/ava-labs/hypersdk/cmd/hypersdk-cli@fb8b6bf17264
```

**Set the endpoint to your local instance of the HyperSDK app:**
```bash
hypersdk-cli endpoint set --endpoint http://localhost:9650/ext/bc/morpheusvm/
```

**Import the faucet key**:
```bash
hypersdk-cli key set --key ./demo.pk 
```

**Check the balance**:
```bash
hypersdk-cli balance
```

**Execute a read-only action**:
```bash
hypersdk-cli read Transfer --data to=0x000000000000000000000000000000000000000000000000000000000000000000a7396ce9,value=12,memo=0xdeadc0de
```

**Execute a transaction action**:
```bash
hypersdk-cli tx Transfer --data to=0x000000000000000000000000000000000000000000000000000000000000000000a7396ce9,value=12,memo=0x001234
```

**Check the new balance**:
```bash
hypersdk-cli balance --sender 0x000000000000000000000000000000000000000000000000000000000000000000a7396ce9
```

Read more at [github.com/ava-labs/hypersdk/tree/main/cmd/hypersdk-cli](https://github.com/ava-labs/hypersdk/tree/main/cmd/hypersdk-cli)
