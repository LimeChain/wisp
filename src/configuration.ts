import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const YAML_CONFIG_FILENAME = '../config/config.yaml';

export default () => {
  return yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};

export type NetworkConfig = {
  name: string,
  rpcUrl: string,
  chainId: number,
  contractAddress: string,
  privateKey: string
}
