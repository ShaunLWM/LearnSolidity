import { Address } from "../../utils/AddressHelper";

const keys = ["multicall", "counter", "auction"] as const;

type AddressKey = {
  [key in typeof keys[number]]: Address;
};

const contracts: AddressKey = {
  multicall: {
    1337: "0xf79FB4A3D5d51130f257CDD0C422e6aF3E83Ae7a",
  },
  counter: {
    1337: "0x8a1A1c315E4E354eB380bEa3e89fc5293397d701",
  },
  auction: {
    1337: "0x38836793314a21C29dcde83A52A2bF9e7d392C94",
  },
} as const;

export default contracts;
