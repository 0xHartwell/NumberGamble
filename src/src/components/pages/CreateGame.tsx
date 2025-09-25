import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../../config/numberGamble';

export function CreateGamePage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [capacity, setCapacity] = useState(2);
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    if (!walletClient) return;
    setBusy(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI as any, signer);
      const tx = await c.createGame(capacity);
      await tx.wait();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Create Game</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>Capacity (2-5)</label>
        <input
          type="number"
          min={2}
          max={5}
          value={capacity}
          onChange={(e) => setCapacity(Math.max(2, Math.min(5, Number(e.target.value))))}
          style={{ width: 80 }}
        />
        <button onClick={onCreate} disabled={!address || busy}>{busy ? 'Creating...' : 'Create'}</button>
      </div>
    </section>
  );
}

