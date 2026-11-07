# @devforge/contracts

> Hardhat smart-contract package containing the milestone escrow protocol for DevForge.

## Contract Architecture: `DevForgeEscrow.sol`

`DevForgeEscrow` implements a non-custodial, vault-keyed milestone escrow contract built with Solidity `0.8.24` and OpenZeppelin contracts (`Ownable`, `ReentrancyGuard`).

### Key Primitives

1. **Deterministic Vault Keys**:

   ```solidity
   bytes32 vaultKey = keccak256(abi.encodePacked(contractId, milestoneIndex));
   ```

   Each milestone within a DevForge engagement receives an isolated cryptographic vault. Funds for separate contracts or milestones can never collide or cross-contaminate.

2. **Milestone State Machine**:

   ```
   [NONE] ──depositMilestone()──> [DEPOSITED]
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
      releaseMilestone()       refundMilestone()        raiseDispute()
              │                       │                       │
              ▼                       ▼                       ▼
         [RELEASED]              [REFUNDED]              [DISPUTED]
                                                              │
                                                        resolveDispute()
                                                              │
                                                              ▼
                                                         [RESOLVED]
   ```

3. **Security Safeguards**:
   - `ReentrancyGuard` on all state transitions transferring native ETH (`releaseMilestone`, `refundMilestone`, `resolveDispute`).
   - Strict CEI (Checks-Effects-Interactions) order: state is marked `RELEASED` / `REFUNDED` / `RESOLVED` _before_ the external balance transfer.
   - Granular authorization checks with custom errors (`Unauthorized`, `InvalidState`, `InvalidAmount`, `DisputeSplitMismatch`).

---

## Testing & Verification

### 1. Compile Contracts & Generate TypeChain Typings

```bash
pnpm --filter @devforge/contracts compile
```

### 2. Run the Full Test Suite

The test suite covers happy paths, edge cases, reentrancy resistance, and unauthorized access attempts:

```bash
pnpm --filter @devforge/contracts test
```

### 3. Deploy to Sepolia Testnet

Ensure your environment variables are configured in `.env`:

```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=0x...
```

Execute the deployment script:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### 4. Verify on Etherscan

```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS> "<OWNER_ADDRESS>"
```
