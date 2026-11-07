import { expect } from 'chai';
import { ethers } from 'hardhat';
import { DevForgeEscrow } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('DevForgeEscrow', function () {
  let escrow: DevForgeEscrow;
  let owner: HardhatEthersSigner;
  let client: HardhatEthersSigner;
  let freelancer: HardhatEthersSigner;
  let arbitrator: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  const mockContractId = ethers.keccak256(ethers.toUtf8Bytes('contract-uuid-1234'));
  const milestoneIndex = 0;
  const depositAmount = ethers.parseEther('1.0');

  beforeEach(async function () {
    [owner, client, freelancer, arbitrator, stranger] = await ethers.getSigners();

    const DevForgeEscrowFactory = await ethers.getContractFactory('DevForgeEscrow');
    escrow = await DevForgeEscrowFactory.deploy(owner.address);
    await escrow.waitForDeployment();
  });

  describe('Deployment & Vault Key', function () {
    it('sets the owner correctly', async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });

    it('computes deterministic vault key', async function () {
      const key1 = await escrow.computeVaultKey(mockContractId, milestoneIndex);
      const key2 = await escrow.computeVaultKey(mockContractId, milestoneIndex);
      expect(key1).to.equal(key2);
      expect(key1).to.not.equal(ethers.ZeroHash);
    });
  });

  describe('Deposit Milestone', function () {
    it('accepts valid deposit and creates milestone vault', async function () {
      const vaultKey = await escrow.computeVaultKey(mockContractId, milestoneIndex);

      await expect(
        escrow
          .connect(client)
          .depositMilestone(
            mockContractId,
            milestoneIndex,
            freelancer.address,
            arbitrator.address,
            { value: depositAmount },
          ),
      )
        .to.emit(escrow, 'MilestoneDeposited')
        .withArgs(
          vaultKey,
          mockContractId,
          milestoneIndex,
          client.address,
          freelancer.address,
          depositAmount,
        );

      const vault = await escrow.getVault(vaultKey);
      expect(vault.client).to.equal(client.address);
      expect(vault.freelancer).to.equal(freelancer.address);
      expect(vault.arbitrator).to.equal(arbitrator.address);
      expect(vault.amount).to.equal(depositAmount);
      expect(vault.state).to.equal(1); // MilestoneState.DEPOSITED
    });

    it('reverts on zero deposit amount', async function () {
      await expect(
        escrow
          .connect(client)
          .depositMilestone(
            mockContractId,
            milestoneIndex,
            freelancer.address,
            arbitrator.address,
            { value: 0 },
          ),
      ).to.be.revertedWithCustomError(escrow, 'InvalidAmount');
    });
  });

  describe('Release Milestone', function () {
    let vaultKey: string;

    beforeEach(async function () {
      vaultKey = await escrow.computeVaultKey(mockContractId, milestoneIndex);
      await escrow
        .connect(client)
        .depositMilestone(mockContractId, milestoneIndex, freelancer.address, arbitrator.address, {
          value: depositAmount,
        });
    });

    it('client releases payout to freelancer', async function () {
      const initialFreelancerBalance = await ethers.provider.getBalance(freelancer.address);

      await expect(escrow.connect(client).releaseMilestone(vaultKey))
        .to.emit(escrow, 'MilestoneReleased')
        .withArgs(vaultKey, freelancer.address, depositAmount);

      const postBalance = await ethers.provider.getBalance(freelancer.address);
      expect(postBalance - initialFreelancerBalance).to.equal(depositAmount);

      const vault = await escrow.getVault(vaultKey);
      expect(vault.state).to.equal(2); // MilestoneState.RELEASED
    });

    it('unauthorized user cannot release milestone', async function () {
      await expect(
        escrow.connect(stranger).releaseMilestone(vaultKey),
      ).to.be.revertedWithCustomError(escrow, 'Unauthorized');
    });
  });

  describe('Disputes & Resolution', function () {
    let vaultKey: string;

    beforeEach(async function () {
      vaultKey = await escrow.computeVaultKey(mockContractId, milestoneIndex);
      await escrow
        .connect(client)
        .depositMilestone(mockContractId, milestoneIndex, freelancer.address, arbitrator.address, {
          value: depositAmount,
        });
    });

    it('allows client or freelancer to raise dispute', async function () {
      await expect(escrow.connect(client).raiseDispute(vaultKey))
        .to.emit(escrow, 'MilestoneDisputed')
        .withArgs(vaultKey, client.address);

      const vault = await escrow.getVault(vaultKey);
      expect(vault.state).to.equal(3); // MilestoneState.DISPUTED
    });

    it('arbitrator resolves dispute with split', async function () {
      await escrow.connect(client).raiseDispute(vaultKey);

      const clientShare = ethers.parseEther('0.4');
      const freelancerShare = ethers.parseEther('0.6');

      const initialClientBalance = await ethers.provider.getBalance(client.address);
      const initialFreelancerBalance = await ethers.provider.getBalance(freelancer.address);

      await expect(
        escrow.connect(arbitrator).resolveDispute(vaultKey, clientShare, freelancerShare),
      )
        .to.emit(escrow, 'DisputeResolved')
        .withArgs(vaultKey, clientShare, freelancerShare);

      const postClientBalance = await ethers.provider.getBalance(client.address);
      const postFreelancerBalance = await ethers.provider.getBalance(freelancer.address);

      expect(postClientBalance - initialClientBalance).to.equal(clientShare);
      expect(postFreelancerBalance - initialFreelancerBalance).to.equal(freelancerShare);
    });
  });

  describe('Refund Milestone', function () {
    let vaultKey: string;

    beforeEach(async function () {
      vaultKey = await escrow.computeVaultKey(mockContractId, milestoneIndex);
      await escrow
        .connect(client)
        .depositMilestone(mockContractId, milestoneIndex, freelancer.address, arbitrator.address, {
          value: depositAmount,
        });
    });

    it('allows freelancer to refund deposit to client', async function () {
      const initialClientBalance = await ethers.provider.getBalance(client.address);

      await expect(escrow.connect(freelancer).refundMilestone(vaultKey))
        .to.emit(escrow, 'MilestoneRefunded')
        .withArgs(vaultKey, client.address, depositAmount);

      const postClientBalance = await ethers.provider.getBalance(client.address);
      expect(postClientBalance - initialClientBalance).to.equal(depositAmount);

      const vault = await escrow.getVault(vaultKey);
      expect(vault.state).to.equal(4); // MilestoneState.REFUNDED
    });
  });
});
