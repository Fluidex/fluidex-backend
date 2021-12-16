import { assert } from 'console';
import { ethers } from 'ethers';
import { Account } from 'fluidex.js';
import { getTestAccount } from './accounts';

import { abi as fluidexAbi } from '../contracts/artifacts/contracts/IFluiDexDelegate.sol/IFluiDexDelegate.json';
import { abi as tokenAbi } from '../faucet/layer1/contracts/artifacts/contracts/ERC20Token.sol/ERC20Token.json';
import { infuraApiKey } from '../contracts/secrets.json';
import tokens from '/tmp/tokens.json';
import deployed from '/tmp/deployed.json';

const amount = 5e11;
const fluidexDelegateAddr = deployed.FluiDexDelegate;
// const fluidexAddr = deployed.FluiDexDemo;

async function main() {
  const provider = new ethers.providers.InfuraProvider('goerli', infuraApiKey);
  let erc20Txs = new Array();
  for (let i = 0; i < 4; ++i) {
    const account = getTestAccount(i);
    const bjjPubKey = Account.fromMnemonic(account.mnemonic).bjjPubKey;
    const wallet = ethers.Wallet.fromMnemonic(account.mnemonic);
    const walletSigner = wallet.connect(provider);
    // let nonce = await walletSigner.getTransactionCount();
    
    for (const token of tokens) {
      const tokenContract = new ethers.Contract(token.address, tokenAbi, walletSigner);
      const mint = tokenContract.functions.mint;
      const increaseAllowance = tokenContract.functions.increaseAllowance;
      // const mintTx = mint(wallet.address, amount, { nonce: nonce++ });
      const mintTx = await mint(wallet.address, amount);
      await mintTx.wait(1);
      // const increaseAllowanceTx = increaseAllowance(fluidexDelegateAddr, amount, { nonce: nonce++ });
      const increaseAllowanceTx = await increaseAllowance(fluidexDelegateAddr, amount);
      await increaseAllowanceTx.wait(1);
      // erc20Txs.push(mintTx);
      // erc20Txs.push(increaseAllowanceTx);

      const fluidexContract = new ethers.Contract(fluidexDelegateAddr, fluidexAbi, walletSigner);
      const depositERC20 = fluidexContract.functions.depositERC20;
      // const tx = depositERC20(token.address, bjjPubKey, amount, { nonce: nonce++, gasLimit: 2.5e7 });
      const tx = await depositERC20(token.address, bjjPubKey, amount, { gasLimit: 2.5e7 });
      await tx.wait(1);
      // erc20Txs.push(tx);
    }
    // console.log('batch send transcations for ', walletSigner.address);
    console.log('batch send transcations for ', walletSigner.address);
  }
  // console.log('wait for all transcation got 1 confirmations');
  // @ts-ignore
  // await Promise.all(erc20Txs.map((tx) => tx.then((receipt) => receipt.wait(1)).catch((e) => console.log('error occurs: %s\nwait for all transcations for clean shutdown'))));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });