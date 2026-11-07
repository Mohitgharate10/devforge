import { describe, expect, it } from 'vitest';
import {
  CANONICAL_BOUNTIES,
  CANONICAL_SPECIALISTS,
  findCanonicalBounty,
  findCanonicalSpecialist,
} from './canonical-marketplace';

describe('Canonical Marketplace Store', () => {
  it('contains all 4 verified bounties with matching slugs and IDs', () => {
    expect(CANONICAL_BOUNTIES).toHaveLength(4);

    const ids = CANONICAL_BOUNTIES.map((b) => b.id);
    expect(ids).toContain('job-substrate-pallet');
    expect(ids).toContain('job-bridge-audit');
    expect(ids).toContain('job-zk-circuit');
    expect(ids).toContain('job-keeper-bot');
  });

  it('guarantees Substrate pallet has consistent title, budget, and milestones', () => {
    const pallet = findCanonicalBounty('job-substrate-pallet');
    expect(pallet).toBeDefined();
    expect(pallet?.title).toBe('Substrate Parachain Governance Pallet Developer');
    expect(pallet?.rewardUsdc).toBe(15000);
    expect(pallet?.budgetMin).toBe(10000);
    expect(pallet?.budgetMax).toBe(16000);
    expect(pallet?.client.organizationName).toBe('Polkadot Fellowship');
    expect(pallet?.milestones.length).toBeGreaterThanOrEqual(2);
  });

  it('provides a real detail route for the liquidation keeper grant', () => {
    const keeper = findCanonicalBounty('job-keeper-bot');
    expect(keeper).toBeDefined();
    expect(keeper?.slug).toBe('job-keeper-bot');
    expect(keeper?.client.organizationName).toBe('Arbitrum Foundation');
    expect(keeper?.rewardUsdc).toBe(8500);
    expect(keeper?.type).toBe('GRANT');
  });

  it('resolves freelancer personas across both canonical handles and legacy aliases', () => {
    expect(CANONICAL_SPECIALISTS.length).toBeGreaterThanOrEqual(3);

    // Elena Rostova
    const elenaByHandle = findCanonicalSpecialist('elena-rostova');
    const elenaByAlias = findCanonicalSpecialist('satoshi_core');
    expect(elenaByHandle).toBeDefined();
    expect(elenaByAlias).toBeDefined();
    expect(elenaByHandle?.displayName).toBe('Elena Rostova');
    expect(elenaByAlias?.displayName).toBe('Elena Rostova');

    // Marcus Vance
    const marcusByHandle = findCanonicalSpecialist('marcus-vance');
    const marcusByAlias = findCanonicalSpecialist('zk_builder');
    expect(marcusByHandle).toBeDefined();
    expect(marcusByAlias).toBeDefined();
    expect(marcusByHandle?.displayName).toBe('Marcus Vance');
    expect(marcusByAlias?.displayName).toBe('Marcus Vance');

    // Kenji Sato
    const kenjiByHandle = findCanonicalSpecialist('kenji-sato');
    const kenjiByAlias = findCanonicalSpecialist('polka_dev');
    expect(kenjiByHandle).toBeDefined();
    expect(kenjiByAlias).toBeDefined();
    expect(kenjiByHandle?.displayName).toBe('Kenji Sato');
  });
});
