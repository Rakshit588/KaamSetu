import { randomUUID } from 'node:crypto';

export type KycSubmitInput = {
  userId: string;
  idType: 'aadhaar' | 'voter_id' | 'dl';
  idNumberLast4: string;
  idDocUrl: string;
  selfieUrl: string;
};

export interface KycProvider {
  submit(input: KycSubmitInput): Promise<{ referenceId: string; status: 'pending' }>;
}

export class MockKycProvider implements KycProvider {
  async submit(_input: KycSubmitInput): Promise<{ referenceId: string; status: 'pending' }> {
    return { referenceId: `mock-kyc-${randomUUID()}`, status: 'pending' };
  }
}

export function createKycProvider(): KycProvider {
  return new MockKycProvider();
}
