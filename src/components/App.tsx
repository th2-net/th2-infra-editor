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

import { hot } from 'react-hot-loader/root';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { ToastProvider } from 'react-toast-notifications';
import Toast from './notifications/Toast';
import Header from './Header';
import Groups from './groups/Groups';
import SplashScreen from './SplashScreen';
import History from './util/History';
import useRootStore from '../hooks/useRootStore';
import '../styles/root.scss';
import Notifier from './notifications/Notifier';

function App() {
	const { rootStore } = useRootStore();

	React.useEffect(() => {
		rootStore.init();
	}, []);

	return (
		<div className='root'>
			<ToastProvider placement='top-right' components={{ Toast }} transitionDuration={400}>
				<History />
				<Header />
				{rootStore.schemasStore.isLoading ? (
					<SplashScreen />
				) : (
					rootStore.schemasStore.boxes.length > 0 && <Groups />
				)}
				<Notifier />
			</ToastProvider>
		</div>
	);
}

export default hot(observer(App));
