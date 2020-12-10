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
import useHistoryStore from '../../hooks/useHistoryStore';
import { useKeyPress } from '../../hooks/useKeyPress';

function History() {
	const historyStore = useHistoryStore();

	const isCtrlKeyPressed = useKeyPress('Control');
	const isZKeyPressed = useKeyPress('z');
	const isYKeyPressed = useKeyPress('y');

	React.useEffect(() => {
		if (isCtrlKeyPressed && isZKeyPressed) {
			historyStore.toPreviousSnapshot();
		}
		if (isCtrlKeyPressed && isYKeyPressed) {
			historyStore.toNextSnapshot();
		}
	}, [isCtrlKeyPressed, isZKeyPressed, isYKeyPressed]);

	return null;
}

export default observer(History);
