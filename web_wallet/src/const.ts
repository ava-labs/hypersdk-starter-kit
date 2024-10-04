
export const DEVELOPMENT_MODE = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

export const FAUCET_HOST = DEVELOPMENT_MODE ? 'http://localhost:8765' : ""
export const API_HOST = DEVELOPMENT_MODE ? 'http://localhost:9650' : ""

export const VM_NAME = 'CFMMVM';
export const VM_RPC_PREFIX = 'cfmmapi';
export const DECIMALS = 9;
export const TOKEN_ADDRESS = "039dd909c6fac1072001b309003837e26150eb2bf3be281c35f3ea3dc861e22dcd";
export const COIN_SYMBOL = "CVM";