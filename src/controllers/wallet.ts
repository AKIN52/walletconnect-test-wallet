import { Wallet, providers, utils } from "ethers";
import { getChainData } from "../helpers/utilities";
import { setLocal, getLocal } from "../helpers/local";
import {
  ENTROPY_KEY,
  MNEMONIC_KEY,
  DEFAULT_ACTIVE_INDEX,
  DEFAULT_CHAIN_ID,
} from "../constants/default";
import { getAppConfig } from "../config";

export class WalletController {
  public path: string;
  public entropy: string;
  public mnemonic: string;
  public wallet: Wallet;

  public activeIndex: number = DEFAULT_ACTIVE_INDEX;
  public activeChainId: number = DEFAULT_CHAIN_ID;

  constructor() {
    this.path = this.getPath();
    this.entropy = this.getEntropy();
    this.mnemonic = this.getMnemonic();
    this.wallet = this.init();
  }

  get provider(): providers.Provider {
    return this.wallet.provider;
  }

  public isActive() {
    if (!this.wallet) {
      return this.wallet;
    }
    return null;
  }

  public getIndex() {
    return this.activeIndex;
  }

  public getWallet(index?: number, chainId?: number): Wallet {
    if (!this.wallet || this.activeIndex === index || this.activeChainId === chainId) {
      return this.init(index, chainId);
    }
    return this.wallet;
  }

  public getAccounts(count = getAppConfig().numberOfAccounts) {
    const accounts = [];
    let wallet = null;
    for (let i = 0; i < count; i++) {
      wallet = this.generateWallet(i);
      accounts.push(wallet.address);
    }
    return accounts;
  }

  public getData(key: string): string {
    let value = getLocal(key);
    if (!value) {
      switch (key) {
        case ENTROPY_KEY:
          value = this.generateEntropy();
          break;
        case MNEMONIC_KEY:
          value = this.generateMnemonic();
          break;
        default:
          throw new Error(`Unknown data key: ${key}`);
      }
      setLocal(key, value);
    }
    return value;
  }

  public getPath(index: number = this.activeIndex) {
    this.path = `${getAppConfig().derivationPath}/${index}`;
    return this.path;
  }

  public generateEntropy(): string {
    this.entropy = utils.hexlify(utils.randomBytes(16));
    return this.entropy;
  }

  public generateMnemonic() {
    this.mnemonic = utils.entropyToMnemonic(this.getEntropy());
    return this.mnemonic;
  }

  public generateWallet(index: number) {
    this.wallet = Wallet.fromMnemonic(this.getMnemonic(), this.getPath(index));
    return this.wallet;
  }

  public getEntropy(): string {
    return this.getData(ENTROPY_KEY);
  }

  public getMnemonic(): string {
    return this.getData(MNEMONIC_KEY);
  }

  public init(index = DEFAULT_ACTIVE_INDEX, chainId = DEFAULT_CHAIN_ID): Wallet {
    return this.update(index, chainId);
  }

  public update(index: number, chainId: number): Wallet {
    const firstUpdate = typeof this.wallet === "undefined";
    this.activeIndex = index;
    this.activeChainId = chainId;
    const rpcUrl = getChainData(chainId).rpc_url;
    this.wallet = this.generateWallet(index);
    const provider = new providers.JsonRpcProvider(rpcUrl);
    this.wallet.connect(provider);
    if (!firstUpdate) {
      // update another controller if necessary here
    }
    return this.wallet;
  }

  public async sendTransaction(transaction: any) {
    if (this.wallet) {
      if (
        transaction.from &&
        transaction.from.toLowerCase() !== this.wallet.address.toLowerCase()
      ) {
        console.error("Transaction request From doesn't match active account");
      }

      if (transaction.from) {
        delete transaction.from;
      }

      // js expects gasLimit instead
      if ("gas" in transaction) {
        transaction.gasLimit = transaction.gas;
        delete transaction.gas;
      }

      const result = await this.wallet.sendTransaction(transaction);
      return result.hash;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signTransaction(data: any) {
    if (this.wallet) {
      if (data && data.from) {
        delete data.from;
      }
      const result = await this.wallet.signMessage(data);
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signMessage(data: any) {
    if (this.wallet) {
      const signingKey = new utils.SigningKey(this.wallet.privateKey);
      const sigParams = await signingKey.signDigest(utils.arrayify(data));
      const result = await utils.joinSignature(sigParams);
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signPersonalMessage(message: any) {
    if (this.wallet) {
      const result = await this.wallet.signMessage(
        utils.isHexString(message) ? utils.arrayify(message) : message,
      );
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }
}

export function getWalletController() {
  return new WalletController();
}
