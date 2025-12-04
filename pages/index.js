// pages/index.js
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { ethers } from "ethers";
import TipJarAbi from "../lib/TipJarAbi.json";

const CONTRACT = "0x083C4B91577a28cD96DC948952e12D6f5390E13C"; // your contract address
const SITE_URL = "https://farcaster-tipjar-frame.vercel.app";   // your Vercel URL (no trailing slash)
const DEFAULT_TIP = "0.000001"; // fallback if user leaves amount empty

export default function Home() {
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState("");
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [amount, setAmount] = useState(DEFAULT_TIP); // user-set tip amount

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
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      setConnected(true);
      setStatus(
        "Wallet connected: " +
          accounts[0].slice(0, 6) +
          "..." +
          accounts[0].slice(-4)
      );
    } catch (e) {
      setStatus("Connect error: " + (e?.message || e));
    }
  }

  async function sendTip() {
    try {
      if (!connected) return alert("Connect your wallet first.");

      const finalAmount = (amount || DEFAULT_TIP).trim();
      if (!finalAmount || Number(finalAmount) <= 0) {
        return alert("Please enter a valid amount in ETH.");
      }

      setStatus("Sending transaction...");
      setTxHash("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT, TipJarAbi, signer);

      const tx = await contract.tip(msg || "Thanks!", {
        value: ethers.parseEther(finalAmount),
      });

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
        <meta
          name="fc:miniapp"
          content={JSON.stringify({
            version: "1",
            imageUrl: `${SITE_URL}/splash.png`,
            button: {
              title: "Open TipJar",
              action: { type: "launch_frame", url: `${SITE_URL}` },
              name: "TipJar",
              splashImageUrl: `${SITE_URL}/splash.png`,
              splashBackgroundColor: "#ffffff",
            },
          })}
        />

        {/* Legacy fc:frame tag for older clients */}
        <meta
          name="fc:frame"
          content={JSON.stringify({
            version: "vNext",
            image: `${SITE_URL}/splash.png`,
            "button:1": "Open TipJar",
            action_url: `${SITE_URL}/api/action`,
          })}
        />
      </Head>

      {/* Full-page background = premium CSS */}
      <div
        style={{
          minHeight: "100vh",
          margin: 0,
          padding: 0,
          background:
            "radial-gradient(circle at top, #0f172a 0, #020617 45%, #000000 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
        }}
      >
        <main style={{ width: "100%", maxWidth: 600, padding: 16 }}>
          <div
            style={{
              borderRadius: 20,
              padding: 24,
              background:
                "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7))",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(148,163,184,0.2)",
              border: "1px solid rgba(148,163,184,0.25)",
              color: "#e5e7eb",
            }}
          >
            <h1 style={{ marginBottom: 6, fontSize: 24 }}>TipJar · Base</h1>
            <p style={{ color: "#9ca3af", marginTop: 0, fontSize: 13 }}>
              Send a tiny onchain tip on Base in one click.
            </p>

            <p
              style={{
                color: "#a5b4fc",
                fontSize: 12,
                marginTop: 10,
                marginBottom: 18,
              }}
            >
              Contract:{" "}
              <a
                href={`https://basescan.org/address/${CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#e5e7eb", textDecoration: "none" }}
              >
                <code>
                  {CONTRACT.slice(0, 10)}...{CONTRACT.slice(-6)}
                </code>
              </a>
            </p>

            {!connected ? (
              <div>
                <button
                  onClick={connect}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                    background:
                      "linear-gradient(135deg, #22c55e, #38bdf8, #6366f1)",
                    color: "#020617",
                    width: "100%",
                  }}
                >
                  Connect wallet to tip
                </button>
                <p
                  style={{
                    color: "#9ca3af",
                    marginTop: 10,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Uses MetaMask on{" "}
                  <span style={{ color: "#38bdf8" }}>Base Mainnet</span>.
                </p>
              </div>
            ) : (
              <div>
                {/* Amount + message row = manual amount system */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      placeholder={DEFAULT_TIP}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{
                        width: "40%",
                        padding: 10,
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,0.7)",
                        backgroundColor: "rgba(15,23,42,0.8)",
                        color: "#e5e7eb",
                        fontSize: 13,
                      }}
                    />
                    <input
                      placeholder="Message (optional)"
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,0.7)",
                        backgroundColor: "rgba(15,23,42,0.8)",
                        color: "#e5e7eb",
                        fontSize: 13,
                      }}
                    />
                  </div>

                  <button
                    onClick={sendTip}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                      background:
                        "linear-gradient(135deg, #38bdf8, #6366f1)",
                      color: "#f9fafb",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}
                  >
                    Send {amount || DEFAULT_TIP} ETH
                  </button>
                </div>

                {/* Status box */}
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(55,65,81,0.7)",
                    fontSize: 12,
                  }}
                >
                  <div> Status: {status || "Idle"} </div>
                  {txHash && (
                    <div style={{ marginTop: 4 }}>
                      Tx:&nbsp;
                      <a
                        href={`https://basescan.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={txHash}
                        style={{ color: "#38bdf8", textDecoration: "none" }}
                      >
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </a>
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "#9ca3af",
                    }}
                  >
                    Connected:{" "}
                    <span style={{ fontFamily: "monospace", color: "#e5e7eb" }}>
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <footer
              style={{
                marginTop: 18,
                color: "#9ca3af",
                fontSize: 11,
                textAlign: "right",
              }}
            >
              Built on Base · Farcaster-ready Frame
            </footer>
          </div>
        </main>
      </div>
    </>
  );
}
