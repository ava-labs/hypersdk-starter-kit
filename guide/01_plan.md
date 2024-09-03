The goal of this course is to provide a hands-on introduction to HyperSDK development.

## Target Audience
This course is designed for backend developers who are somewhat familiar with Go. Since Go is one of the easiest programming languages, we can consider Go experience optional. Additionally, we won't assume any prior knowledge of blockchain, which should make this guide accessible to a broader audience.

Note: Frontend development is not covered in this course. The JavaScript client for the SDK can be fully explained in a one-page README on npm.

## Depth
Unlike many other languages, Go is structured in a way that makes reading the source code often easier than going through documentation. Our goal is to introduce the key components of HyperSDK, leaving the rest for users to explore on their own.

Also, I'd like to focus on practical applications rather than theory for the same reason. We want developers to see results quickly—ideally within the first hour—with minimal chances for things to go wrong.

Each practical module will include a few test files to check if the user implemented the action correctly. These tests could be end-to-end (e2e), integration, or unit tests, and will also serve as examples.

It also doesn't cover testnet and prod deployment, as we are so far away from it. 

## Rough Plan

We build with the user a simple domain registry, where users can claim nicknames for a fee, and check who owns nicknames via RPC.
TODO: how to make it less lame?

**Intro**
- Get familiar with the project structure.

**Main programming block**

1. Create a burn action (covering actions and the registry without changing any controller and storage functions.).
2. Claim a domain name (storage writes using `state.Mutable`).
3. Check domain registration info (using reads with `FromState` functions for RPC, controller server + client).

Note: any other ideas how to split functionality?

Here is a VM dir structure with numbers representing the lesson in this block:
```
- VM
  - actions (1)
  - cmd
  - consts
  - controller (3)
  - registry (1)
  - scripts
  - strage (2,3)
  - tests

```

**Deployments**

- Launch a local testnet
- Share your devnet on a server


## Stand

if possible, I would love to build an interactive stand for each of the 3 steps. The platform may be github codespaces, repl, may be even our ownj gitpod instances. 
