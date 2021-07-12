import { Address } from "../../utils/AddressHelper";

// TODO: generate keys

const contracts: Record<string, Address> = {
	multicall: {
		1337: "0xf79FB4A3D5d51130f257CDD0C422e6aF3E83Ae7a",
	},
	counter: {
		1337: "0x8a1A1c315E4E354eB380bEa3e89fc5293397d701",
	},
	auction: {
		1337: "0x2B322d5F1D45c8e19378980f6CaCd04085c5C4b5",
	},
} as const;

export default contracts;
