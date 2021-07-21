import { deployments } from "hardhat";
import { setupAccounts } from "../utils/Accounts";

export const setupTest = deployments.createFixture(async (hre, options) => {
  await deployments.fixture();
  const accounts = await setupAccounts();
  return accounts;
});

