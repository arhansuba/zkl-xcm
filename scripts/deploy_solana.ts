import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@project-serum/anchor';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
    const wallet = new Wallet(Keypair.fromSecretKey(
      Buffer.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY!))
    ));

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: 'confirmed',
    });

    const programId = new PublicKey(process.env.SOLANA_PROGRAM_ID!);
    const idlPath = path.join(__dirname, '../idl/cross_chain_messenger.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
    const program = new Program(idl, programId, provider);

    console.log('Deploying CrossChainMessenger program...');

    const [messengerPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('cross_chain_messenger')],
      programId
    );

    await program.rpc.initialize({
      accounts: {
        messenger: messengerPDA,
        authority: wallet.publicKey,
        systemProgram: PublicKey.default,
      },
    });

    console.log(`CrossChainMessenger deployed to: ${messengerPDA.toBase58()}`);

    const deploymentInfo = {
      address: messengerPDA.toBase58(),
      programId: programId.toBase58(),
      network: process.env.SOLANA_NETWORK,
      timestamp: new Date().toISOString(),
    };

    const deploymentPath = path.join(__dirname, '../deployments/solana_deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${deploymentPath}`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
