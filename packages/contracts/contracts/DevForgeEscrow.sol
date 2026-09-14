// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DevForgeEscrow
 * @notice Production-grade decentralized milestone escrow contract for DevForge marketplace.
 * Enforces non-custodial milestone deposits, client release authorizations, and arbitrator dispute mediation.
 */
contract DevForgeEscrow is ReentrancyGuard, Ownable {

    enum MilestoneState {
        UNINITIALIZED,
        DEPOSITED,
        RELEASED,
        DISPUTED,
        REFUNDED
    }

    struct MilestoneVault {
        bytes32 contractId;
        uint256 milestoneIndex;
        address client;
        address freelancer;
        address arbitrator;
        uint256 amount;
        MilestoneState state;
    }

    mapping(bytes32 => MilestoneVault) public vaults;

    event MilestoneDeposited(
        bytes32 indexed vaultKey,
        bytes32 indexed contractId,
        uint256 indexed milestoneIndex,
        address client,
        address freelancer,
        uint256 amount
    );

    event MilestoneReleased(
        bytes32 indexed vaultKey,
        address indexed freelancer,
        uint256 amount
    );

    event MilestoneDisputed(
        bytes32 indexed vaultKey,
        address indexed initiator
    );

    event DisputeResolved(
        bytes32 indexed vaultKey,
        uint256 clientShare,
        uint256 freelancerShare
    );

    event MilestoneRefunded(
        bytes32 indexed vaultKey,
        address indexed client,
        uint256 amount
    );

    error InvalidAmount();
    error InvalidAddress();
    error InvalidState(MilestoneState current);
    error Unauthorized();
    error TransferFailed();
    error InvalidSplit();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Computes deterministic vault key for contractId and milestone index.
     */
    function computeVaultKey(bytes32 contractId, uint256 milestoneIndex) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(contractId, milestoneIndex));
    }

    /**
     * @notice Deposits funds into escrow vault for a specific milestone.
     */
    function depositMilestone(
        bytes32 contractId,
        uint256 milestoneIndex,
        address freelancer,
        address arbitrator
    ) external payable nonReentrant returns (bytes32 vaultKey) {
        if (msg.value == 0) revert InvalidAmount();
        if (freelancer == address(0)) revert InvalidAddress();

        vaultKey = computeVaultKey(contractId, milestoneIndex);
        MilestoneVault storage vault = vaults[vaultKey];

        if (vault.state != MilestoneState.UNINITIALIZED) {
            revert InvalidState(vault.state);
        }

        vault.contractId = contractId;
        vault.milestoneIndex = milestoneIndex;
        vault.client = msg.sender;
        vault.freelancer = freelancer;
        vault.arbitrator = arbitrator == address(0) ? owner() : arbitrator;
        vault.amount = msg.value;
        vault.state = MilestoneState.DEPOSITED;

        emit MilestoneDeposited(
            vaultKey,
            contractId,
            milestoneIndex,
            msg.sender,
            freelancer,
            msg.value
        );
    }

    /**
     * @notice Releases escrowed milestone payout to freelancer upon client approval.
     */
    function releaseMilestone(bytes32 vaultKey) external nonReentrant {
        MilestoneVault storage vault = vaults[vaultKey];

        if (vault.state != MilestoneState.DEPOSITED) {
            revert InvalidState(vault.state);
        }

        if (msg.sender != vault.client && msg.sender != owner()) {
            revert Unauthorized();
        }

        vault.state = MilestoneState.RELEASED;
        uint256 payout = vault.amount;

        (bool success, ) = payable(vault.freelancer).call{value: payout}("");
        if (!success) revert TransferFailed();

        emit MilestoneReleased(vaultKey, vault.freelancer, payout);
    }

    /**
     * @notice Initiates a dispute, freezing milestone payout for arbitration.
     */
    function raiseDispute(bytes32 vaultKey) external nonReentrant {
        MilestoneVault storage vault = vaults[vaultKey];

        if (vault.state != MilestoneState.DEPOSITED) {
            revert InvalidState(vault.state);
        }

        if (msg.sender != vault.client && msg.sender != vault.freelancer && msg.sender != owner()) {
            revert Unauthorized();
        }

        vault.state = MilestoneState.DISPUTED;

        emit MilestoneDisputed(vaultKey, msg.sender);
    }

    /**
     * @notice Resolves an open dispute, dividing funds between client and freelancer.
     */
    function resolveDispute(
        bytes32 vaultKey,
        uint256 clientShare,
        uint256 freelancerShare
    ) external nonReentrant {
        MilestoneVault storage vault = vaults[vaultKey];

        if (vault.state != MilestoneState.DISPUTED) {
            revert InvalidState(vault.state);
        }

        if (msg.sender != vault.arbitrator && msg.sender != owner()) {
            revert Unauthorized();
        }

        if (clientShare + freelancerShare != vault.amount) {
            revert InvalidSplit();
        }

        vault.state = MilestoneState.RELEASED;

        if (clientShare > 0) {
            (bool successClient, ) = payable(vault.client).call{value: clientShare}("");
            if (!successClient) revert TransferFailed();
        }

        if (freelancerShare > 0) {
            (bool successFreelancer, ) = payable(vault.freelancer).call{value: freelancerShare}("");
            if (!successFreelancer) revert TransferFailed();
        }

        emit DisputeResolved(vaultKey, clientShare, freelancerShare);
    }

    /**
     * @notice Refunds milestone amount back to client (authorized by freelancer or arbitrator).
     */
    function refundMilestone(bytes32 vaultKey) external nonReentrant {
        MilestoneVault storage vault = vaults[vaultKey];

        if (vault.state != MilestoneState.DEPOSITED && vault.state != MilestoneState.DISPUTED) {
            revert InvalidState(vault.state);
        }

        if (msg.sender != vault.freelancer && msg.sender != vault.arbitrator && msg.sender != owner()) {
            revert Unauthorized();
        }

        vault.state = MilestoneState.REFUNDED;
        uint256 refundAmount = vault.amount;

        (bool success, ) = payable(vault.client).call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit MilestoneRefunded(vaultKey, vault.client, refundAmount);
    }

    /**
     * @notice Read-only helper to inspect vault parameters.
     */
    function getVault(bytes32 vaultKey) external view returns (MilestoneVault memory) {
        return vaults[vaultKey];
    }
}
