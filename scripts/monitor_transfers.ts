import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
//import { EthereumClient, SolanaClient } from '../client/src';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    const ethDeployment = JSON.parse(fs.readFileSync(path.join(__dirname, '../deployments/ethereum_deployment.json'), 'utf-8'));
    const solDeployment = JSON.parse(fs.readFileSync(path.join(__dirname, '../deployments/solana_deployment.json'), 'utf-8'));

    const ethProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const solConnection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');

  

    console.log('Starting transfer monitoring...');

    // Monitor Ethereum events
    const ethContract = new ethers.Contract(
      ethDeployment.address,
      ['event MessageSent(bytes32 indexed messageHash, address indexed sender, uint16 targetChain)', 
       'event MessageReceived(bytes32 indexed messageHash, address indexed recipient)'],
      ethProvider
    );

    ethContract.on('MessageSent', async (messageHash, sender, targetChain, event) => {
      console.log(`Ethereum message sent: ${messageHash} from ${sender} to chain ${targetChain}`);
      // Here you would typically trigger the relayer to pick up this message and deliver it to the target chain
    });

    ethContract.on('MessageReceived', async (messageHash, recipient, event) => {
      console.log(`Ethereum message received: ${messageHash} for ${recipient}`);
      // Here you might want to trigger some action or notification
    });

    // Monitor Solana events
    const solProgramId = new PublicKey(solDeployment.programId);
    solConnection.onLogs(solProgramId, (logs) => {
      if (logs.logs.some(log => log.includes('MessageSent'))) {
        console.log('Solana message sent:', logs);
        // Here you would typically trigger the relayer to pick up this message and deliver it to the target chain
      }
      if (logs.logs.some(log => log.includes('MessageReceived'))) {
        console.log('Solana message received:', logs);
        // Here you might want to trigger some action or notification
      }
    }, 'confirmed');

    console.log('Monitoring started. Press Ctrl+C to stop.');

    // Keep the script running
    await new Promise(() => {});
  } catch (error) {
    console.error('An error occurred during monitoring:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
