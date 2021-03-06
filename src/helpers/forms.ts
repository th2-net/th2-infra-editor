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

import { InputConfig } from '../hooks/useInput';
import { SelectConfig } from '../hooks/useSelect';

export function isValidJSONObject(value: string) {
	if (value.length === 0) return true;
	try {
		const config = JSON.parse(value);
		return typeof config === 'object';
	} catch {
		return false;
	}
}

export function isInputConfig(object: unknown): object is InputConfig {
	return (
		typeof object === 'object' && object !== null && (object as InputConfig).reset !== undefined
	);
}

export function isSelectConfig(object: unknown): object is SelectConfig {
	return (
		typeof object === 'object' &&
		object !== null &&
		(object as SelectConfig).variants !== undefined
	);
}
