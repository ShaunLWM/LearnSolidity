import { Web3Provider } from "@ethersproject/providers";
import { Button } from "@mantine/core";
import { useWeb3React } from "@web3-react/core";
import React, { useEffect, useState } from "react";
import { Account } from "./component/Home/Account";
import { Balance } from "./component/Home/Balance";
import { ChainId } from "./component/Home/ChainId";
import { useEagerConnect } from "./hooks/useEagerConnect";
import { useInactiveListener } from "./hooks/useInactiveListener";
import { getErrorMessage } from "./utils/Helper";
import { injected } from "./utils/web3React";

function App() {
	const context = useWeb3React<Web3Provider>();
	const { connector, library, chainId, account, activate, deactivate, active, error } = context;
	const [activatingConnector, setActivatingConnector] = useState<any>();

	useEffect(() => {
		if (activatingConnector && activatingConnector === connector) {
			setActivatingConnector(undefined);
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
			{(account || active) && <Button onClick={() => deactivate()}>Disconnect</Button>}
			<Account />
			<Balance />
			<ChainId />
			{error && <h4 style={{ marginTop: "1rem", marginBottom: "0" }}>{getErrorMessage(error)}</h4>}
		</div>
	);
}

export default App;
