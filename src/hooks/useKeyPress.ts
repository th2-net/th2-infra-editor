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

export function useKeyPress(targetKey: string) {
	const [isKeyPressed, setIsKeyPressed] = React.useState(false);

	function downHandler(e: KeyboardEvent) {
		if (e.key === targetKey) {
			setIsKeyPressed(true);
		}
	}

	const upHandler = (e: KeyboardEvent) => {
		if (e.key === targetKey) {
			setIsKeyPressed(false);
		}
	};

	React.useEffect(() => {
		window.addEventListener('keydown', downHandler);
		window.addEventListener('keyup', upHandler);
		return () => {
			window.removeEventListener('keydown', downHandler);
			window.removeEventListener('keyup', upHandler);
		};
	}, []);

	return isKeyPressed;
}
