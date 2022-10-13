import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract, utils } from "ethers";
import Head from "next/head";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const web3ModalRef = useRef(null);

  const [walletConnected, setWalletConnected] = useState(false);
  const [preSaleStarted, setPreSaleStarted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [preSaleEnded, setPreSaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokensLeft, setTokensLeft] = useState("");

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current.connect();
      // console.log(provider, "provider");
      const web3Provider = new providers.Web3Provider(provider);

      const { chainId } = await web3Provider.getNetwork();

      if (chainId !== 5) {
        alert("Please connect to the Goerli Test Network");
        throw new Error("Please connect to the Goerli Test Network");
        return;
      }

      if (needSigner) {
        return web3Provider.getSigner();
      }

      return web3Provider;
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      const isPresaleStarted = await nftContract.presaleStarted();
      setPreSaleStarted(isPresaleStarted);
      return isPresaleStarted;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const startPresale = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);
      const tx = await nftContract.startPresale();

      await tx.wait();
      setPreSaleStarted(true);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const owner = await nftContract.owner();

      const address = await signer.getAddress();

      console.log(owner, "owner");
      console.log(address, "address");

      if (owner === address) {
        setIsOwner(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      const PresaleEndTime = await nftContract.presaleEnded();

      const currentTime = Math.floor(Date.now() / 1000);

      const hasPresaleEnded = PresaleEndTime.lt(currentTime);

      setPreSaleEnded(hasPresaleEnded);
    } catch (error) {
      console.log(error);
    }
  };

  const onPageLoad = async () => {
    // await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();

    if (presaleStarted) {
      await checkIfPresaleEnded();
    }

    getRemainingTokens();

    // check if presale has started

    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();

      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5000);

    setInterval(async () => {
      getRemainingTokens();
    }, 5000);
  };

  const PresaleMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      let txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });

      await txn.wait();

      alert("Congrats You minted a Crypto Dev");
      getRemainingTokens();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const PublicMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      let txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });

      await txn.wait();

      alert("Congrats You minted a Crypto Dev");
      getRemainingTokens();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disabledInjectedProvider: false,
      });
      onPageLoad();
    }
  });

  const getRemainingTokens = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      const remainingTokens = await nftContract.tokenIds();

      setTokensLeft(remainingTokens.toString());
    } catch (error) {
      console.log(error);
    }
  };

  const renderPage = () => {
    if (!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connect Wallet
        </button>
      );
    }
    if (isOwner && !preSaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale 🚬
        </button>
      );
    }

    if (loading) {
      return <div className={styles.description}>Loading...</div>;
    }

    if (!preSaleStarted) {
      return <div className={styles.description}>Presale has not started yet</div>;
    }
    if (preSaleStarted && !preSaleEnded) {
      return (
        <div className={styles.description}>
          <span>If you are whitelisted! Mint your CryptoDev</span>
          <button className={styles.button} onClick={PresaleMint}>
            Presale Mint 🚀🚀
          </button>
        </div>
      );
    }
    if (preSaleEnded) {
      return (
        <div className={styles.description}>
          <span>Presale ended! Mint your CryptoDev</span>
          <button className={styles.button} onClick={PublicMint}>
            {" "}
            Mint a Crypto Dev 🚀👽
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs NFT Collection </title>
      </Head>

      <main className={styles.main}>
        <div className={styles.div}>
          <h1 className={styles.title}>Welcome to Crypto-Devs NFT Collection</h1>
          <span className={styles.description}>
            Crypto-Devs is an NFT Collection for WEB3 Developers
          </span>
          {renderPage()}
          <span className={styles.description}>Tokens Minted: {tokensLeft}/20 </span>
        </div>

        <div>
          <img className={styles.image} src="/cryptodevs/0.svg" alt="" />
        </div>
      </main>
      <footer className={styles.footer}>Made with &#10084; by Crypto Devs</footer>
    </div>
  );
}
