import { SplitFactory as NativeSplitFactory } from "@splitsoftware/splitio";
import SplitIO, {
  IClient,
  SplitKey,
  TreatmentWithConfig,
} from "@splitsoftware/splitio/types/splitio";

let instance: SplitClient | null = null;
const READY_TIMEOUT = 5000; // 5s is default timeout for split.io sdk
const key = process.env.SPLIT_API_KEY || "foo";

export default class SplitClient {
  protected factory: SplitIO.ISDK | null = null;
  protected client: IClient | null = null;
  protected isReady: boolean = false;
  constructor() {
    this.factory = NativeSplitFactory({
      core: {
        authorizationKey: key,
      },
    });
    this.client = this.factory.client();
    // Set a callback to listen for the SDK_READY event, to make sure the SDK is properly loaded before asking for a treatment
    this.client.on(this.client.Event.SDK_READY, () => {
      this.isReady = true;
    });
  }

  async getTreatment(
    key: SplitKey,
    splitName: string
  ): Promise<TreatmentWithConfig | undefined> {
    if (!this.isReady) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              "Something went wrong with SplitIO connection. Please contact with administrator"
            )
          );
        }, READY_TIMEOUT);
        this.client?.on(this.client?.Event.SDK_READY, async () => {
          clearTimeout(timeout);
          resolve(await this.getTreatment(key, splitName));
        });
      });
    }
    return this.client?.getTreatmentWithConfig(key, splitName);
  }

  async getTreatmentWithSplitName(
    splitName: string
  ): Promise<TreatmentWithConfig | undefined> {
    if (!this.isReady) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              "Something went wrong with SplitIO connection. Please contact with administrator"
            )
          );
        }, READY_TIMEOUT);
        this.client?.on(this.client?.Event.SDK_READY, async () => {
          clearTimeout(timeout);
          resolve(this.getTreatmentWithSplitName(splitName));
        });
      });
    }
    return this.client?.getTreatmentWithConfig(splitName);
  }

  /**
   * Run this method `afterAll` unit tests
   */
  async destroy() {
    await this.client?.destroy();
    this.client = null;
  }

  static create() {
    if (instance) {
      return instance;
    }
    instance = new SplitClient();
    return instance;
  }
}

const split = new SplitClient();
const treatment = split.getTreatment("xxx", "licensed_product_fee");
treatment.then((treat) => console.log("got treatment", treat));
