The goal of this course is to provide a hands-on introduction to HyperSDK development.

## Target Audience
This course is designed for backend developers who are somewhat familiar with Go. Since Go is one of the easiest programming languages, we can consider Go experience optional. Additionally, we won’t assume any prior knowledge of blockchain, which should make this guide accessible to a broader audience.

Note: Frontend development is not covered in this course. The JavaScript client for the SDK can be fully explained in a one-page README on npm.

## Depth
Unlike many other languages, Go is structured in a way that makes reading the source code often easier than going through documentation. Our goal is to introduce the key components of HyperSDK, leaving the rest for users to explore on their own.

Also, I’d like to focus on practical applications rather than theory for the same reason. We want developers to see results quickly—ideally within the first hour—with minimal chances for things to go wrong.

Each practical module will include a few test files to check if the user implemented the action correctly. These tests could be end-to-end (e2e), integration, or unit tests, and will also serve as examples.

It also doean't cover an testnet and prod deployment, as we are so far away from it. 

## Rough Plan

We aim to provide a gentle introduction to actions, followed by state writes (transactions), and then state reads (RPC).

**Intro**

- Get familiar with the project structure.

**Main programming block**

- Create a burn action (covering actions and the registry).

- Claim a nickname (working with storage functions using `state.Mutable`).
- Check domain registration info (using storage `FromState` functions, controller server + client).

**Deployments**

- Launch a local testnet
- Share your devnet on a server


## Stand

In the perfect world, if I have unlimited amout of time, I would love to build an interactive stand for each of the 3 steps. The platform may be github codespaces, repl, may be even our ownj gitpod instances. 
