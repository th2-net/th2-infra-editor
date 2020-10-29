/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { observer } from 'mobx-react-lite';
import Header from './Header';
import Groups from './groups/Groups';
import useRootStore from '../hooks/useRootStore';
import '../styles/root.scss';
import SplashScreen from './SplashScreen';
import useHistoryStore from '../hooks/useHistoryStore';
import { useKeyPress } from '../hooks/useKeyPress';

function App() {
	const { rootStore } = useRootStore();
	const historyStore = useHistoryStore();

	React.useEffect(() => {
		rootStore.init();
	}, []);

	const isCtrlKeyPressed = useKeyPress('Control');
	const isZKeyPressed = useKeyPress('z');
	const isYKeyPressed = useKeyPress('y');

	React.useEffect(() => {
		if (isCtrlKeyPressed) {
			if (isZKeyPressed) {
				historyStore.toPreviousSnapshot();
			}
			if (isYKeyPressed) {
				historyStore.toNextSnapshot();
			}
		}
	}, [isCtrlKeyPressed, isZKeyPressed, isYKeyPressed]);

	return (
		<div className="root">
			<Header />
			{
				rootStore.schemasStore.isLoading
					? <SplashScreen />
					: rootStore.schemasStore.boxes.length > 0
					&& <Groups />
			}
		</div>
	);
}

export default observer(App);
