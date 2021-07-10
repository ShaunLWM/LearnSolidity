import { Web3Provider } from "@ethersproject/providers";
import { Button } from "@mantine/core";
import { useWeb3React } from "@web3-react/core";
import React, { useEffect, useState } from "react";
import { useEagerConnect } from "./hooks/useEagerConnect";
import { useInactiveListener } from "./hooks/useInactiveListener";
import { injected } from "./utils/web3React";

function App() {
	const context = useWeb3React<Web3Provider>();
	const { connector, library, chainId, account, activate, deactivate, active, error } = context;
	const [activatingConnector, setActivatingConnector] = useState<any>();
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		if (activatingConnector && activatingConnector === connector) {
			setActivatingConnector(undefined);
		}

		if (connector === injected) {
			setConnected(true);
		}
	}, [activatingConnector, connector]);

	useEffect(() => {
		error && console.error(error);
	}, [error]);

	// handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
	const triedEager = useEagerConnect();

	// handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
	useInactiveListener(!triedEager || !!activatingConnector);

	const onActivate = () => {
		setActivatingConnector(injected);
		activate(injected);
	};

	return (
		<div className="App">
			{!account && <Button onClick={onActivate}>Login</Button>}
			{account && <Button onClick={() => deactivate()}>Disconnect</Button>}
			<p>{account}</p>
			<p>{active}</p>
			<p>Chain: {chainId}</p>
		</div>
	);
}

export default App;
