import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('--- DevForge Escrow Deployment ---');
  console.log(`Deployer address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);

  console.log('Deploying DevForgeEscrow contract...');
  const DevForgeEscrowFactory = await ethers.getContractFactory('DevForgeEscrow');
  const escrow = await DevForgeEscrowFactory.deploy(deployer.address);
  await escrow.waitForDeployment();

  const contractAddress = await escrow.getAddress();
  console.log(`\n DevForgeEscrow deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Owner:            ${deployer.address}`);

  console.log('\n--- Etherscan Verification Command ---');
  console.log(`npx hardhat verify --network sepolia ${contractAddress} "${deployer.address}"\n`);
}

main().catch((error) => {
  console.error('Deployment failed:', error);
  process.exitCode = 1;
});
