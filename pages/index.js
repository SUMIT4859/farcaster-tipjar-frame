// pages/index.js
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { ethers } from "ethers";
import TipJarAbi from "../lib/TipJarAbi.json";

const CONTRACT = "0x083C4B91577a28cD96DC948952e12D6f5390E13C"; // your contract address
const SITE_URL = "http://localhost:3000"; // keep localhost for local testing; update to your Vercel URL after deploy

export default function Home() {
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState("");
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on?.("accountsChanged", (accs) => {
        if (accs && accs.length) {
          setAccount(accs[0]);
          setConnected(true);
        } else {
          setAccount("");
          setConnected(false);
        }
      });
    }
  }, []);

  async function connect() {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setConnected(true);
      setStatus("Wallet connected: " + accounts[0].slice(0,6) + "..." + accounts[0].slice(-4));
    } catch (e) {
      setStatus("Connect error: " + (e?.message || e));
    }
  }

  async function sendTip() {
    try {
      if (!connected) return alert("Connect your wallet first.");
      setStatus("Sending transaction...");
      setTxHash("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT, TipJarAbi, signer);

      // amount to send (adjust as you prefer). Example here uses 0.00002 ETH (~₹5).
      const valueToSend = "0.000001";

      const tx = await contract.tip(msg || "Thanks!", { value: ethers.parseEther(valueToSend) });

      // store tx hash immediately so user can inspect while waiting
      setTxHash(tx.hash);
      setStatus("Waiting for confirmation...");

      await tx.wait();
      setStatus("Tip sent ✅ (tx confirmed)");
      setMsg("");
    } catch (e) {
      setStatus("Error: " + (e?.message || e));
    }
  }

  return (
    <>
      <Head>
        <title>TipJar</title>

        {/* Modern miniapp meta (Farcaster) */}
        <meta name="fc:miniapp" content={JSON.stringify({
          version: "1",
          imageUrl: `${SITE_URL}/splash.png`,
          button: {
            title: "Open TipJar",
            action: { type: "launch_frame", url: `${SITE_URL}` },
            name: "TipJar",
            splashImageUrl: `${SITE_URL}/splash.png`,
            splashBackgroundColor: "#ffffff"
          }
        })} />

        {/* Legacy fc:frame tag for older clients */}
        <meta name="fc:frame" content={JSON.stringify({
          version: "vNext",
          image: `${SITE_URL}/splash.png`,
          "button:1": "Open TipJar",
          "action_url": `${SITE_URL}/api/action`
        })} />
      </Head>

      <main style={{ padding: 24, fontFamily: "Inter, Arial, sans-serif", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 6 }}>TipJar</h1>
        <p style={{ color: "#555", marginTop: 0 }}>Contract: <code>{CONTRACT}</code></p>

        {!connected ? (
          <div>
            <button onClick={connect} style={{ padding: "10px 16px", borderRadius: 8 }}>Connect Wallet</button>
            <p style={{ color: "#777", marginTop: 8 }}>Connect MetaMask (Base network) to send a small tip.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                placeholder="Message (optional)"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
              />
              <button onClick={sendTip} style={{ padding: "10px 14px", borderRadius: 8 }}>
                Send 0.000001 ETH
              </button>
            </div>

            <div style={{ marginTop: 10, color: "#333" }}>{status}</div>

            {/* Clickable tx hash */}
            {txHash && (
              <div style={{ marginTop: 8 }}>
                Tx:&nbsp;
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={txHash}
                  style={{ color: "#0366d6" }}
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
              Connected: {account}
            </div>
          </div>
        )}

        <footer style={{ marginTop: 28, color: "#888", fontSize: 13 }}>
          Built as a Farcaster Frame deploy & share on Warpcast. Contract verified on Base.
        </footer>
      </main>
    </>
  );
}
