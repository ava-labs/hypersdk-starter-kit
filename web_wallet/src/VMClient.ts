import { ActionData } from "hypersdk-client/src/snap";
import { API_HOST, DECIMALS, FAUCET_HOST, VM_NAME, VM_RPC_PREFIX } from "./const";
import { HyperSDKClient } from "hypersdk-client/src/client"


export interface Token {
    name: string;
    symbol: string
    metadata: string;
    address: string;
    balance: string;
    totalSupply: string;
    owner: string;
  }
  
export interface TokensProps {
    initialTokens: Token[];
  }
export interface LiquidityPair {
    poolAddress: string,
    poolTokenAddress: string,
    info?: LiquidityPairInfo
    tokenXSymbol?: string
    tokenYSymbol?: string
  }
  
export interface LiquidityPairInfo {
    tokenX: string,
    tokenY: string,
    fee: number,
    feeTo: string,
    functionID: number,
    reserveX: number,
    reserveY: number,
    liquidityToken: string,
    kLast: number,
    balance?: number
  }

export const vmClient = new HyperSDKClient(API_HOST, VM_NAME, VM_RPC_PREFIX, DECIMALS);

export async function requestFaucetTransfer(address: string): Promise<void> {
    const response = await fetch(`${FAUCET_HOST}/faucet/${address}`, {
        method: 'POST',
        body: JSON.stringify({})
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export const NewTransferAction = (to: string, tokenAddress: string, value: string): ActionData => {
    return {
        actionName: "TransferToken",
        data: {
            to,
            tokenAddress,
            value: vmClient.convertToNativeTokens(value).toString()
        }
    }
}

export const NewTokenBalanceAction = (tokenAddress: string, address: string): ActionData => {
    if (address.startsWith("0x")) {
        address = address.slice(2);
    }
    return {
        actionName: "GetTokenAccountBalance",
        data: {
            token: tokenAddress,
            account: address
        }
    }
}

export const NewTokenInfoAction = (token: string): ActionData => {
    return {
        actionName: "GetTokenInfo",
        data: {
            token: token
        }
    }
}

export const NewCreateTokenAction = (name: string, symbol: string, metadata: string): ActionData => {
    return {
        actionName: "CreateToken",
        data: {
            name: btoa(name),
            symbol: btoa(symbol),
            metadata: btoa(metadata)
        }
    }
}

export const NewMintTokenAction = (to: string, value: string, token: string): ActionData => {
    if (to.startsWith("0x")) {
        to = to.slice(2);
    }
    return {
        actionName: "MintToken",
        data: {
            to,
            value: vmClient.convertToNativeTokens(value).toString(),
            token: token
        }
    }
}

export const NewCreateLiquidityPoolAction = (functionID: number, tokenX: string, tokenY: string, fee: number): ActionData => {
    return {
        actionName: "CreateLiquidityPool",
        data: {
            functionID,
            tokenX,
            tokenY,
            fee: fee
        }
    }
}

export const NewAddLiquidityAction = (amountX: string, amountY: string, tokenX: string, tokenY: string, liquidityPool: string): ActionData => {
    return {
        actionName: "AddLiquidity",
        data: {
            amountX:  vmClient.convertToNativeTokens(amountX).toString(),
            amountY: vmClient.convertToNativeTokens(amountY).toString(),
            tokenX,
            tokenY,
            liquidityPool
        }
    }
}

export const NewGetLiquidityPoolAction = (poolAddress: string): ActionData => {
   return (
         {
              actionName: "GetLiquidityPoolInfo",
              data: {
                liquidityPoolAddress: poolAddress
              }
         }
   )
}

export const NewSwapAction = (tokenX: string, tokenY: string, amountIn: string, tokenIn: string, lpAddress: string): ActionData => {
    return {
        actionName: "Swap",
        data: {
            tokenX,
            tokenY,
            amountIn: vmClient.convertToNativeTokens(amountIn).toString(),
            tokenIn,
            lpAddress
        }
    }
}

export const NewRemoveLiquidityAction = (burnAmount: string, liquidityPool: string, tokenX: string, tokenY: string): ActionData => {
    return {
        actionName: "RemoveLiquidity",
        data: {
            burnAmount: vmClient.convertToNativeTokens(burnAmount).toString(),
            liquidityPool,
            tokenX,
            tokenY
        }
    }
}