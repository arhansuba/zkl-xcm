import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  const wallet = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY!, provider);

  console.log('Deploying CrossChainMessenger contract...');

  try {
    const CrossChainMessenger = await ethers.getContractFactory('CrossChainMessenger', wallet);
    const wormholeAddress = process.env.WORMHOLE_ETHEREUM_ADDRESS!;
    const chainId = parseInt(process.env.ETHEREUM_CHAIN_ID!);
    const messageFee = ethers.utils.parseEther(process.env.ETHEREUM_MESSAGE_FEE || '0.01');

    const messenger = await CrossChainMessenger.deploy(wormholeAddress, chainId, messageFee);
    await messenger.deployed();

    console.log(`CrossChainMessenger deployed to: ${messenger.address}`);

    const deploymentInfo = {
      address: messenger.address,
      network: provider.network.name,
      chainId: chainId,
      wormholeAddress: wormholeAddress,
      messageFee: messageFee.toString(),
      timestamp: new Date().toISOString(),
    };

    const deploymentPath = path.join(__dirname, '../deployments/ethereum_deployment.json');
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