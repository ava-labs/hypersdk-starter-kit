
export const DEVELOPMENT_MODE = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

export const FAUCET_HOST = DEVELOPMENT_MODE ? 'http://localhost:8765' : ""
export const API_HOST = DEVELOPMENT_MODE ? 'http://localhost:9650' : ""
