// File: sdk/src/types.ts

/**
 * Represents a message to be sent through the Wormhole protocol.
 */
export interface WormholeMessage {
    /**
     * The first public key, typically representing the sender.
     */
    pubKey1: string;
  
    /**
     * The second public key, typically representing the recipient.
     */
    pubKey2: string;
  
    /**
     * The encrypted data to be sent through Wormhole.
     */
    encryptedData: string;
  }
  
  /**
   * Represents the supported chain types in the Wormhole ecosystem.
   */
  export enum ChainType {
    Ethereum = 'ethereum',
    Solana = 'solana',
    // Add more chains as needed
  }
  
  /**
   * Represents the configuration for a Wormhole connection.
   */
  export interface WormholeConfig {
    /**
     * The type of blockchain.
     */
    chainType: ChainType;
  
    /**
     * The RPC endpoint URL for the blockchain.
     */
    rpcUrl: string;
  
    /**
     * The address of the Wormhole contract on the blockchain.
     */
    wormholeAddress: string;
  }
  
  /**
   * Represents the result of a Wormhole message transmission.
   */
  export interface WormholeTransactionResult {
    /**
     * The transaction hash or signature.
     */
    transactionHash: string;
  
    /**
     * The sequence number assigned by Wormhole.
     */
    sequence: string;
  
    /**
     * The emitter address (if applicable).
     */
    emitterAddress?: string;
  }
  
  // Add more types as needed for your project